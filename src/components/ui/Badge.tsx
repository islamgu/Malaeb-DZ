import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'secondary':
                return 'bg-gray-100';
            case 'success':
                return 'bg-green-100';
            case 'warning':
                return 'bg-orange-100';
            case 'error':
                return 'bg-red-100';
            default:
                return 'bg-primary';
        }
    };

    const getTextClasses = () => {
        switch (variant) {
            case 'secondary':
                return 'text-foreground';
            case 'success':
                return 'text-green-700';
            case 'warning':
                return 'text-orange-700';
            case 'error':
                return 'text-red-700';
            default:
                return 'text-white';
        }
    };

    return (
        <View className={`px-2.5 py-1 rounded-full ${getVariantClasses()} ${className}`}>
            {typeof children === 'string' ? (
                <Text className={`text-xs font-medium ${getTextClasses()}`}>{children}</Text>
            ) : (
                children
            )}
        </View>
    );
};
