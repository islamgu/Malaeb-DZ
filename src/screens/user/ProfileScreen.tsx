import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    User, Mail, Phone, CreditCard, History, Settings,
    LogOut, Globe, ChevronRight, Sun, Moon, Heart, Trash2
} from 'lucide-react-native';
import { TopBar } from '../../components/shared/TopBar';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../translations';

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, logout, deleteAccount } = useAuth();
    const { language, setLanguage, isDarkMode, toggleDarkMode, theme } = useApp();
    const { t, isRTL } = useTranslation();

    const handleLogout = async () => {
        await logout();
        navigation.replace('SignUp');
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t.profile.deleteAccount || 'Delete Account',
            t.profile.deleteAccountConfirm ||
                'This will permanently delete your account and all your data. This action cannot be undone.',
            [
                { text: t.common.cancel || 'Cancel', style: 'cancel' },
                {
                    text: t.profile.deleteAccount || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await deleteAccount();
                        if (result.success) {
                            navigation.replace('SignUp');
                        } else {
                            Alert.alert(
                                t.common.error,
                                result.error || t.profile.deleteAccountFailed || 'Failed to delete account'
                            );
                        }
                    },
                },
            ]
        );
    };

    const menuItems = [
        { icon: User, label: t.profile.editProfile, onPress: () => { } },
        { icon: CreditCard, label: t.profile.paymentMethods, onPress: () => { } },
        { icon: History, label: t.profile.bookingHistory, onPress: () => navigation.navigate('MyBookings') },
        { icon: Heart, label: t.favorites?.title || 'Favorites', onPress: () => navigation.navigate('FavoritesStack') },
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
    ];

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={theme.statusBar} />
            <TopBar title={t.profile.title} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                {/* Profile Header */}
                <View style={{
                    backgroundColor: theme.card,
                    borderRadius: 16, padding: 24,
                    alignItems: 'center', marginBottom: 16,
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                }}>
                    <View style={{
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: theme.primary,
                        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                    }}>
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                            {user?.name?.split(' ').map(n => n[0]).join('') || user?.email?.[0]?.toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>
                        {user?.name || 'User'}
                    </Text>
                    <Text style={{ color: theme.textSecondary }}>{user?.email}</Text>
                    {user?.role === 'ADMIN' && (
                        <View style={{
                            marginTop: 8, backgroundColor: `${theme.primary}15`,
                            paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
                        }}>
                            <Text style={{ color: theme.primary, fontWeight: '500', fontSize: 13 }}>
                                {t.profile.admin}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Contact Info */}
                <View style={{
                    backgroundColor: theme.card, borderRadius: 16,
                    overflow: 'hidden', marginBottom: 16,
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                }}>
                    <View style={{
                        padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
                        borderBottomWidth: 1, borderBottomColor: theme.borderLight,
                    }}>
                        <Mail size={20} color={theme.textMuted} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: theme.textMuted }}>{t.auth.email}</Text>
                            <Text style={{ color: theme.text }}>{user?.email}</Text>
                        </View>
                    </View>
                    <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Phone size={20} color={theme.textMuted} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: theme.textMuted }}>{t.profile.role}</Text>
                            <Text style={{ color: theme.text, textTransform: 'capitalize' }}>
                                {user?.role?.toLowerCase() || 'user'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Dark Mode Toggle */}
                <View style={{
                    backgroundColor: theme.card, borderRadius: 16,
                    overflow: 'hidden', marginBottom: 16,
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                }}>
                    <TouchableOpacity
                        onPress={toggleDarkMode}
                        style={{
                            padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
                        }}
                        activeOpacity={0.7}
                    >
                        {isDarkMode ? (
                            <Moon size={20} color={theme.primary} />
                        ) : (
                            <Sun size={20} color={theme.textMuted} />
                        )}
                        <Text style={{ flex: 1, color: theme.text, fontSize: 15 }}>
                            {t.profile.darkMode || 'Dark Mode'}
                        </Text>
                        {/* Custom Toggle Switch */}
                        <View style={{
                            width: 52, height: 30, borderRadius: 15,
                            backgroundColor: isDarkMode ? theme.primary : '#D1D5DB',
                            justifyContent: 'center',
                            paddingHorizontal: 3,
                        }}>
                            <View style={{
                                width: 24, height: 24, borderRadius: 12,
                                backgroundColor: 'white',
                                alignSelf: isDarkMode ? 'flex-end' : 'flex-start',
                                shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
                            }} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <View style={{
                    backgroundColor: theme.card, borderRadius: 16,
                    overflow: 'hidden', marginBottom: 16,
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                }}>
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <TouchableOpacity
                                key={item.label}
                                onPress={item.onPress}
                                style={{
                                    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
                                    borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                                    borderBottomColor: theme.borderLight,
                                }}
                                activeOpacity={0.7}
                            >
                                <Icon size={20} color={theme.textMuted} />
                                <Text style={{ flex: 1, color: theme.text, fontSize: 15 }}>{item.label}</Text>
                                {item.badge && (
                                    <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>
                                        {item.badge}
                                    </Text>
                                )}
                                <ChevronRight size={20} color={theme.textMuted} />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                        backgroundColor: theme.card, borderRadius: 16,
                        padding: 16, flexDirection: 'row',
                        alignItems: 'center', justifyContent: 'center', gap: 8,
                        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                    }}
                    activeOpacity={0.7}
                >
                    <LogOut size={20} color="#DC2626" />
                    <Text style={{ color: '#DC2626', fontWeight: '600' }}>{t.profile.logout}</Text>
                </TouchableOpacity>

                {/* Delete Account */}
                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    style={{
                        marginTop: 12,
                        padding: 16, flexDirection: 'row',
                        alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                    activeOpacity={0.7}
                >
                    <Trash2 size={18} color={theme.textMuted} />
                    <Text style={{ color: theme.textMuted, fontWeight: '500' }}>
                        {t.profile.deleteAccount || 'Delete Account'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};
