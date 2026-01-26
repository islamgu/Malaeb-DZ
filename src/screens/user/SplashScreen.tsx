import React, { useEffect } from 'react';
import { View, Text, Animated, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../translations';
import { useAuth } from '../../context/AuthContext';

export const SplashScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
    const { t } = useTranslation();
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, scaleAnim]);

    useEffect(() => {
        // Wait for auth to finish loading before navigating
        if (isLoading) return;

        // Navigate after a short delay for splash animation
        const timer = setTimeout(() => {
            if (isAuthenticated) {
                // Navigate based on user role
                if (isAdmin) {
                    navigation.replace('AdminStack');
                } else {
                    navigation.replace('UserTabs');
                }
            } else {
                navigation.replace('SignUp');
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [isLoading, isAuthenticated, isAdmin, navigation]);

    return (
        <View className="flex-1 bg-primary items-center justify-center px-6">
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                }}
                className="items-center"
            >
                {/* Logo */}
                <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center mb-6 shadow-lg overflow-hidden">
                    <Image
                        source={require('../../../assets/icon.png')}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                    />
                </View>

                <Animated.Text
                    style={{ opacity: fadeAnim }}
                    className="text-white text-3xl font-bold mb-2"
                >
                    {t.app.name}
                </Animated.Text>

                <Animated.Text
                    style={{ opacity: fadeAnim }}
                    className="text-white/80 text-base"
                >
                    {t.app.tagline}
                </Animated.Text>
            </Animated.View>
        </View>
    );
};
