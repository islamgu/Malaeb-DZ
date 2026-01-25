import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Phone, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';
import { sendPhoneOtp, verifyPhoneOtp, getFirebaseIdToken } from '../../services/firebase';

// ⚠️ DEMO MODE: Set to true for local testing without Firebase
// Use code "123456" to verify when in demo mode
const DEMO_MODE = false;  // Disabled to use real Firebase SMS

// Validate Algerian phone number format
const isValidAlgerianPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    return /^\+213[567]\d{8}$/.test(cleaned);
};

// Normalize phone number
const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '+213' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('+')) {
        cleaned = '+213' + cleaned;
    }
    return cleaned;
};

type Step = 'phone' | 'otp';

export const PhoneLoginScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { phoneLogin } = useAuth();
    const { t } = useTranslation();

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);

    const otpInputs = useRef<(TextInput | null)[]>([]);

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/[^\d+\s]/g, '');
        setPhone(cleaned);
    };

    const handleSendOtp = async () => {
        const normalizedPhone = normalizePhone(phone);

        if (!isValidAlgerianPhone(normalizedPhone)) {
            Alert.alert(t.common.error, t.auth.invalidPhoneNumber + '\n' + t.auth.phoneFormat);
            return;
        }

        setIsLoading(true);
        try {
            if (DEMO_MODE) {
                // Demo mode: Skip Firebase, use test code "123456"
                console.log('📱 DEMO MODE: OTP sent to', normalizedPhone);
                console.log('📱 Use code: 123456');
                setIsDemoMode(true);
                setStep('otp');
                setCountdown(60);
                Alert.alert(
                    '🧪 Demo Mode',
                    'Use verification code: 123456\n\nThis bypasses Firebase for local testing.',
                    [{ text: 'OK' }]
                );
            } else {
                // Production: Use real Firebase
                const confirmation = await sendPhoneOtp(normalizedPhone);
                setConfirmationResult(confirmation);
                setIsDemoMode(false);
                setStep('otp');
                setCountdown(60);
            }
        } catch (error: any) {
            console.error('Send OTP error:', error);

            // If Firebase fails, offer demo mode
            if (error.code === 'auth/network-request-failed') {
                Alert.alert(
                    'Network Error',
                    'Cannot reach Firebase servers. Would you like to use demo mode for testing?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Use Demo Mode',
                            onPress: () => {
                                setIsDemoMode(true);
                                setStep('otp');
                                setCountdown(60);
                                Alert.alert('🧪 Demo Mode', 'Use code: 123456');
                            }
                        }
                    ]
                );
                return;
            }

            let errorMessage = t.auth.somethingWentWrong;
            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = t.auth.invalidPhoneNumber;
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please try again later.';
            } else if (error.code === 'auth/quota-exceeded') {
                errorMessage = 'SMS quota exceeded. Please try again later.';
            }

            Alert.alert(t.common.error, errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 6) newOtp[index + i] = digit;
            });
            setOtp(newOtp);
            const focusIndex = Math.min(index + digits.length, 5);
            otpInputs.current[focusIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            Alert.alert(t.common.error, t.auth.enterVerificationCode);
            return;
        }

        // Demo mode: Check for test code
        if (isDemoMode) {
            if (otpCode !== '123456') {
                Alert.alert(t.common.error, 'Invalid code. In demo mode, use: 123456');
                return;
            }

            setIsLoading(true);
            try {
                const normalizedPhone = normalizePhone(phone);
                // In demo mode, call backend directly without Firebase token
                const result = await phoneLogin(normalizedPhone);

                if (result.success) {
                    const { user } = await import('../../services/api').then(m => m.authApi.getStoredUser()).then(u => ({ user: u }));
                    if (user?.role === 'ADMIN') {
                        navigation.replace('AdminStack');
                    } else {
                        navigation.replace('UserTabs');
                    }
                } else {
                    Alert.alert(
                        '✅ Demo Verification Success',
                        'Phone verified! In production, this would log you in.\n\nNote: ' + (result.error || 'No account exists with this phone number in the database.'),
                        [
                            { text: 'OK' },
                            { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') }
                        ]
                    );
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Production mode: Use Firebase
        if (!confirmationResult) {
            Alert.alert(t.common.error, 'Please request a new OTP code.');
            setStep('phone');
            return;
        }

        setIsLoading(true);
        try {
            // Verify OTP with Firebase
            await verifyPhoneOtp(confirmationResult, otpCode);

            // Get Firebase ID token for backend verification
            const idToken = await getFirebaseIdToken();
            const normalizedPhone = normalizePhone(phone);

            // Login with our backend using phone number
            const result = await phoneLogin(normalizedPhone, idToken || undefined);

            if (result.success) {
                const { user } = await import('../../services/api').then(m => m.authApi.getStoredUser()).then(u => ({ user: u }));
                if (user?.role === 'ADMIN') {
                    navigation.replace('AdminStack');
                } else {
                    navigation.replace('UserTabs');
                }
            } else {
                // Phone verified but no account exists
                Alert.alert(
                    t.common.error,
                    result.error || t.auth.noAccountWithPhone,
                    [
                        { text: t.common.cancel, style: 'cancel' },
                        {
                            text: t.auth.signUp,
                            onPress: () => navigation.navigate('SignUp')
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error('Verify OTP error:', error);
            let errorMessage = t.auth.invalidOtp;

            if (error.code === 'auth/invalid-verification-code') {
                errorMessage = t.auth.invalidOtp;
            } else if (error.code === 'auth/session-expired') {
                errorMessage = 'Code expired. Please request a new one.';
                setStep('phone');
            }

            Alert.alert(t.common.error, errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = () => {
        if (countdown > 0) return;
        setOtp(['', '', '', '', '', '']);
        handleSendOtp();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + 16,
                    paddingBottom: insets.bottom + 24,
                    paddingHorizontal: 24,
                }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <TouchableOpacity
                    onPress={() => step === 'otp' ? setStep('phone') : navigation.goBack()}
                    className="flex-row items-center mb-8"
                >
                    <ArrowLeft size={24} color="#374151" />
                    <Text className="text-gray-700 ml-2">{t.common.back}</Text>
                </TouchableOpacity>

                {/* Icon */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
                        {step === 'phone' ? (
                            <Phone size={40} color="#059669" />
                        ) : (
                            <Shield size={40} color="#059669" />
                        )}
                    </View>
                    <Text className="text-2xl font-bold text-foreground mb-2">
                        {step === 'phone' ? t.auth.signInWithPhone : t.auth.verifyPhone}
                    </Text>
                    <Text className="text-gray-600 text-center">
                        {step === 'phone'
                            ? t.auth.enterPhoneNumber
                            : `${t.auth.otpSentTo} ${normalizePhone(phone)}`}
                    </Text>
                </View>

                {step === 'phone' ? (
                    /* Phone Input */
                    <View className="gap-6">
                        <View>
                            <Text className="text-sm text-gray-700 mb-2">{t.auth.phone}</Text>
                            <View className="flex-row items-center">
                                <View className="bg-gray-100 rounded-l-xl px-4 py-4 border border-r-0 border-gray-200">
                                    <Text className="text-gray-600 font-medium text-lg">🇩🇿 +213</Text>
                                </View>
                                <View className="flex-1">
                                    <Input
                                        value={phone.replace('+213', '').trim()}
                                        onChangeText={(text) => setPhone('+213 ' + text)}
                                        placeholder="5XX XXX XXX"
                                        keyboardType="phone-pad"
                                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                    />
                                </View>
                            </View>
                            <Text className="text-xs text-gray-500 mt-2">
                                {t.auth.phoneFormat}
                            </Text>
                        </View>

                        <Button onPress={handleSendOtp} disabled={isLoading}>
                            <Text className="text-white font-semibold">
                                {isLoading ? t.auth.pleaseWait : t.common.next}
                            </Text>
                        </Button>
                    </View>
                ) : (
                    /* OTP Input */
                    <View className="gap-6">
                        <View>
                            <Text className="text-sm text-gray-700 mb-4 text-center">
                                {t.auth.enterVerificationCode}
                            </Text>
                            <View className="flex-row justify-center gap-2">
                                {otp.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => { otpInputs.current[index] = ref; }}
                                        value={digit}
                                        onChangeText={(value) => handleOtpChange(value, index)}
                                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        className="w-12 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold text-foreground focus:border-primary"
                                        style={{ fontSize: 24 }}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Resend OTP */}
                        <View className="items-center">
                            {countdown > 0 ? (
                                <Text className="text-gray-500">
                                    {t.auth.resendIn} {countdown}s
                                </Text>
                            ) : (
                                <TouchableOpacity onPress={handleResendOtp}>
                                    <Text className="text-primary font-semibold">
                                        {t.auth.resendOtp}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Button onPress={handleVerifyOtp} disabled={isLoading || otp.join('').length !== 6}>
                            <Text className="text-white font-semibold">
                                {isLoading ? t.auth.verifying : t.auth.verifyPhone}
                            </Text>
                        </Button>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
