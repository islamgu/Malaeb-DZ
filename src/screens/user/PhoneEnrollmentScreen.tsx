import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Phone, Shield, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';
import { sendPhoneOtp, verifyPhoneOtp, signOutFirebase } from '../../services/firebase';

// Demo mode for development testing
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

export const PhoneEnrollmentScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { register } = useAuth();
    const { t } = useTranslation();
    const scrollViewRef = useRef<ScrollView>(null);

    const userData = route.params?.userData; // Contains name, email, password for backend registration

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);

    const otpInputs = useRef<(TextInput | null)[]>([]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handlePhoneFocus = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
    };

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
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

        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
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
                const confirmation = await sendPhoneOtp(normalizedPhone);
                setConfirmationResult(confirmation);
                setIsDemoMode(false);
                setStep('otp');
                setCountdown(60);
            }
        } catch (error: any) {
            console.error('Send OTP error:', error);

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
            }
            Alert.alert(t.common.error, errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndComplete = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            Alert.alert(t.common.error, t.auth.enterVerificationCode);
            return;
        }

        setIsLoading(true);
        try {
            // Verify OTP
            if (isDemoMode) {
                if (otpCode !== '123456') {
                    Alert.alert(t.common.error, 'Invalid code. In demo mode, use: 123456');
                    setIsLoading(false);
                    return;
                }
            } else {
                if (!confirmationResult) {
                    Alert.alert(t.common.error, 'Please request a new OTP code.');
                    setStep('phone');
                    setIsLoading(false);
                    return;
                }
                await verifyPhoneOtp(confirmationResult, otpCode);
            }

            // Phone verified - now complete registration with backend
            const normalizedPhone = normalizePhone(phone);

            if (userData) {
                // Register with backend
                const result = await register(
                    userData.email,
                    userData.password,
                    userData.name,
                    normalizedPhone
                );

                if (result.success) {
                    // Navigate to main app
                    const { user } = await import('../../services/api').then(m => m.authApi.getStoredUser()).then(u => ({ user: u }));
                    if (user?.role === 'ADMIN') {
                        navigation.replace('AdminStack');
                    } else {
                        navigation.replace('UserTabs');
                    }
                } else {
                    Alert.alert(t.common.error, result.error || t.auth.authFailed);
                }
            } else {
                // No userData - just phone verification for existing user
                Alert.alert(
                    t.common.success || 'Success',
                    t.auth.phoneVerified || 'Phone verified successfully!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
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

    const handleBack = () => {
        if (step === 'otp') {
            setStep('phone');
            setOtp(['', '', '', '', '', '']);
        } else {
            Alert.alert(
                t.common.cancel,
                'Are you sure you want to go back? Your account setup will be incomplete.',
                [
                    { text: t.common.no || 'No', style: 'cancel' },
                    {
                        text: t.common.yes || 'Yes',
                        style: 'destructive',
                        onPress: async () => {
                            await signOutFirebase();
                            navigation.navigate('SignUp');
                        }
                    }
                ]
            );
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + 16,
                    paddingBottom: insets.bottom + 24,
                    paddingHorizontal: 24,
                }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back button */}
                <TouchableOpacity
                    onPress={handleBack}
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
                        {step === 'phone'
                            ? (t.auth.addPhoneNumber || 'Add Phone Number')
                            : (t.auth.verifyPhone || 'Verify Phone')
                        }
                    </Text>
                    <Text className="text-gray-600 text-center">
                        {step === 'phone'
                            ? (t.auth.phoneForMFA || 'Add your phone number for secure two-factor authentication.')
                            : `${t.auth.otpSentTo || 'Enter the code sent to'} ${normalizePhone(phone)}`
                        }
                    </Text>
                </View>

                {step === 'phone' ? (
                    /* Phone Input */
                    <View className="gap-6">
                        <View>
                            <View className="flex-row items-center mb-2">
                                <Text className="text-sm text-gray-700">{t.auth.phone}</Text>
                                <Text className="text-sm text-red-500 ml-1">*</Text>
                            </View>
                            <View className="flex-row items-center shadow-sm">
                                <View
                                    style={{
                                        backgroundColor: '#059669',
                                        borderTopLeftRadius: 12,
                                        borderBottomLeftRadius: 12,
                                        paddingHorizontal: 14,
                                        paddingVertical: 14,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 20 }}>🇩🇿</Text>
                                    <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6, fontSize: 15 }}>+213</Text>
                                </View>
                                <View className="flex-1">
                                    <Input
                                        value={phone.replace('+213', '').replace(/^\s+/, '')}
                                        onChangeText={(text) => setPhone('+213' + text.replace(/[^\d]/g, ''))}
                                        placeholder="5XX XXX XXX"
                                        keyboardType="phone-pad"
                                        onFocus={handlePhoneFocus}
                                        style={{
                                            borderTopLeftRadius: 0,
                                            borderBottomLeftRadius: 0,
                                            borderTopRightRadius: 12,
                                            borderBottomRightRadius: 12,
                                            borderWidth: 1,
                                            borderColor: '#e5e7eb',
                                            borderLeftWidth: 0,
                                        }}
                                    />
                                </View>
                            </View>
                            <View className="flex-row items-center mt-2">
                                <Phone size={12} color="#6b7280" />
                                <Text className="text-xs text-gray-500 ml-1">
                                    {t.auth.phoneFormat}
                                </Text>
                            </View>
                        </View>

                        <Button onPress={handleSendOtp} disabled={isLoading}>
                            <Text className="text-white font-semibold">
                                {isLoading ? t.auth.pleaseWait : (t.auth.sendVerificationCode || 'Send Verification Code')}
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

                        <Button onPress={handleVerifyAndComplete} disabled={isLoading || otp.join('').length !== 6}>
                            <Text className="text-white font-semibold">
                                {isLoading ? t.auth.verifying : (t.auth.verifyAndComplete || 'Verify & Complete')}
                            </Text>
                        </Button>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
