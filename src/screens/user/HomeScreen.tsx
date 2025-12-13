import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Map, Settings, Filter, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/shared/SearchBar';
import { StadiumCard } from '../../components/shared/StadiumCard';
import { Button } from '../../components/ui/Button';
import { stadiumsApi, Stadium } from '../../services/api';
import { useTranslation } from '../../translations';

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<'all' | 'indoor' | 'outdoor'>('all');
    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStadiums();
    }, []);

    const fetchStadiums = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await stadiumsApi.getAll();
            setStadiums(data);
        } catch (err) {
            console.error('Failed to fetch stadiums:', err);
            setError(t.home.failedToLoad);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStadiums = useMemo(() => {
        return stadiums.filter(stadium => {
            const matchesSearch = stadium.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (stadium.city?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            const matchesType = selectedType === 'all' || stadium.type === selectedType;
            return matchesSearch && matchesType;
        });
    }, [stadiums, searchQuery, selectedType]);

    const filterOptions: { value: 'all' | 'indoor' | 'outdoor'; label: string }[] = [
        { value: 'all', label: t.common.all },
        { value: 'indoor', label: t.common.indoor },
        { value: 'outdoor', label: t.common.outdoor },
    ];

    // Convert API stadium to format expected by StadiumCard
    const toCardFormat = (stadium: Stadium) => ({
        id: stadium.id,
        name: stadium.name,
        location: stadium.city || stadium.address || 'Unknown',
        fullAddress: stadium.address || '',
        rating: 4.5, // TODO: Calculate from reviews
        reviewCount: 0,
        capacity: stadium.capacity || 0,
        pricePerHour: stadium.pricePerHour,
        isPremium: stadium.isPremium,
        premiumHourPrice: stadium.pricePerHour * (stadium.premiumMultiplier || 1),
        type: stadium.type || 'outdoor',
        surfaceType: stadium.surface || '',
        image: stadium.image,
        gallery: stadium.images || [],
        description: stadium.description || '',
        facilities: stadium.facilities || [],
        lat: stadium.lat || 0,
        lng: stadium.lng || 0,
    });

    return (
        <View className="flex-1 bg-background">
            {/* Top Bar */}
            <View
                className="bg-white border-b border-gray-100"
                style={{ paddingTop: insets.top }}
            >
                <View className="px-4 pt-4 pb-3 gap-3">
                    <View className="flex-row items-center gap-3">
                        <View className="flex-1">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder={t.home.searchStadiums}
                            />
                        </View>
                        <Button
                            variant="outline"
                            size="icon"
                            onPress={() => navigation.navigate('MapView', { stadiums: filteredStadiums.map(toCardFormat) })}
                        >
                            <Map size={20} color="#0F172A" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Settings size={20} color="#0F172A" />
                        </Button>
                    </View>

                    {/* Filters */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-row gap-2"
                    >
                        {filterOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setSelectedType(option.value)}
                                className={`px-4 py-2 rounded-full ${selectedType === option.value
                                    ? 'bg-primary'
                                    : 'bg-gray-100'
                                    }`}
                            >
                                <Text className={`text-sm font-medium ${selectedType === option.value
                                    ? 'text-white'
                                    : 'text-foreground'
                                    }`}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* Loading State */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22C55E" />
                    <Text className="text-gray-500 mt-3">{t.home.loadingStadiums}</Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center p-12">
                    <Text className="text-lg font-semibold text-foreground mb-2">{error}</Text>
                    <Button onPress={fetchStadiums} variant="outline">
                        <View className="flex-row items-center gap-2">
                            <RefreshCw size={16} color="#0F172A" />
                            <Text>{t.common.retry}</Text>
                        </View>
                    </Button>
                </View>
            ) : filteredStadiums.length === 0 ? (
                <View className="flex-1 items-center justify-center p-12">
                    <Filter size={48} color="#D1D5DB" />
                    <Text className="text-lg font-semibold text-foreground mt-3 mb-1">
                        {t.home.noStadiumsFound}
                    </Text>
                    <Text className="text-gray-500 text-center">
                        {t.home.tryAdjusting}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredStadiums}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ItemSeparatorComponent={() => <View className="h-4" />}
                    onRefresh={fetchStadiums}
                    refreshing={isLoading}
                    renderItem={({ item }) => (
                        <StadiumCard
                            stadium={toCardFormat(item)}
                            onPress={() => navigation.navigate('StadiumDetail', { id: item.id })}
                        />
                    )}
                />
            )}
        </View>
    );
};
