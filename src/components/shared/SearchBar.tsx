import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

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
    const { theme } = useApp();
    return (
        <View style={{ backgroundColor: theme.inputBg, borderRadius: 12, height: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Search size={20} color={theme.textMuted} />
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={theme.textMuted}
                style={{ flex: 1, marginLeft: 8, color: theme.text }}
            />
        </View>
    );
};
