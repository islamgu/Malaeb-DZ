import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { List, X, Navigation } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { TopBar } from '../../components/shared/TopBar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { stadiumsApi, Stadium } from '../../services/api';
import { useTranslation } from '../../translations';

const { width, height } = Dimensions.get('window');

// Algeria center coordinates
const ALGERIA_CENTER = {
    latitude: 36.7538,
    longitude: 3.0588,
    latitudeDelta: 5,
    longitudeDelta: 5,
};

export const MapScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const mapRef = useRef<MapView>(null);
    const { t } = useTranslation();
    const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);
    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [region, setRegion] = useState<Region>(ALGERIA_CENTER);

    useEffect(() => {
        fetchStadiums();
    }, []);

    useEffect(() => {
        // If navigated with a focus stadium, zoom to it
        if (route.params?.focusStadium && mapRef.current) {
            const stadium = route.params.focusStadium;
            if (stadium.lat && stadium.lng) {
                mapRef.current.animateToRegion({
                    latitude: stadium.lat,
                    longitude: stadium.lng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }, 1000);
                setSelectedStadium(stadium);
            }
        }
    }, [route.params?.focusStadium]);

    const fetchStadiums = async () => {
        try {
            const data = await stadiumsApi.getAll();
            setStadiums(data);

            // If we have stadiums with coordinates, center the map on them
            const stadiumsWithCoords = data.filter(s => s.lat && s.lng);
            if (stadiumsWithCoords.length > 0 && !route.params?.focusStadium) {
                const firstStadium = stadiumsWithCoords[0];
                setRegion({
                    latitude: firstStadium.lat!,
                    longitude: firstStadium.lng!,
                    latitudeDelta: 2,
                    longitudeDelta: 2,
                });
            }
        } catch (error) {
            console.error('Failed to fetch stadiums:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkerPress = (stadium: Stadium) => {
        setSelectedStadium(stadium);
        if (stadium.lat && stadium.lng && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: stadium.lat,
                longitude: stadium.lng,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }, 500);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-background">
                <TopBar title={t.nav.map} showBack />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22C55E" />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-100">
            <TopBar
                title={t.stadium.stadiumMap}
                showBack
                action={
                    <Button
                        variant="outline"
                        size="icon"
                        onPress={() => navigation.navigate('Home')}
                    >
                        <List size={20} color="#0F172A" />
                    </Button>
                }
            />

            {/* Real Map */}
            <View className="flex-1">
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    initialRegion={region}
                    showsUserLocation
                    showsMyLocationButton
                >
                    {stadiums.filter(s => s.lat && s.lng).map((stadium) => (
                        <Marker
                            key={stadium.id}
                            coordinate={{
                                latitude: stadium.lat!,
                                longitude: stadium.lng!,
                            }}
                            title={stadium.name}
                            description={stadium.city || stadium.address || ''}
                            onPress={() => handleMarkerPress(stadium)}
                        >
                            <View className={`w-10 h-10 rounded-full items-center justify-center shadow-lg ${stadium.isPremium ? 'bg-yellow-500' : 'bg-primary'
                                }`}>
                                <Text className="text-white font-bold text-xs">⚽</Text>
                            </View>
                        </Marker>
                    ))}
                </MapView>

                {/* Bottom Card */}
                {selectedStadium && (
                    <View className="absolute bottom-0 left-0 right-0 p-4">
                        <View className="bg-white rounded-2xl overflow-hidden shadow-xl">
                            <View className="relative">
                                <TouchableOpacity
                                    onPress={() => setSelectedStadium(null)}
                                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full items-center justify-center shadow-md z-10"
                                >
                                    <X size={20} color="#0F172A" />
                                </TouchableOpacity>

                                <View className="flex-row gap-3 p-3">
                                    <Image
                                        source={{ uri: selectedStadium.image }}
                                        style={{ width: 96, height: 96, borderRadius: 12 }}
                                        resizeMode="cover"
                                    />

                                    <View className="flex-1">
                                        <View className="flex-row items-start justify-between gap-2 mb-1">
                                            <Text className="text-lg font-bold text-foreground flex-1" numberOfLines={1}>
                                                {selectedStadium.name}
                                            </Text>
                                            {selectedStadium.isPremium && (
                                                <Badge>{t.common.premium}</Badge>
                                            )}
                                        </View>
                                        <Text className="text-gray-600 text-sm mb-2">
                                            {selectedStadium.city || selectedStadium.address}
                                        </Text>
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-primary font-semibold">
                                                {selectedStadium.pricePerHour.toLocaleString()} DZD/h
                                            </Text>
                                            {selectedStadium.type && (
                                                <Badge variant="secondary">
                                                    <Text className="text-xs capitalize">{selectedStadium.type}</Text>
                                                </Badge>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <View className="px-3 pb-3">
                                    <Button
                                        onPress={() => navigation.navigate('StadiumDetail', { id: selectedStadium.id })}
                                    >
                                        {t.stadium.viewDetailsAndBook}
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};
