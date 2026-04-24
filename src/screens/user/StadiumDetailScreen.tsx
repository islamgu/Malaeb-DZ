import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MapPin, Users, Star, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { stadiumsApi, favoritesApi, reviewsApi, Stadium, Review } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';

const { width } = Dimensions.get('window');

export const StadiumDetailScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [stadium, setStadium] = useState<Stadium | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [showReviewForm, setShowReviewForm] = useState(false);

    useEffect(() => {
        fetchStadium();
        fetchReviews();
        if (isAuthenticated) {
            checkFavorite();
        }
    }, [route.params?.id]);

    const fetchStadium = async () => {
        try {
            const data = await stadiumsApi.getById(route.params?.id);
            setStadium(data);
        } catch (error) {
            console.error('Failed to fetch stadium:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const data = await reviewsApi.getByStadium(route.params?.id);
            setReviews(data.reviews);
            setAverageRating(data.averageRating);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        }
    };

    const checkFavorite = async () => {
        try {
            const isFav = await favoritesApi.check(route.params?.id);
            setIsFavorite(isFav);
        } catch (error) {
            console.error('Failed to check favorite:', error);
        }
    };

    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            Alert.alert(t.auth.loginRequired, t.auth.pleaseLoginToAddFavorites);
            return;
        }
        try {
            if (isFavorite) {
                await favoritesApi.remove(route.params?.id);
            } else {
                await favoritesApi.add(route.params?.id);
            }
            setIsFavorite(!isFavorite);
        } catch (error) {
            Alert.alert(t.common.error, t.reviews.failedToUpdate);
        }
    };

    const submitReview = async () => {
        if (!isAuthenticated) {
            Alert.alert(t.auth.loginRequired, t.auth.pleaseLoginToReview);
            return;
        }
        try {
            await reviewsApi.add(route.params?.id, newReview.rating, newReview.comment);
            setShowReviewForm(false);
            setNewReview({ rating: 5, comment: '' });
            fetchReviews();
            Alert.alert(t.reviews.success, t.reviews.reviewSubmitted);
        } catch (error) {
            Alert.alert(t.common.error, t.reviews.failedToSubmit);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    if (!stadium) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <Text className="text-lg font-bold mb-4">{t.stadium.notFound}</Text>
                <Button onPress={() => navigation.goBack()}>{t.stadium.backToHome}</Button>
            </View>
        );
    }

    const gallery = stadium.images?.length > 0 ? stadium.images : [stadium.image];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
    };

    const displayRating = averageRating?.toFixed(1) || '4.5';

    return (
        <View className="flex-1 bg-white">
            <KeyboardAwareScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 100 }}
                enableOnAndroid={true}
                extraScrollHeight={80}
            >
                {/* Hero Image Gallery */}
                <View className="relative h-80 bg-gray-200">
                    <Image source={{ uri: gallery[currentImageIndex] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />

                    {gallery.length > 1 && (
                        <>
                            <TouchableOpacity
                                onPress={prevImage}
                                className="absolute left-3 top-1/2 -mt-5 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
                            >
                                <ChevronLeft size={24} color="#0F172A" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={nextImage}
                                className="absolute right-3 top-1/2 -mt-5 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
                            >
                                <ChevronRight size={24} color="#0F172A" />
                            </TouchableOpacity>

                            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1">
                                {gallery.map((_, index) => (
                                    <View
                                        key={index}
                                        className={`h-1.5 rounded-full ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                                            }`}
                                    />
                                ))}
                            </View>
                        </>
                    )}

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="absolute top-12 left-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
                    >
                        <ChevronLeft size={24} color="#0F172A" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={toggleFavorite}
                        className="absolute top-12 right-16 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
                    >
                        <Heart size={20} color={isFavorite ? '#DC2626' : '#0F172A'} fill={isFavorite ? '#DC2626' : 'none'} />
                    </TouchableOpacity>

                    {stadium.isPremium && (
                        <View className="absolute top-12 right-4">
                            <Badge>{t.common.premium}</Badge>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View className="px-4 py-4 gap-6">
                    {/* Header */}
                    <View>
                        <View className="flex-row items-start justify-between gap-4 mb-3">
                            <Text className="flex-1 text-2xl font-bold text-foreground">{stadium.name}</Text>
                            <View className="flex-row items-center gap-1">
                                <Star size={20} fill="#FACC15" color="#FACC15" />
                                <Text className="text-lg font-semibold">{displayRating}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center gap-1 mb-3">
                            <MapPin size={20} color="#6B7280" />
                            <Text className="text-gray-600">{stadium.address || stadium.city}</Text>
                        </View>

                        <View className="flex-row flex-wrap gap-2">
                            <Badge variant="secondary">
                                <View className="flex-row items-center gap-1">
                                    <Users size={14} color="#0F172A" />
                                    <Text className="text-xs text-foreground">{t.stadium.capacity}: {stadium.capacity || 'N/A'}</Text>
                                </View>
                            </Badge>
                            <Badge variant="secondary">
                                <Text className="text-xs text-foreground capitalize">{stadium.type || 'outdoor'}</Text>
                            </Badge>
                            {stadium.surface && (
                                <Badge variant="secondary">
                                    <Text className="text-xs text-foreground">{stadium.surface}</Text>
                                </Badge>
                            )}
                        </View>
                    </View>

                    {/* Pricing */}
                    <View className="bg-gray-100 rounded-2xl p-4">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-700">{t.stadium.standardRate}</Text>
                            <Text className="text-primary font-semibold">{stadium.pricePerHour.toLocaleString()} DZD{t.stadium.perHour}</Text>
                        </View>
                        {stadium.isPremium && (
                            <View className="flex-row items-center justify-between pt-2 border-t border-gray-200">
                                <Text className="text-gray-700">{t.stadium.premiumHours}</Text>
                                <Text className="text-primary font-semibold">
                                    {Math.round(stadium.pricePerHour * (stadium.premiumMultiplier || 1.5)).toLocaleString()} DZD{t.stadium.perHour}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    {stadium.description && (
                        <View>
                            <Text className="text-lg font-bold text-foreground mb-2">{t.stadium.about}</Text>
                            <Text className="text-gray-600 leading-6">{stadium.description}</Text>
                        </View>
                    )}

                    {/* Facilities */}
                    {stadium.facilities && stadium.facilities.length > 0 && (
                        <View>
                            <Text className="text-lg font-bold text-foreground mb-3">{t.stadium.facilities}</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {stadium.facilities.map((facility, index) => (
                                    <View key={index} className="bg-gray-100 rounded-xl px-4 py-3">
                                        <Text className="text-gray-700">{facility}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Reviews */}
                    <View>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-lg font-bold text-foreground">{t.stadium.reviews} ({reviews.length})</Text>
                            <TouchableOpacity onPress={() => setShowReviewForm(!showReviewForm)}>
                                <Text className="text-primary font-medium">{t.stadium.writeReview}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Review Form */}
                        {showReviewForm && (
                            <View className="bg-gray-100 rounded-xl p-4 mb-4">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <Text className="text-sm text-gray-700">{t.stadium.rating}</Text>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity key={star} onPress={() => setNewReview({ ...newReview, rating: star })}>
                                            <Star
                                                size={24}
                                                fill={star <= newReview.rating ? '#FACC15' : 'none'}
                                                color={star <= newReview.rating ? '#FACC15' : '#D1D5DB'}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    value={newReview.comment}
                                    onChangeText={(text) => setNewReview({ ...newReview, comment: text })}
                                    placeholder={t.stadium.writeYourReview}
                                    multiline
                                    className="bg-white rounded-xl p-3 h-20 mb-3"
                                    textAlignVertical="top"
                                />
                                <Button size="sm" onPress={submitReview}>
                                    <View className="flex-row items-center gap-2">
                                        <Send size={16} color="white" />
                                        <Text className="text-white font-medium">{t.stadium.submitReview}</Text>
                                    </View>
                                </Button>
                            </View>
                        )}

                        {reviews.length === 0 ? (
                            <View className="bg-gray-100 rounded-xl p-4">
                                <Text className="text-gray-500 text-center">{t.stadium.beFirstToReview}</Text>
                            </View>
                        ) : (
                            <View className="gap-3">
                                {reviews.map((review) => (
                                    <View key={review.id} className="bg-gray-100 rounded-xl p-4">
                                        <View className="flex-row items-center justify-between mb-2">
                                            <Text className="font-semibold text-foreground">{review.userName || t.common.anonymous}</Text>
                                            <View className="flex-row items-center gap-1">
                                                <Star size={16} fill="#FACC15" color="#FACC15" />
                                                <Text className="text-sm">{review.rating}</Text>
                                            </View>
                                        </View>
                                        {review.comment && <Text className="text-gray-600 text-sm">{review.comment}</Text>}
                                        <Text className="text-gray-400 text-xs mt-2">
                                            {new Date(review.createdAt).toLocaleDateString('en-GB')}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAwareScrollView>

            {/* Fixed Bottom CTA */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"
                style={{ paddingBottom: insets.bottom + 16 }}
            >
                <Button onPress={() => navigation.navigate('BookingFlow', { id: stadium.id })}>{t.stadium.bookSlot}</Button>
            </View>
        </View>
    );
};
