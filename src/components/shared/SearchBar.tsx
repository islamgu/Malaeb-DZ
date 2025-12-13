import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Search stadiums...'
}) => {
    return (
        <View className="relative flex-row items-center bg-gray-100 rounded-xl h-12 px-3">
            <Search size={20} color="#9CA3AF" />
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-foreground"
            />
        </View>
    );
};
