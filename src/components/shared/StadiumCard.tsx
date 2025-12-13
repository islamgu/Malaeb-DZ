import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { MapPin, Users, Star } from 'lucide-react-native';
import { Badge } from '../ui/Badge';

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
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
        >
            <View className="relative h-48">
                {imageLoading && (
                    <View className="absolute inset-0 bg-gray-200 items-center justify-center z-10">
                        <ActivityIndicator color="#22C55E" />
                    </View>
                )}
                {imageError ? (
                    <View className="h-48 bg-gradient-to-br from-green-100 to-green-200 items-center justify-center">
                        <View className="w-16 h-16 bg-green-300 rounded-full items-center justify-center mb-2">
                            <Text className="text-2xl">🏟️</Text>
                        </View>
                        <Text className="text-green-700 font-medium">{stadium.name}</Text>
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
                    <Text className="flex-1 text-lg font-bold text-foreground">{stadium.name}</Text>
                    <View className="flex-row items-center gap-1">
                        <Star size={16} fill="#FACC15" color="#FACC15" />
                        <Text className="text-foreground font-medium">{displayRating}</Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-1 mb-2">
                    <MapPin size={16} color="#6B7280" />
                    <Text className="text-gray-600">{displayLocation}</Text>
                </View>

                <View className="flex-row items-center gap-4 mb-3">
                    <View className="flex-row items-center gap-1">
                        <Users size={16} color="#6B7280" />
                        <Text className="text-gray-600">{stadium.capacity || 'N/A'}</Text>
                    </View>
                    <Text className="text-primary font-semibold">{stadium.pricePerHour.toLocaleString()} DZD/h</Text>
                </View>

                <View className="flex-row gap-2">
                    <Badge variant="secondary">
                        <Text className="text-xs text-foreground capitalize">{displayType}</Text>
                    </Badge>
                    <Badge variant="secondary">
                        <Text className="text-xs text-foreground">{displaySurface}</Text>
                    </Badge>
                </View>
            </View>
        </TouchableOpacity>
    );
};
