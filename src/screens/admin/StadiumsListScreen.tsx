import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Edit, Trash2, Plus } from 'lucide-react-native';
import { TopBar } from '../../components/shared/TopBar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { stadiumsApi, Stadium } from '../../services/api';
import { useTranslation } from '../../translations';

export const StadiumsListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchStadiums();
        }, [])
    );

    const fetchStadiums = async () => {
        setIsLoading(true);
        try {
            const data = await stadiumsApi.getAll();
            setStadiums(data);
        } catch (error) {
            console.error('Failed to fetch stadiums:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            t.admin.deleteStadium,
            t.admin.confirmDelete,
            [
                { text: t.common.cancel, style: 'cancel' },
                {
                    text: t.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await stadiumsApi.delete(id);
                            setStadiums(stadiums.filter(s => s.id !== id));
                        } catch (error) {
                            Alert.alert(t.common.error, t.errors.failedToDelete);
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-background">
                <TopBar title={t.admin.myStadiums} showBack />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22C55E" />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <TopBar
                title={t.admin.myStadiums}
                showBack
                action={
                    <Button
                        size="icon"
                        onPress={() => navigation.navigate('StadiumForm')}
                    >
                        <Plus size={20} color="white" />
                    </Button>
                }
            />

            <FlatList
                data={stadiums}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ItemSeparatorComponent={() => <View className="h-4" />}
                onRefresh={fetchStadiums}
                refreshing={isLoading}
                ListEmptyComponent={
                    <View className="items-center justify-center py-12">
                        <Text className="text-gray-500">{t.admin.noStadiumsYet}</Text>
                        <Button onPress={() => navigation.navigate('StadiumForm')} className="mt-4">
                            <Text className="text-white">{t.admin.addStadium}</Text>
                        </Button>
                    </View>
                }
                renderItem={({ item: stadium }) => (
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <View className="flex-row gap-3 p-3">
                            <Image
                                source={{ uri: stadium.image }}
                                style={{ width: 96, height: 96, borderRadius: 12 }}
                                resizeMode="cover"
                            />

                            <View className="flex-1">
                                <View className="flex-row items-start justify-between gap-2 mb-2">
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                                            {stadium.name}
                                        </Text>
                                        <Text className="text-sm text-gray-600" numberOfLines={1}>
                                            {stadium.city || stadium.address}
                                        </Text>
                                    </View>
                                    {stadium.isPremium && (
                                        <Badge>
                                            <Text className="text-xs text-white font-medium">{t.common.premium}</Text>
                                        </Badge>
                                    )}
                                </View>

                                <View className="flex-row items-center gap-3">
                                    <Text className="text-primary font-semibold">{stadium.pricePerHour.toLocaleString()} DZD/h</Text>
                                    <Badge variant="secondary">
                                        <Text className="text-xs text-foreground">{stadium.capacity || 0} {t.stadium.capacity.toLowerCase()}</Text>
                                    </Badge>
                                </View>
                            </View>
                        </View>

                        <View className="px-3 pb-3 flex-row gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() => navigation.navigate('StadiumForm', { id: stadium.id })}
                                className="flex-1"
                            >
                                <View className="flex-row items-center">
                                    <Edit size={16} color="#0F172A" />
                                    <Text className="text-foreground font-medium ml-2">{t.common.edit}</Text>
                                </View>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() => navigation.navigate('AvailabilityEditor', { id: stadium.id })}
                                className="flex-1"
                            >
                                <Text className="text-foreground font-medium">{t.admin.availability}</Text>
                            </Button>
                            <TouchableOpacity
                                onPress={() => handleDelete(stadium.id)}
                                className="h-9 px-3 rounded-xl border border-red-200 items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <Trash2 size={16} color="#DC2626" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
};
