import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar as CalendarIcon, Clock, X, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/shared/TopBar';
import { Button } from '../../components/ui/Button';
import { stadiumsApi, Stadium } from '../../services/api';
import { useTranslation } from '../../translations';

const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00',
];

export const AvailabilityEditorScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [availableHours, setAvailableHours] = useState<string[]>(timeSlots);
    const [showSuccess, setShowSuccess] = useState(false);
    const [stadium, setStadium] = useState<Stadium | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStadium();
    }, [route.params?.id]);

    const fetchStadium = async () => {
        try {
            const data = await stadiumsApi.getById(route.params?.id);
            setStadium(data);
        } catch (error) {
            Alert.alert(t.common.error, t.errors.failedToLoadStadium);
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const toggleHour = (hour: string) => {
        if (availableHours.includes(hour)) {
            setAvailableHours(availableHours.filter((h) => h !== hour));
        } else {
            setAvailableHours([...availableHours, hour].sort());
        }
    };

    const handleSave = () => {
        // In production, this would save to the backend
        setShowSuccess(true);
        setTimeout(() => {
            navigation.navigate('StadiumsList');
        }, 1500);
    };

    // Simple date selection (next 7 days)
    const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    if (!stadium) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <Text>{t.stadium.notFound}</Text>
            </View>
        );
    }

    if (showSuccess) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-6">
                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                    <CheckCircle size={40} color="#16A34A" />
                </View>
                <Text className="text-2xl font-bold text-foreground mb-2">{t.admin.availabilityUpdated}</Text>
                <Text className="text-gray-600 text-center mb-6">
                    {t.admin.availabilitySaved}
                </Text>
                <View className="w-full max-w-xs gap-3">
                    <Button onPress={() => navigation.navigate('AdminDashboard')}>{t.admin.backToDashboard}</Button>
                    <Button variant="outline" onPress={() => navigation.navigate('StadiumsList')}>
                        {t.admin.viewStadiums}
                    </Button>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <TopBar title={t.admin.editAvailability} showBack />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                {/* Stadium Info */}
                <View className="bg-gray-100 rounded-2xl p-4 mb-6">
                    <Text className="text-lg font-bold text-foreground mb-1">{stadium.name}</Text>
                    <Text className="text-gray-600">{stadium.city || stadium.address}</Text>
                </View>

                {/* Select Date */}
                <View className="mb-6">
                    <View className="flex-row items-center gap-2 mb-3">
                        <CalendarIcon size={20} color="#22C55E" />
                        <Text className="text-lg font-bold text-foreground">{t.booking.selectDate}</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2">
                            {dates.map((date, index) => {
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedDate(date)}
                                        className={`w-16 py-3 rounded-xl items-center ${isSelected ? 'bg-primary' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Text className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Text>
                                        <Text
                                            className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}
                                        >
                                            {date.getDate()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <Text className="text-sm text-gray-600 mt-3 text-center">
                        {t.admin.selectDateToManage}
                    </Text>
                </View>

                {/* Block Date */}
                <View className="bg-red-50 rounded-2xl p-4 mb-6">
                    <Text className="font-semibold text-red-900 mb-2">{t.admin.blockThisDate}</Text>
                    <Text className="text-sm text-red-800 mb-3">
                        {t.admin.blockDateCompletely}
                    </Text>
                    <Button variant="outline" className="border-red-200">
                        <View className="flex-row items-center">
                            <X size={16} color="#DC2626" />
                            <Text className="text-red-600 font-medium ml-2">{t.admin.blockDate}</Text>
                        </View>
                    </Button>
                </View>

                {/* Available Hours */}
                <View className="mb-6">
                    <View className="flex-row items-center gap-2 mb-3">
                        <Clock size={20} color="#22C55E" />
                        <Text className="text-lg font-bold text-foreground">{t.admin.availableHours}</Text>
                    </View>

                    <Text className="text-sm text-gray-600 mb-3">
                        {t.admin.selectAvailableHours}
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                        {timeSlots.map((hour) => {
                            const isAvailable = availableHours.includes(hour);

                            return (
                                <TouchableOpacity
                                    key={hour}
                                    onPress={() => toggleHour(hour)}
                                    className={`w-[31%] p-3 rounded-xl border-2 ${isAvailable ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50'
                                        }`}
                                >
                                    <Text
                                        className={`text-center font-medium ${isAvailable ? 'text-primary' : 'text-gray-400'
                                            }`}
                                    >
                                        {hour}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View className="bg-green-50 rounded-xl p-3 mt-4">
                        <Text className="text-sm text-gray-700">
                            <Text className="font-bold">{availableHours.length}</Text> {t.admin.of} {timeSlots.length} {t.admin.hoursSelected}
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View>
                    <Text className="text-lg font-bold text-foreground mb-3">{t.admin.quickActions}</Text>
                    <View className="flex-row gap-2">
                        <Button variant="outline" onPress={() => setAvailableHours(timeSlots)} className="flex-1">
                            {t.admin.selectAll}
                        </Button>
                        <Button variant="outline" onPress={() => setAvailableHours([])} className="flex-1">
                            {t.admin.clearAll}
                        </Button>
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"
                style={{ paddingBottom: insets.bottom + 16 }}
            >
                <Button onPress={handleSave}>{t.admin.saveAvailability}</Button>
            </View>
        </View>
    );
};
