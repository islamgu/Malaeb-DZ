import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { TopBar } from '../../components/shared/TopBar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { bookingsApi, Booking } from '../../services/api';
import { useTranslation } from '../../translations';

export const MyBookingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchBookings();
        }, [])
    );

    const fetchBookings = async () => {
        try {
            const data = await bookingsApi.getMyBookings();
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async (bookingId: string) => {
        Alert.alert(
            t.booking.cancelBooking,
            t.common.confirm + '?',
            [
                { text: t.common.cancel, style: 'cancel' },
                {
                    text: t.common.confirm,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await bookingsApi.cancel(bookingId);
                            setBookings(bookings.filter((b) => b.id !== bookingId));
                        } catch (error) {
                            Alert.alert(t.common.error, t.common.error);
                        }
                    },
                },
            ]
        );
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'secondary' => {
        switch (status) {
            case 'ACCEPTED':
                return 'success';
            case 'REJECTED':
            case 'CANCELLED':
                return 'error';
            case 'PENDING':
                return 'warning';
            default:
                return 'secondary';
        }
    };

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'ACCEPTED':
                return t.booking.accepted;
            case 'REJECTED':
                return t.booking.rejected;
            case 'CANCELLED':
                return t.booking.cancelled;
            case 'PENDING':
                return t.booking.pending;
            default:
                return status.toLowerCase();
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-background">
                <TopBar title={t.booking.yourBookings} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22C55E" />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <TopBar title={t.booking.yourBookings} />

            {bookings.length === 0 ? (
                <View className="flex-1 items-center justify-center p-12">
                    <Calendar size={48} color="#D1D5DB" />
                    <Text className="text-lg font-semibold text-foreground mt-3 mb-1">{t.booking.noBookings}</Text>
                    <Text className="text-gray-500 text-center">{t.booking.yourBookings}</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ItemSeparatorComponent={() => <View className="h-4" />}
                    onRefresh={fetchBookings}
                    refreshing={isLoading}
                    renderItem={({ item: booking }) => (
                        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            <View className="p-4 gap-3">
                                <View className="flex-row items-start justify-between gap-3">
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-foreground mb-1">
                                            {booking.stadiumName}
                                        </Text>
                                        <View className="flex-row items-center gap-1">
                                            <Calendar size={16} color="#6B7280" />
                                            <Text className="text-gray-600 text-sm">{formatDate(booking.startAt)}</Text>
                                        </View>
                                    </View>
                                    <Badge variant={getStatusVariant(booking.status)}>
                                        <Text
                                            className={`text-xs font-medium capitalize ${booking.status === 'ACCEPTED'
                                                ? 'text-green-700'
                                                : booking.status === 'PENDING'
                                                    ? 'text-orange-700'
                                                    : booking.status === 'REJECTED' || booking.status === 'CANCELLED'
                                                        ? 'text-red-700'
                                                        : 'text-gray-700'
                                                }`}
                                        >
                                            {booking.status.toLowerCase()}
                                        </Text>
                                    </Badge>
                                </View>

                                <View className="flex-row items-center gap-4">
                                    <View className="flex-row items-center gap-1">
                                        <Clock size={16} color="#6B7280" />
                                        <Text className="text-gray-600 text-sm">
                                            {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                                        </Text>
                                    </View>
                                    <Text className="text-primary font-semibold">
                                        {booking.price.toLocaleString()} DZD
                                    </Text>
                                </View>

                                {booking.status === 'PENDING' && (
                                    <View className="flex-row gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onPress={() => handleCancel(booking.id)}
                                        >
                                            Cancel Booking
                                        </Button>
                                    </View>
                                )}

                                {booking.status === 'ACCEPTED' && (
                                    <View className="bg-green-50 rounded-xl p-3 flex-row items-center gap-2">
                                        <CheckCircle size={20} color="#16A34A" />
                                        <Text className="text-sm text-green-800">Booking confirmed. See you there!</Text>
                                    </View>
                                )}

                                {(booking.status === 'REJECTED' || booking.status === 'CANCELLED') && (
                                    <View className="bg-red-50 rounded-xl p-3 flex-row items-center gap-2">
                                        <XCircle size={20} color="#DC2626" />
                                        <Text className="text-sm text-red-800">
                                            {booking.status === 'CANCELLED'
                                                ? 'This booking was cancelled'
                                                : 'This booking was rejected'}
                                        </Text>
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
