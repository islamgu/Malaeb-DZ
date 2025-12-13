import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, Calendar, Heart, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../translations';

export const BottomNav: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const navItems = [
        { icon: Home, label: t.nav.home, screen: 'Home' },
        { icon: Calendar, label: t.nav.bookings, screen: 'MyBookings' },
        { icon: Heart, label: t.nav.favorites, screen: 'Favorites' },
        { icon: User, label: t.nav.profile, screen: 'Profile' },
    ];

    const isActive = (screen: string) => route.name === screen;

    return (
        <View
            className="bg-white border-t border-gray-200"
            style={{ paddingBottom: insets.bottom }}
        >
            <View className="flex-row items-center justify-around h-16 px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.screen);
                    return (
                        <TouchableOpacity
                            key={item.screen}
                            onPress={() => navigation.navigate(item.screen)}
                            className="flex-1 items-center justify-center h-full"
                            activeOpacity={0.7}
                        >
                            <Icon
                                size={24}
                                color={active ? '#22C55E' : '#9CA3AF'}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            <Text className={`text-xs mt-1 ${active ? 'text-primary font-medium' : 'text-gray-400'}`}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};
