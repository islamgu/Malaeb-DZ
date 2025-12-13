import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    Calendar, CheckCircle, DollarSign, TrendingUp,
    Plus, List, Settings as SettingsIcon, LogOut
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { bookingsApi, stadiumsApi, Booking, Stadium } from '../../services/api';
import { useTranslation } from '../../translations';

export const AdminDashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();
    const { t } = useTranslation();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bookingsData, stadiumsData] = await Promise.all([
                bookingsApi.getAllBookings(),
                stadiumsApi.getAll(),
            ]);
            setBookings(bookingsData);
            setStadiums(stadiumsData);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    const acceptedBookings = bookings.filter(b => b.status === 'ACCEPTED').length;
    const totalRevenue = bookings
        .filter(b => b.status === 'ACCEPTED')
        .reduce((sum, b) => sum + b.price, 0);

    const handleLogout = async () => {
        await logout();
        navigation.replace('SignUp');
    };

    const stats = [
        {
            icon: Calendar,
            label: t.admin.pendingBookings,
            value: pendingBookings,
            color: '#EA580C',
            bg: 'bg-orange-100',
        },
        {
            icon: CheckCircle,
            label: t.admin.acceptedBookings,
            value: acceptedBookings,
            color: '#16A34A',
            bg: 'bg-green-100',
        },
        {
            icon: DollarSign,
            label: t.admin.totalRevenue,
            value: `${totalRevenue.toLocaleString()} DZD`,
            color: '#22C55E',
            bg: 'bg-green-100',
        },
        {
            icon: TrendingUp,
            label: t.admin.activeStadiums,
            value: stadiums.length,
            color: '#9333EA',
            bg: 'bg-purple-100',
        },
    ];

    const quickActions = [
        {
            icon: Plus,
            label: t.admin.addStadium,
            onPress: () => navigation.navigate('StadiumForm'),
            color: 'bg-primary',
        },
        {
            icon: Calendar,
            label: t.admin.manageBookings,
            onPress: () => navigation.navigate('BookingsQueue'),
            color: 'bg-green-600',
        },
        {
            icon: List,
            label: t.admin.viewStadiums,
            onPress: () => navigation.navigate('StadiumsList'),
            color: 'bg-purple-600',
        },
        {
            icon: SettingsIcon,
            label: t.profile.settings,
            onPress: () => { },
            color: 'bg-gray-600',
        },
    ];

    if (isLoading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-background">
            {/* Header */}
            <View className="bg-primary" style={{ paddingTop: insets.top }}>
                <View className="px-4 py-6">
                    <View className="flex-row items-center justify-between mb-6">
                        <View>
                            <Text className="text-2xl font-bold text-white mb-1">{t.admin.dashboard}</Text>
                            <Text className="text-white/80">{t.admin.manageStadiums}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <LogOut size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row flex-wrap gap-3">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <View
                                    key={stat.label}
                                    className="bg-white/10 rounded-xl p-4 w-[48%]"
                                >
                                    <View className={`w-10 h-10 ${stat.bg} rounded-xl items-center justify-center mb-2`}>
                                        <Icon size={20} color={stat.color} />
                                    </View>
                                    <Text className="text-2xl font-bold text-white mb-1">{stat.value}</Text>
                                    <Text className="text-sm text-white/80">{stat.label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <View className="px-4 py-6">
                <Text className="text-lg font-bold text-foreground mb-4">{t.admin.quickActions}</Text>
                <View className="flex-row flex-wrap gap-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <TouchableOpacity
                                key={action.label}
                                onPress={action.onPress}
                                className="bg-white rounded-xl p-4 w-[48%] shadow-sm"
                                activeOpacity={0.7}
                            >
                                <View className={`w-12 h-12 ${action.color} rounded-xl items-center justify-center mb-3`}>
                                    <Icon size={24} color="white" />
                                </View>
                                <Text className="font-medium text-foreground">{action.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Recent Activity */}
            <View className="px-4 pb-6">
                <Text className="text-lg font-bold text-foreground mb-4">{t.admin.recentBookings}</Text>
                <View className="gap-3">
                    {bookings.slice(0, 3).map((booking) => (
                        <View
                            key={booking.id}
                            className="bg-white rounded-xl p-4 shadow-sm"
                        >
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-lg font-bold text-foreground">{booking.stadiumName}</Text>
                                <View className={`px-2 py-1 rounded-full ${booking.status === 'PENDING'
                                    ? 'bg-orange-100'
                                    : 'bg-green-100'
                                    }`}>
                                    <Text className={`text-xs font-medium capitalize ${booking.status === 'PENDING' ? 'text-orange-700' : 'text-green-700'
                                        }`}>
                                        {booking.status.toLowerCase()}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-sm text-gray-600">
                                {booking.userName || booking.userEmail} • {new Date(booking.startAt).toLocaleDateString('en-GB')}
                            </Text>
                            <Text className="text-sm text-primary font-semibold mt-1">
                                {booking.price.toLocaleString()} DZD
                            </Text>
                        </View>
                    ))}
                    {bookings.length === 0 && (
                        <Text className="text-gray-500 text-center py-4">{t.admin.noBookingsYet}</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};
