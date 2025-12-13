import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    User, Mail, Phone, CreditCard, History, Settings,
    LogOut, Globe, ChevronRight
} from 'lucide-react-native';
import { TopBar } from '../../components/shared/TopBar';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../translations';

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();
    const { language, setLanguage } = useApp();
    const { t, isRTL } = useTranslation();

    const handleLogout = async () => {
        await logout();
        navigation.replace('SignUp');
    };

    const menuItems = [
        { icon: User, label: t.profile.editProfile, onPress: () => { } },
        { icon: CreditCard, label: t.profile.paymentMethods, onPress: () => { } },
        { icon: History, label: t.profile.bookingHistory, onPress: () => navigation.navigate('MyBookings') },
        {
            icon: Globe,
            label: t.profile.language,
            onPress: () => {
                const langs: ('en' | 'ar' | 'fr')[] = ['en', 'ar', 'fr'];
                const currentIndex = langs.indexOf(language);
                const nextLang = langs[(currentIndex + 1) % langs.length];
                setLanguage(nextLang);
            },
            badge: language.toUpperCase()
        },
        { icon: Settings, label: t.profile.settings, onPress: () => { } },
    ];

    return (
        <View className="flex-1 bg-background">
            <TopBar title={t.profile.title} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                {/* Profile Header */}
                <View className="bg-white rounded-2xl p-6 items-center shadow-sm mb-6">
                    <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-3">
                        <Text className="text-white text-2xl font-bold">
                            {user?.name?.split(' ').map(n => n[0]).join('') || user?.email?.[0]?.toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text className="text-xl font-bold text-foreground mb-1">{user?.name || 'User'}</Text>
                    <Text className="text-gray-600">{user?.email}</Text>
                    {user?.role === 'ADMIN' && (
                        <View className="mt-2 bg-primary/10 px-3 py-1 rounded-full">
                            <Text className="text-primary font-medium text-sm">{t.profile.admin}</Text>
                        </View>
                    )}
                </View>

                {/* Contact Info */}
                <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
                    <View className="p-4 flex-row items-center gap-3 border-b border-gray-100">
                        <Mail size={20} color="#9CA3AF" />
                        <View className="flex-1">
                            <Text className="text-sm text-gray-500">{t.auth.email}</Text>
                            <Text className="text-foreground">{user?.email}</Text>
                        </View>
                    </View>
                    <View className="p-4 flex-row items-center gap-3">
                        <Phone size={20} color="#9CA3AF" />
                        <View className="flex-1">
                            <Text className="text-sm text-gray-500">{t.profile.role}</Text>
                            <Text className="text-foreground capitalize">{user?.role?.toLowerCase() || 'user'}</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <TouchableOpacity
                                key={item.label}
                                onPress={item.onPress}
                                className={`p-4 flex-row items-center gap-3 ${index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                                activeOpacity={0.7}
                            >
                                <Icon size={20} color="#9CA3AF" />
                                <Text className="flex-1 text-foreground">{item.label}</Text>
                                {item.badge && (
                                    <Text className="text-sm text-primary font-medium">{item.badge}</Text>
                                )}
                                <ChevronRight size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-white rounded-2xl p-4 flex-row items-center justify-center gap-2 shadow-sm"
                    activeOpacity={0.7}
                >
                    <LogOut size={20} color="#DC2626" />
                    <Text className="text-red-600 font-medium">{t.profile.logout}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};
