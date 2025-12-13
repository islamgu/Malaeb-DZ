import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

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
        switch (variant) {
            case 'outline':
                classes += 'bg-white border border-gray-200 ';
                break;
            case 'ghost':
                classes += 'bg-transparent ';
                break;
            default:
                classes += 'bg-primary ';
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

        switch (variant) {
            case 'outline':
            case 'ghost':
                classes += 'text-foreground ';
                break;
            default:
                classes += 'text-white ';
        }

        return classes;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={getBaseClasses()}
            style={style}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'default' ? '#FFFFFF' : '#22C55E'} />
            ) : (
                typeof children === 'string' ? (
                    <Text className={getTextClasses()} style={textStyle}>{children}</Text>
                ) : (
                    children
                )
            )}
        </TouchableOpacity>
    );
};
