import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Heart } from 'lucide-react-native';
import { TopBar } from '../../components/shared/TopBar';
import { StadiumCard } from '../../components/shared/StadiumCard';
import { favoritesApi, Favorite } from '../../services/api';
import { useTranslation } from '../../translations';

export const FavoritesScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchFavorites();
        }, [])
    );

    const fetchFavorites = async () => {
        try {
            const data = await favoritesApi.getAll();
            setFavorites(data);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Convert favorite to stadium card format
    const toCardFormat = (fav: Favorite) => ({
        id: fav.stadiumId,
        name: fav.stadiumName,
        location: fav.stadiumCity || fav.stadiumAddress || 'Unknown',
        fullAddress: fav.stadiumAddress || '',
        rating: 4.5,
        reviewCount: 0,
        capacity: fav.stadiumCapacity || 0,
        pricePerHour: fav.stadiumPricePerHour,
        isPremium: fav.stadiumIsPremium,
        premiumHourPrice: fav.stadiumPricePerHour * 1.5,
        type: fav.stadiumType || 'outdoor',
        surfaceType: '',
        image: fav.image,
        gallery: [fav.image],
        description: '',
        facilities: [],
        lat: 0,
        lng: 0,
    });

    if (isLoading) {
        return (
            <View className="flex-1 bg-background">
                <TopBar title={t.favorites.title} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22C55E" />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <TopBar title={t.favorites.title} />

            {favorites.length === 0 ? (
                <View className="flex-1 items-center justify-center p-12">
                    <Heart size={48} color="#D1D5DB" />
                    <Text className="text-lg font-semibold text-foreground mt-3 mb-1">{t.favorites.noFavorites}</Text>
                    <Text className="text-gray-500 text-center">{t.favorites.addFavorites}</Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ItemSeparatorComponent={() => <View className="h-4" />}
                    onRefresh={fetchFavorites}
                    refreshing={isLoading}
                    renderItem={({ item }) => (
                        <StadiumCard
                            stadium={toCardFormat(item)}
                            onPress={() => navigation.navigate('StadiumDetail', { id: item.stadiumId })}
                        />
                    )}
                />
            )}
        </View>
    );
};
