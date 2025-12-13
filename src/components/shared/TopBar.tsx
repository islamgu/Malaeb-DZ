import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopBarProps {
    title?: string;
    showBack?: boolean;
    action?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, showBack = false, action }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View
            className="bg-white border-b border-gray-100"
            style={{ paddingTop: insets.top }}
        >
            <View className="flex-row items-center h-14 px-4">
                {showBack && (
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mr-3 p-2 -ml-2"
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                )}

                {title && (
                    <Text className="flex-1 text-xl font-bold text-foreground">{title}</Text>
                )}

                {action && <View>{action}</View>}
            </View>
        </View>
    );
};
