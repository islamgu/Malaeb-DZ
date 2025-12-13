import React from 'react';
import { TextInput, View, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
    className?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
    return (
        <TextInput
            className={`h-12 px-4 bg-gray-100 rounded-xl text-foreground ${className}`}
            placeholderTextColor="#9CA3AF"
            {...props}
        />
    );
};
