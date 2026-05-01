import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useApp } from '../../context/AppContext';

interface ButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onPress,
    variant = 'default',
    size = 'default',
    disabled = false,
    loading = false,
    className = '',
    style,
    textStyle,
}) => {
    const { theme } = useApp();
    const getBaseClasses = () => {
        let classes = 'flex-row items-center justify-center rounded-xl ';

        // Size
        switch (size) {
            case 'sm':
                classes += 'h-9 px-3 ';
                break;
            case 'lg':
                classes += 'h-14 px-8 ';
                break;
            case 'icon':
                classes += 'h-12 w-12 ';
                break;
            default:
                classes += 'h-12 px-6 ';
        }

        // Variant
        let dynamicStyle: ViewStyle = {};
        switch (variant) {
            case 'outline':
                classes += 'border ';
                dynamicStyle = { backgroundColor: theme.card, borderColor: theme.border };
                break;
            case 'ghost':
                classes += 'bg-transparent ';
                break;
            default:
                dynamicStyle = { backgroundColor: theme.primary };
        }

        if (disabled || loading) {
            classes += 'opacity-50 ';
        }

        return classes + className;
    };

    const getTextClasses = () => {
        let classes = 'font-semibold ';

        switch (size) {
            case 'sm':
                classes += 'text-sm ';
                break;
            case 'lg':
                classes += 'text-lg ';
                break;
            default:
                classes += 'text-base ';
        }

        let textDynamicStyle: TextStyle = {};
        switch (variant) {
            case 'outline':
            case 'ghost':
                textDynamicStyle = { color: theme.text };
                break;
            default:
                textDynamicStyle = { color: '#FFFFFF' };
        }

        return { classes, textClasses, dynamicStyle, textDynamicStyle };
    };

    const { classes, textClasses, dynamicStyle, textDynamicStyle } = getBaseClasses();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={classes + className}
            style={[dynamicStyle, style]}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'default' ? '#FFFFFF' : theme.primary} />
            ) : (
                typeof children === 'string' ? (
                    <Text className={textClasses} style={[textDynamicStyle, textStyle]}>{children}</Text>
                ) : (
                    children
                )
            )}
        </TouchableOpacity>
    );
};
