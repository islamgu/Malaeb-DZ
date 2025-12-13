import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle } from 'lucide-react-native';
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
    const [stadium, setStadium] = useState<Stadium | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        fetchStadium();
    }, [route.params?.id]);

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

    const handleBook = async () => {
        if (selectedHours.length === 0) {
            Alert.alert(t.common.error, t.booking.selectAtLeastOneHour);
            return;
        }

        setIsBooking(true);
        try {
            // Create start and end times
            const sortedHours = [...selectedHours].sort();
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

            setBookingSuccess(true);
        } catch (error: any) {
            Alert.alert(t.common.error, error.response?.data?.error || t.errors.failedToCreateBooking);
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
                            const premium = isPremiumHour(hour);
                            const price = premium
                                ? stadium.pricePerHour * (stadium.premiumMultiplier || 1.5)
                                : stadium.pricePerHour;

                            return (
                                <TouchableOpacity
                                    key={hour}
                                    onPress={() => toggleHour(hour)}
                                    className={`relative w-[31%] p-3 rounded-xl border-2 ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                                        }`}
                                >
                                    <Text
                                        className={`text-center font-semibold ${isSelected ? 'text-primary' : 'text-foreground'
                                            }`}
                                    >
                                        {hour}
                                    </Text>
                                    <Text className="text-center text-xs text-gray-500 mt-1">
                                        {Math.round(price).toLocaleString()} DZD
                                    </Text>
                                    {premium && (
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
        </View>
    );
};
