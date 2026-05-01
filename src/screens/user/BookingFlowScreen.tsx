import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, MapPin, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/shared/TopBar';
import { Button } from '../../components/ui/Button';
import { stadiumsApi, bookingsApi, Stadium } from '../../services/api';
import { useTranslation } from '../../translations';

// Time slots
const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00',
];

export const BookingFlowScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedHours, setSelectedHours] = useState<string[]>([]);
    const [bookedHours, setBookedHours] = useState<string[]>([]);
    const [stadium, setStadium] = useState<Stadium | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        fetchStadium();
    }, [route.params?.id]);

    // Fetch booked slots whenever the date or stadium changes
    useEffect(() => {
        if (stadium?.id) {
            fetchBookedSlots();
        }
    }, [selectedDate, stadium?.id]);

    const fetchStadium = async () => {
        try {
            const data = await stadiumsApi.getById(route.params?.id);
            setStadium(data);
        } catch (error) {
            console.error('Failed to fetch stadium:', error);
            Alert.alert(t.common.error, t.errors.failedToLoadStadium);
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookedSlots = async () => {
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const slots = await bookingsApi.getBookedSlots(route.params?.id, dateStr);
            setBookedHours(slots);
        } catch (error) {
            console.error('Failed to fetch booked slots:', error);
            setBookedHours([]);
        }
    };

    if (isLoading || !stadium) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    if (bookingSuccess) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-6">
                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                    <CheckCircle size={40} color="#16A34A" />
                </View>
                <Text className="text-2xl font-bold text-foreground mb-2">{t.booking.bookingSubmitted}</Text>
                <Text className="text-gray-600 text-center mb-6">
                    {t.booking.bookingRequestSent}
                </Text>
                <View className="w-full max-w-xs gap-3">
                    <Button onPress={() => navigation.navigate('UserTabs')}>{t.stadium.backToHome}</Button>
                    <Button variant="outline" onPress={() => navigation.navigate('UserTabs', { screen: 'MyBookings' })}>
                        {t.booking.viewMyBookings}
                    </Button>
                </View>
            </View>
        );
    }

    const toggleHour = (hour: string) => {
        if (bookedHours.includes(hour)) return; // Can't select booked hours
        if (selectedHours.includes(hour)) {
            setSelectedHours(selectedHours.filter((h) => h !== hour));
        } else {
            setSelectedHours([...selectedHours, hour].sort());
        }
    };

    // Check if hour is premium (weekend evenings)
    const isPremiumHour = (hour: string) => {
        const day = selectedDate.getDay();
        const isWeekend = day === 5 || day === 6; // Friday or Saturday
        const hourNum = parseInt(hour.split(':')[0]);
        return stadium.isPremium && isWeekend && hourNum >= 18;
    };

    const calculateTotal = () => {
        return selectedHours.reduce((total, hour) => {
            const price = isPremiumHour(hour)
                ? stadium.pricePerHour * (stadium.premiumMultiplier || 1.5)
                : stadium.pricePerHour;
            return total + price;
        }, 0);
    };

    const handleBook = () => {
        if (selectedHours.length === 0) {
            Alert.alert(t.common.error, t.booking.selectAtLeastOneHour);
            return;
        }
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        setShowConfirmation(false);
        const sortedHours = [...selectedHours].sort();
        submitBooking(sortedHours);
    };

    const submitBooking = async (sortedHours: string[]) => {
        setIsBooking(true);
        try {
            const startHour = sortedHours[0];
            const endHour = sortedHours[sortedHours.length - 1];

            const startAt = new Date(selectedDate);
            startAt.setHours(parseInt(startHour.split(':')[0]), 0, 0, 0);

            const endAt = new Date(selectedDate);
            endAt.setHours(parseInt(endHour.split(':')[0]) + 1, 0, 0, 0);

            await bookingsApi.create({
                stadiumId: stadium.id,
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
                price: calculateTotal(),
                isPremium: selectedHours.some(isPremiumHour),
            });

            // Refresh booked slots and clear selection
            setSelectedHours([]);
            fetchBookedSlots();
            setBookingSuccess(true);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || t.errors.failedToCreateBooking;
            Alert.alert(t.common.error, errorMsg);
            // Refresh slots in case they changed
            fetchBookedSlots();
        } finally {
            setIsBooking(false);
        }
    };

    // Simple date selection (next 7 days)
    const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    return (
        <View className="flex-1 bg-white">
            <TopBar title={t.booking.bookStadium} showBack />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                {/* Stadium Info */}
                <View className="bg-gray-100 rounded-2xl p-4 mb-6">
                    <Text className="text-lg font-bold text-foreground mb-1">{stadium.name}</Text>
                    <Text className="text-gray-600">{stadium.city || stadium.address}</Text>
                    <Text className="text-primary font-semibold mt-2">
                        {stadium.pricePerHour.toLocaleString()} DZD{t.stadium.perHour}
                    </Text>
                </View>

                {/* Select Date */}
                <View className="mb-6">
                    <View className="flex-row items-center gap-2 mb-3">
                        <CalendarIcon size={20} color="#22C55E" />
                        <Text className="text-lg font-bold text-foreground">{t.booking.selectDate}</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                        <View className="flex-row gap-2">
                            {dates.map((date, index) => {
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            setSelectedDate(date);
                                            setSelectedHours([]);
                                        }}
                                        className={`w-16 py-3 rounded-xl items-center ${isSelected ? 'bg-primary' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Text className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Text>
                                        <Text className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                                            {date.getDate()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                {/* Select Hours */}
                <View className="mb-6">
                    <View className="flex-row items-center gap-2 mb-3">
                        <Clock size={20} color="#22C55E" />
                        <Text className="text-lg font-bold text-foreground">{t.booking.selectHours}</Text>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {timeSlots.map((hour) => {
                            const isSelected = selectedHours.includes(hour);
                            const isBooked = bookedHours.includes(hour);
                            const premium = isPremiumHour(hour);
                            const price = premium
                                ? stadium.pricePerHour * (stadium.premiumMultiplier || 1.5)
                                : stadium.pricePerHour;

                            return (
                                <TouchableOpacity
                                    key={hour}
                                    onPress={() => toggleHour(hour)}
                                    disabled={isBooked}
                                    className={`relative w-[31%] p-3 rounded-xl border-2 ${isBooked
                                        ? 'border-red-200 bg-red-50'
                                        : isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200'
                                        }`}
                                    style={isBooked ? { opacity: 0.6 } : undefined}
                                >
                                    <Text
                                        className={`text-center font-semibold ${isBooked
                                            ? 'text-red-400 line-through'
                                            : isSelected
                                                ? 'text-primary'
                                                : 'text-foreground'
                                            }`}
                                    >
                                        {hour}
                                    </Text>
                                    <Text className={`text-center text-xs mt-1 ${isBooked ? 'text-red-400' : 'text-gray-500'}`}>
                                        {isBooked
                                            ? (t.booking.booked || 'Booked')
                                            : `${Math.round(price).toLocaleString()} DZD`
                                        }
                                    </Text>
                                    {premium && !isBooked && (
                                        <View className="absolute -top-2 -right-2 bg-primary px-1.5 py-0.5 rounded-full">
                                            <Text className="text-white text-xs font-bold">P</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {stadium.isPremium && (
                        <View className="flex-row items-start gap-2 mt-4 p-3 bg-green-50 rounded-xl">
                            <AlertCircle size={20} color="#22C55E" />
                            <Text className="flex-1 text-sm text-gray-700">
                                {t.booking.premiumHoursInfo}{' '}
                                {Math.round(stadium.pricePerHour * (stadium.premiumMultiplier || 1.5)).toLocaleString()}{' '}
                                DZD{t.stadium.perHour}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Summary */}
                {selectedHours.length > 0 && (
                    <View className="bg-gray-100 rounded-2xl p-4">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-700">{t.booking.selectedHours}</Text>
                            <Text className="font-semibold">{selectedHours.length}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-700">{t.booking.time}</Text>
                            <Text className="font-semibold">
                                {selectedHours[0]} - {selectedHours[selectedHours.length - 1]}
                            </Text>
                        </View>
                        <View className="flex-row justify-between pt-2 border-t border-gray-300">
                            <Text className="text-lg font-bold">{t.booking.total}</Text>
                            <Text className="text-lg font-bold text-primary">
                                {Math.round(calculateTotal()).toLocaleString()} DZD
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"
                style={{ paddingBottom: insets.bottom + 16 }}
            >
                <Button onPress={handleBook} disabled={selectedHours.length === 0 || isBooking}>
                    {isBooking ? t.booking.booking : t.booking.confirmBooking}
                </Button>
            </View>

            {/* Confirmation Modal */}
            <Modal
                visible={showConfirmation}
                transparent
                animationType="fade"
                onRequestClose={() => setShowConfirmation(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 24,
                    }}
                >
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        activeOpacity={1}
                        onPress={() => setShowConfirmation(false)}
                    />

                    <View
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 24,
                            width: '100%',
                            maxWidth: 380,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <View style={{
                            backgroundColor: '#22C55E',
                            paddingVertical: 20,
                            paddingHorizontal: 24,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                                {t.booking.confirmBooking || 'Confirm Booking'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowConfirmation(false)}>
                                <X size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <View style={{ padding: 24, gap: 16 }}>
                            {/* Stadium */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <MapPin size={22} color="#22C55E" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>
                                        {t.stadium.stadium || 'Stadium'}
                                    </Text>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                                        {stadium.name}
                                    </Text>
                                </View>
                            </View>

                            {/* Date */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CalendarIcon size={22} color="#22C55E" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>
                                        {t.booking.selectDate || 'Date'}
                                    </Text>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                                        {selectedDate.toLocaleDateString('en-GB', {
                                            weekday: 'long', day: 'numeric', month: 'long',
                                        })}
                                    </Text>
                                </View>
                            </View>

                            {/* Time */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Clock size={22} color="#22C55E" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>
                                        {t.booking.time || 'Time'}
                                    </Text>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                                        {[...selectedHours].sort()[0]} - {[...selectedHours].sort().slice(-1)[0]}
                                        {'  '}
                                        <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280' }}>
                                            ({selectedHours.length} {selectedHours.length === 1 ? 'hour' : 'hours'})
                                        </Text>
                                    </Text>
                                </View>
                            </View>

                            {/* Divider + Total */}
                            <View style={{
                                borderTopWidth: 1, borderTopColor: '#E5E7EB',
                                paddingTop: 16, marginTop: 4,
                                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                                    {t.booking.total || 'Total'}
                                </Text>
                                <Text style={{ fontSize: 24, fontWeight: '800', color: '#22C55E' }}>
                                    {Math.round(calculateTotal()).toLocaleString()} DZD
                                </Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 10 }}>
                            <Button onPress={handleConfirm}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle size={20} color="white" />
                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                                        {t.common.confirm || 'Confirm'}
                                    </Text>
                                </View>
                            </Button>
                            <TouchableOpacity
                                onPress={() => setShowConfirmation(false)}
                                style={{
                                    paddingVertical: 14, borderRadius: 12,
                                    alignItems: 'center', backgroundColor: '#F3F4F6',
                                }}
                            >
                                <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 15 }}>
                                    {t.common.cancel || 'Cancel'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
