import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useApp } from '../../context/AppContext';

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
    const { theme } = useApp();

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
    const getDynamicStyles = () => {
        let viewStyle: ViewStyle = {};
        let textStyle: TextStyle = {};
        if (variant === 'secondary') {
            viewStyle = { backgroundColor: theme.inputBg };
            textStyle = { color: theme.text };
        }
        return { viewStyle, textStyle };
    };

    const { viewStyle, textStyle } = getDynamicStyles();

    return (
        <View className={`px-2.5 py-1 rounded-full ${getVariantClasses()} ${className}`} style={viewStyle}>
            {typeof children === 'string' ? (
                <Text className={`text-xs font-medium ${getTextClasses()}`} style={textStyle}>{children}</Text>
            ) : (
                children
            )}
        </View>
    );
};
