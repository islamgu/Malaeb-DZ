import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { verifyCredentials, sendOTP } = useAuth();
    const { t, isRTL } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const formatPhoneDisplay = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    };

    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, 9);
        setPhoneNumber(digits);
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async () => {
        // Validate email
        if (!email.trim()) {
            Alert.alert(t.common.error, t.auth.enterEmail || 'Please enter your email');
            return;
        }
        if (!validateEmail(email.trim())) {
            Alert.alert(t.common.error, t.auth.invalidEmail || 'Please enter a valid email');
            return;
        }

        // Validate password
        if (!password) {
            Alert.alert(t.common.error, t.auth.enterPassword || 'Please enter your password');
            return;
        }

        // Validate phone
        if (phoneNumber.length < 9) {
            Alert.alert(t.common.error, t.auth.enterValidPhone || 'Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = '+213' + phoneNumber.replace(/^0/, '');

            // First verify credentials with backend
            const credentialsResult = await verifyCredentials(email.trim(), password, formattedPhone);

            if (!credentialsResult.success) {
                Alert.alert(t.common.error, credentialsResult.error || t.auth.invalidCredentials || 'Invalid credentials');
                setIsLoading(false);
                return;
            }

            // Credentials valid, now send OTP
            const otpResult = await sendOTP(formattedPhone);

            if (otpResult.success && otpResult.verificationId) {
                navigation.navigate('OTPVerification', {
                    verificationId: otpResult.verificationId,
                    phoneNumber: formattedPhone,
                    email: email.trim(),
                    password: password,
                    isSignUp: false,
                    isAdmin: credentialsResult.isAdmin,
                });
            } else {
                Alert.alert(t.common.error, otpResult.error || t.auth.failedToSendOTP || 'Failed to send OTP');
            }
        } catch (error: any) {
            Alert.alert(t.common.error, error.message || t.auth.somethingWentWrong);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <ScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + 32,
                    paddingBottom: insets.bottom + 24,
                    paddingHorizontal: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={{ width: '100%', maxWidth: 400 }}>
                    {/* Logo */}
                    <View className="items-center mb-6">
                        <View className="w-20 h-20 bg-primary rounded-3xl items-center justify-center mb-4 shadow-lg overflow-hidden">
                            <Image
                                source={require('../../../assets/icon.png')}
                                style={{ width: 64, height: 64 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-3xl font-bold text-foreground mb-2">
                            {t.auth.welcomeBack || 'Welcome Back'}
                        </Text>
                        <Text className="text-gray-600 text-center">
                            {t.auth.signInToContinue || 'Sign in to continue'}
                        </Text>
                    </View>

                    {/* Form Inputs */}
                    <View className="gap-4">
                        {/* Email Input */}
                        <View>
                            <Text className="text-sm text-gray-700 mb-2">
                                {t.auth.email || 'Email'}
                            </Text>
                            <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                                <Mail size={20} color="#9CA3AF" />
                                <Input
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder={t.auth.emailPlaceholder || "example@email.com"}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0 }}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View>
                            <Text className="text-sm text-gray-700 mb-2">
                                {t.auth.password || 'Password'}
                            </Text>
                            <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                                <Lock size={20} color="#9CA3AF" />
                                <Input
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder={t.auth.passwordPlaceholder || "Enter password"}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0 }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Phone Input */}
                        <View>
                            <Text className="text-sm text-gray-700 mb-2">
                                {t.auth.phoneNumber || 'Phone Number'}
                            </Text>
                            <View className="flex-row items-center">
                                <View className="bg-gray-100 rounded-xl px-4 py-4 mr-2 flex-row items-center">
                                    <Text className="text-lg font-semibold text-foreground">🇩🇿 +213</Text>
                                </View>
                                <View className="flex-1">
                                    <Input
                                        value={formatPhoneDisplay(phoneNumber)}
                                        onChangeText={handlePhoneChange}
                                        placeholder="XXX XXX XXX"
                                        keyboardType="phone-pad"
                                        maxLength={11}
                                    />
                                </View>
                            </View>
                        </View>

                        <Button
                            onPress={handleSubmit}
                            disabled={isLoading || phoneNumber.length < 9 || !email.trim() || !password}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View className="flex-row items-center">
                                    <LogIn size={20} color="white" />
                                    <Text className="text-white font-semibold ml-2">
                                        {t.auth.signIn || 'Sign In'}
                                    </Text>
                                </View>
                            )}
                        </Button>

                        {/* Info Text */}
                        <Text className="text-gray-500 text-center text-sm mt-2">
                            {t.auth.otpInfo || 'We will send you a verification code via SMS'}
                        </Text>

                        {/* SignUp Link */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('SignUp')}
                            className="mt-4"
                        >
                            <Text className="text-center text-gray-600">
                                {t.auth.dontHaveAccount || "Don't have an account?"}{' '}
                                <Text className="text-primary font-semibold">{t.auth.signUp || 'Sign Up'}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
