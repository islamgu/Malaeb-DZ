import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Calendar, Clock, User, Mail, Check, X, MessageSquare } from 'lucide-react-native';
import { TopBar } from '../../components/shared/TopBar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { bookingsApi, Booking } from '../../services/api';
import { useTranslation } from '../../translations';

export const BookingsQueueScreen: React.FC = () => {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'PENDING' | 'ACCEPTED'>('all');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const data = await bookingsApi.getAllBookings();
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            Alert.alert(t.common.error, t.errors.failedToLoadBookings);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBookings = bookings.filter(
        b => selectedStatus === 'all' || b.status === selectedStatus
    );

    const handleAccept = async (bookingId: string) => {
        try {
            await bookingsApi.updateStatus(bookingId, 'ACCEPTED');
            setBookings(bookings.map(b =>
                b.id === bookingId ? { ...b, status: 'ACCEPTED' as const } : b
            ));
        } catch (error) {
            Alert.alert(t.common.error, t.errors.failedToAccept);
        }
    };

    const handleReject = async (bookingId: string) => {
        try {
            await bookingsApi.updateStatus(bookingId, 'REJECTED');
            setBookings(bookings.map(b =>
                b.id === bookingId ? { ...b, status: 'REJECTED' as const } : b
            ));
        } catch (error) {
            Alert.alert(t.common.error, t.errors.failedToReject);
        }
    };

    const filterOptions = [
        { value: 'all' as const, label: t.common.all },
        { value: 'PENDING' as const, label: t.booking.pending },
        { value: 'ACCEPTED' as const, label: t.booking.accepted },
    ];

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB');
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-background">
                <TopBar title={t.admin.bookingsQueue} showBack />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22C55E" />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <TopBar title={t.admin.bookingsQueue} showBack />

            <View className="px-4 py-4">
                {/* Filter Tabs */}
                <View className="flex-row gap-2 mb-4">
                    {filterOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => setSelectedStatus(option.value)}
                            className={`px-4 py-2 rounded-full ${selectedStatus === option.value
                                ? 'bg-primary'
                                : 'bg-white'
                                }`}
                        >
                            <Text className={`text-sm font-medium ${selectedStatus === option.value
                                ? 'text-white'
                                : 'text-foreground'
                                }`}>
                                {option.label}
                                {option.value !== 'all' && (
                                    <Text> ({bookings.filter(b => b.status === option.value).length})</Text>
                                )}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <View className="flex-1 items-center justify-center p-12">
                    <Calendar size={48} color="#D1D5DB" />
                    <Text className="text-lg font-semibold text-foreground mt-3 mb-1">{t.admin.noBookingsFound}</Text>
                    <Text className="text-gray-500 text-center">
                        {selectedStatus === 'PENDING'
                            ? t.admin.noPendingBookings
                            : t.admin.noBookingsToShow}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                    ItemSeparatorComponent={() => <View className="h-4" />}
                    onRefresh={fetchBookings}
                    refreshing={isLoading}
                    renderItem={({ item: booking }) => (
                        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            <View className="p-4 gap-3">
                                {/* Header */}
                                <View className="flex-row items-start justify-between gap-3">
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-foreground mb-1">{booking.stadiumName}</Text>
                                        <View className="flex-row items-center gap-1">
                                            <User size={16} color="#6B7280" />
                                            <Text className="text-sm text-gray-600">{booking.userName || t.common.unknown}</Text>
                                        </View>
                                    </View>
                                    <Badge variant={
                                        booking.status === 'PENDING' ? 'warning' :
                                            booking.status === 'ACCEPTED' ? 'success' : 'error'
                                    }>
                                        <Text className={`text-xs font-medium capitalize ${booking.status === 'PENDING' ? 'text-orange-700' :
                                            booking.status === 'ACCEPTED' ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            {booking.status === 'PENDING' ? t.booking.pending.toLowerCase() :
                                                booking.status === 'ACCEPTED' ? t.booking.accepted.toLowerCase() :
                                                    booking.status === 'REJECTED' ? t.booking.rejected.toLowerCase() :
                                                        booking.status.toLowerCase()}
                                        </Text>
                                    </Badge>
                                </View>

                                {/* Details */}
                                <View className="gap-2">
                                    <View className="flex-row items-center gap-2">
                                        <Mail size={16} color="#6B7280" />
                                        <Text className="text-sm text-gray-600">{booking.userEmail || t.common.noEmail}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <Calendar size={16} color="#6B7280" />
                                        <Text className="text-sm text-gray-600">
                                            {formatDate(booking.startAt)}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <Clock size={16} color="#6B7280" />
                                        <Text className="text-sm text-gray-600">
                                            {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Price */}
                                <View className="bg-gray-100 rounded-xl p-3 flex-row items-center justify-between">
                                    <Text className="text-gray-700">{t.booking.totalAmount}</Text>
                                    <Text className="text-primary font-semibold">{booking.price.toLocaleString()} DZD</Text>
                                </View>

                                {/* Actions */}
                                {booking.status === 'PENDING' && (
                                    <View className="flex-row gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onPress={() => handleReject(booking.id)}
                                            className="flex-1 border-red-200"
                                        >
                                            <View className="flex-row items-center">
                                                <X size={16} color="#DC2626" />
                                                <Text className="text-red-600 font-medium ml-1">{t.admin.reject}</Text>
                                            </View>
                                        </Button>
                                        <TouchableOpacity
                                            onPress={() => handleAccept(booking.id)}
                                            className="flex-1 h-9 bg-green-600 rounded-xl items-center justify-center flex-row"
                                        >
                                            <Check size={16} color="white" />
                                            <Text className="text-white font-medium ml-1">{t.admin.accept}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
};
