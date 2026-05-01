import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { MapPin, Users, Star } from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { useApp } from '../../context/AppContext';

// Default fallback image - a nice stadium photo
const DEFAULT_STADIUM_IMAGE = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';

// Generic Stadium type for card display
export interface StadiumCardData {
    id: string;
    name: string;
    image?: string;
    location?: string;
    city?: string | null;
    address?: string | null;
    rating?: number;
    capacity?: number | null;
    pricePerHour: number;
    isPremium?: boolean;
    type?: 'indoor' | 'outdoor' | null;
    surface?: string | null;
    surfaceType?: string;
}

interface StadiumCardProps {
    stadium: StadiumCardData;
    onPress?: () => void;
}

export const StadiumCard: React.FC<StadiumCardProps> = ({ stadium, onPress }) => {
    const { theme } = useApp();
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [imageUri, setImageUri] = useState<string>(DEFAULT_STADIUM_IMAGE);

    useEffect(() => {
        // Set initial image or fallback
        const img = stadium.image && stadium.image.length > 0 ? stadium.image : DEFAULT_STADIUM_IMAGE;
        setImageUri(img);
        setImageError(false);
        setImageLoading(true);
    }, [stadium.image]);

    const displayLocation = stadium.location || stadium.city || stadium.address || 'Location unavailable';
    const displayRating = stadium.rating || 4.5;
    const displayType = stadium.type || 'outdoor';
    const displaySurface = stadium.surfaceType || stadium.surface || 'Turf';

    const handleImageError = (error: any) => {
        setImageLoading(false);
        if (imageUri !== DEFAULT_STADIUM_IMAGE) {
            // Try fallback image
            setImageUri(DEFAULT_STADIUM_IMAGE);
        } else {
            setImageError(true);
        }
    };

    const handleLoadStart = () => {
        setImageLoading(true);
    };

    const handleLoadEnd = () => {
        setImageLoading(false);
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            <View className="relative h-48">
                {imageLoading && (
                    <View className="absolute inset-0 bg-gray-200 items-center justify-center z-10" style={{ backgroundColor: theme.borderLight }}>
                        <ActivityIndicator color={theme.primary} />
                    </View>
                )}
                {imageError ? (
                    <View className="h-48 items-center justify-center" style={{ backgroundColor: theme.inputBg }}>
                        <View className="w-16 h-16 rounded-full items-center justify-center mb-2" style={{ backgroundColor: theme.border }}>
                            <Text className="text-2xl">🏟️</Text>
                        </View>
                        <Text style={{ color: theme.textMuted, fontWeight: '500' }}>{stadium.name}</Text>
                    </View>
                ) : (
                    <Image
                        source={{ uri: imageUri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        onLoadStart={handleLoadStart}
                        onLoadEnd={handleLoadEnd}
                        onError={handleImageError}
                    />
                )}
                {stadium.isPremium && (
                    <View className="absolute top-3 right-3">
                        <Badge>Premium</Badge>
                    </View>
                )}
            </View>

            <View className="p-4">
                <View className="flex-row items-start justify-between mb-2">
                    <Text className="flex-1 text-lg font-bold" style={{ color: theme.text }}>{stadium.name}</Text>
                    <View className="flex-row items-center gap-1">
                        <Star size={16} fill="#FACC15" color="#FACC15" />
                        <Text style={{ color: theme.text, fontWeight: '500' }}>{displayRating}</Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-1 mb-2">
                    <MapPin size={16} color={theme.textMuted} />
                    <Text style={{ color: theme.textSecondary }}>{displayLocation}</Text>
                </View>

                <View className="flex-row items-center gap-4 mb-3">
                    <View className="flex-row items-center gap-1">
                        <Users size={16} color={theme.textMuted} />
                        <Text style={{ color: theme.textSecondary }}>{stadium.capacity || 'N/A'}</Text>
                    </View>
                    <Text style={{ color: theme.primary, fontWeight: '600' }}>{stadium.pricePerHour.toLocaleString()} DZD/h</Text>
                </View>

                <View className="flex-row gap-2">
                    <Badge variant="secondary">
                        <Text className="text-xs capitalize" style={{ color: theme.text }}>{displayType}</Text>
                    </Badge>
                    <Badge variant="secondary">
                        <Text className="text-xs" style={{ color: theme.text }}>{displaySurface}</Text>
                    </Badge>
                </View>
            </View>
        </TouchableOpacity>
    );
};
