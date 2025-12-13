import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface SwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ value, onValueChange, disabled = false }) => {
    return (
        <TouchableOpacity
            onPress={() => !disabled && onValueChange(!value)}
            activeOpacity={0.7}
            disabled={disabled}
            className={`w-12 h-7 rounded-full p-0.5 ${value ? 'bg-primary' : 'bg-gray-300'} ${disabled ? 'opacity-50' : ''}`}
        >
            <View
                className={`w-6 h-6 rounded-full bg-white shadow-md ${value ? 'ml-auto' : 'mr-auto'}`}
            />
        </TouchableOpacity>
    );
};
