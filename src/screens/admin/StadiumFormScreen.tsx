import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Upload, Plus, X, CheckCircle, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/shared/TopBar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { stadiumsApi, Stadium, BASE_URL } from '../../services/api';
import { useTranslation } from '../../translations';

interface ImageAsset {
    uri: string;
    type: string;
    name: string;
}

export const StadiumFormScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const id = route.params?.id;
    const [isLoading, setIsLoading] = useState(!!id);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [images, setImages] = useState<ImageAsset[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        capacity: '',
        surface: '',
        type: 'outdoor' as 'indoor' | 'outdoor',
        pricePerHour: '',
        isPremium: false,
        premiumMultiplier: '1.5',
        description: '',
        facilities: [] as string[],
        lat: '',
        lng: '',
    });

    const [newFacility, setNewFacility] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (id) {
            fetchStadium();
        }
    }, [id]);

    const fetchStadium = async () => {
        try {
            const stadium = await stadiumsApi.getById(id);
            setFormData({
                name: stadium.name || '',
                address: stadium.address || '',
                city: stadium.city || '',
                capacity: stadium.capacity?.toString() || '',
                surface: stadium.surface || '',
                type: stadium.type || 'outdoor',
                pricePerHour: stadium.pricePerHour?.toString() || '',
                isPremium: stadium.isPremium || false,
                premiumMultiplier: stadium.premiumMultiplier?.toString() || '1.5',
                description: stadium.description || '',
                facilities: stadium.facilities || [],
                lat: stadium.lat?.toString() || '',
                lng: stadium.lng?.toString() || '',
            });
            setExistingImages(stadium.images || []);
        } catch (error) {
            Alert.alert(t.common.error, t.errors.failedToLoadStadium);
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t.errors.permissionNeeded, t.errors.grantCameraRollPermission);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 5 - images.length,
        });

        if (!result.canceled && result.assets) {
            const newImages = result.assets.map((asset) => ({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `image_${Date.now()}.jpg`,
            }));
            setImages([...images, ...newImages].slice(0, 5));
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t.errors.permissionNeeded, t.errors.grantCameraPermission);
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setImages([
                ...images,
                {
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: `photo_${Date.now()}.jpg`,
                },
            ]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.pricePerHour) {
            Alert.alert(t.common.error, t.errors.pleaseEnterNameAndPrice);
            return;
        }

        setIsSaving(true);
        try {
            const stadiumData = {
                name: formData.name,
                description: formData.description,
                address: formData.address,
                city: formData.city,
                lat: formData.lat ? parseFloat(formData.lat) : null,
                lng: formData.lng ? parseFloat(formData.lng) : null,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                surface: formData.surface,
                type: formData.type,
                pricePerHour: parseFloat(formData.pricePerHour),
                premiumMultiplier: parseFloat(formData.premiumMultiplier) || 1.5,
                isPremium: formData.isPremium,
                facilities: formData.facilities,
            };

            console.log('📍 Submitting stadium data:', JSON.stringify(stadiumData, null, 2));

            let savedStadium;
            if (id) {
                console.log(`🔄 Updating existing stadium with ID: ${id}`);
                savedStadium = await stadiumsApi.update(id, stadiumData);
            } else {
                console.log('✨ Creating new stadium');
                savedStadium = await stadiumsApi.create(stadiumData);
            }

            console.log('✅ Stadium saved successfully:', savedStadium);

            // Upload images if any
            if (images.length > 0) {
                setIsUploading(true);
                try {
                    await stadiumsApi.uploadImages(savedStadium.id, images);
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    Alert.alert(t.common.error, t.errors.stadiumSavedButImageFailed);
                } finally {
                    setIsUploading(false);
                }
            }

            setShowSuccess(true);
        } catch (error: any) {
            console.error('❌ Stadium creation/update failed:', error);
            console.error('Error details:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || error.message || t.errors.failedToSave;
            Alert.alert(t.common.error, `${t.errors.failedToSave}\n\nDetails: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const addFacility = () => {
        if (newFacility.trim()) {
            setFormData({
                ...formData,
                facilities: [...formData.facilities, newFacility.trim()],
            });
            setNewFacility('');
        }
    };

    const removeFacility = (index: number) => {
        setFormData({
            ...formData,
            facilities: formData.facilities.filter((_, i) => i !== index),
        });
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    if (showSuccess) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-6">
                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                    <CheckCircle size={40} color="#16A34A" />
                </View>
                <Text className="text-2xl font-bold text-foreground mb-2">
                    {id ? t.admin.stadiumUpdated : t.admin.stadiumAdded}
                </Text>
                <Text className="text-gray-600 text-center mb-6">
                    {id ? t.admin.changesSaved : t.admin.newStadiumAdded}
                </Text>
                <View className="w-full max-w-xs gap-3">
                    <Button onPress={() => navigation.navigate('AdminDashboard')}>{t.admin.backToDashboard}</Button>
                    <Button variant="outline" onPress={() => navigation.navigate('StadiumsList')}>
                        {t.admin.viewAllStadiums}
                    </Button>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="flex-1 bg-white">
                <TopBar title={id ? t.admin.editStadium : t.admin.addStadium} showBack />

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Image Upload Section */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-foreground mb-4">{t.admin.stadiumImages}</Text>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <View className="mb-4">
                                <Text className="text-sm text-gray-500 mb-2">{t.admin.currentImages}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View className="flex-row gap-2">
                                        {existingImages.map((uri, index) => (
                                            <Image
                                                key={index}
                                                source={{ uri: uri.startsWith('/') ? `${BASE_URL}${uri}` : uri }}
                                                style={{ width: 80, height: 80, borderRadius: 12 }}
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        {/* New Images */}
                        {images.length > 0 && (
                            <View className="mb-4">
                                <Text className="text-sm text-gray-500 mb-2">{t.admin.newImages}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View className="flex-row gap-2">
                                        {images.map((img, index) => (
                                            <View key={index} className="relative">
                                                <Image source={{ uri: img.uri }} style={{ width: 80, height: 80, borderRadius: 12 }} resizeMode="cover" />
                                                <TouchableOpacity
                                                    onPress={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                                                >
                                                    <X size={14} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        {/* Image Picker Buttons */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={pickImage}
                                className="flex-1 h-24 border-2 border-dashed border-gray-300 rounded-xl items-center justify-center"
                            >
                                <ImageIcon size={24} color="#9CA3AF" />
                                <Text className="text-gray-500 text-sm mt-1">{t.admin.gallery}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={takePhoto}
                                className="flex-1 h-24 border-2 border-dashed border-gray-300 rounded-xl items-center justify-center"
                            >
                                <Camera size={24} color="#9CA3AF" />
                                <Text className="text-gray-500 text-sm mt-1">{t.admin.camera}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Basic Info */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-foreground mb-4">{t.admin.basicInformation}</Text>

                        <View className="mb-4">
                            <Text className="text-sm text-gray-700 mb-2">{t.admin.stadiumNameRequired}</Text>
                            <Input
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholder="e.g., Stade 5 Juillet"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm text-gray-700 mb-2">{t.admin.fullAddress}</Text>
                            <Input
                                value={formData.address}
                                onChangeText={(text) => setFormData({ ...formData, address: text })}
                                placeholder="e.g., Route de l'Aéroport, Chéraga"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm text-gray-700 mb-2">{t.admin.city}</Text>
                            <Input
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                                placeholder="e.g., Algiers"
                            />
                        </View>

                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <Text className="text-sm text-gray-700 mb-2">{t.admin.capacity}</Text>
                                <Input
                                    value={formData.capacity}
                                    onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                                    placeholder="50"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm text-gray-700 mb-2">{t.admin.surfaceType}</Text>
                                <Input
                                    value={formData.surface}
                                    onChangeText={(text) => setFormData({ ...formData, surface: text })}
                                    placeholder="Synthetic Turf"
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <Text className="text-sm text-gray-700 mb-2">{t.admin.latitude}</Text>
                                <Input
                                    value={formData.lat}
                                    onChangeText={(text) => setFormData({ ...formData, lat: text })}
                                    placeholder="36.7538"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm text-gray-700 mb-2">{t.admin.longitude}</Text>
                                <Input
                                    value={formData.lng}
                                    onChangeText={(text) => setFormData({ ...formData, lng: text })}
                                    placeholder="3.0588"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-sm text-gray-700 mb-2">{t.admin.stadiumType}</Text>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setFormData({ ...formData, type: 'indoor' })}
                                    className={`flex-1 h-12 rounded-xl border-2 items-center justify-center ${formData.type === 'indoor' ? 'border-primary bg-primary/5' : 'border-gray-200'
                                        }`}
                                >
                                    <Text className={formData.type === 'indoor' ? 'text-primary font-medium' : 'text-gray-700'}>
                                        {t.common.indoor}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setFormData({ ...formData, type: 'outdoor' })}
                                    className={`flex-1 h-12 rounded-xl border-2 items-center justify-center ${formData.type === 'outdoor' ? 'border-primary bg-primary/5' : 'border-gray-200'
                                        }`}
                                >
                                    <Text className={formData.type === 'outdoor' ? 'text-primary font-medium' : 'text-gray-700'}>
                                        {t.common.outdoor}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Pricing */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-foreground mb-4">{t.admin.pricing}</Text>

                        <View className="mb-4">
                            <Text className="text-sm text-gray-700 mb-2">{t.admin.pricePerHourRequired}</Text>
                            <Input
                                value={formData.pricePerHour}
                                onChangeText={(text) => setFormData({ ...formData, pricePerHour: text })}
                                placeholder="10000"
                                keyboardType="numeric"
                            />
                        </View>

                        <View className="flex-row items-center justify-between bg-gray-100 rounded-xl p-4 mb-4">
                            <View className="flex-1">
                                <Text className="font-medium text-foreground">{t.admin.premiumStadium}</Text>
                                <Text className="text-sm text-gray-600 mt-1">{t.admin.enablePremiumPricing}</Text>
                            </View>
                            <Switch
                                value={formData.isPremium}
                                onValueChange={(checked) => setFormData({ ...formData, isPremium: checked })}
                            />
                        </View>

                        {formData.isPremium && (
                            <View>
                                <Text className="text-sm text-gray-700 mb-2">{t.admin.premiumMultiplier}</Text>
                                <Input
                                    value={formData.premiumMultiplier}
                                    onChangeText={(text) => setFormData({ ...formData, premiumMultiplier: text })}
                                    placeholder="1.5"
                                    keyboardType="numeric"
                                />
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    <View className="mb-6">
                        <Text className="text-sm text-gray-700 mb-2">{t.stadium.description}</Text>
                        <TextInput
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            placeholder={t.admin.describeYourStadium}
                            multiline
                            numberOfLines={4}
                            className="h-32 px-4 py-3 bg-gray-100 rounded-xl text-foreground"
                            textAlignVertical="top"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Facilities */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-foreground mb-4">{t.admin.facilities}</Text>

                        <View className="flex-row gap-2 mb-3">
                            <View className="flex-1">
                                <Input value={newFacility} onChangeText={setNewFacility} placeholder={t.admin.addFacility} onSubmitEditing={addFacility} />
                            </View>
                            <Button size="icon" onPress={addFacility}>
                                <Plus size={20} color="white" />
                            </Button>
                        </View>

                        {formData.facilities.length > 0 && (
                            <View className="flex-row flex-wrap gap-2">
                                {formData.facilities.map((facility, index) => (
                                    <View key={index} className="bg-gray-100 rounded-xl px-3 py-2 flex-row items-center gap-2">
                                        <Text className="text-foreground">{facility}</Text>
                                        <TouchableOpacity onPress={() => removeFacility(index)} className="w-5 h-5 items-center justify-center">
                                            <X size={12} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Fixed Bottom CTA */}
                <View
                    className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"
                    style={{ paddingBottom: insets.bottom + 16 }}
                >
                    <Button onPress={handleSubmit} disabled={isSaving || isUploading}>
                        {isUploading ? t.admin.uploadingImages : isSaving ? t.admin.saving : id ? t.admin.saveChanges : t.admin.addStadium}
                    </Button>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};
