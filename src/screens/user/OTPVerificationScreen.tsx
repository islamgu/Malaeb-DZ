import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';

export const OTPVerificationScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { verifyOTP, sendOTP } = useAuth();
    const { t } = useTranslation();

    const { verificationId, phoneNumber, email, password, isSignUp, isAdmin } = route.params || {};

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [currentVerificationId, setCurrentVerificationId] = useState(verificationId);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);
            const lastIndex = Math.min(index + digits.length, 5);
            inputRefs.current[lastIndex]?.focus();
        } else {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-advance to next input
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            Alert.alert(t.common.error, t.auth.enterValidCode || 'Please enter the 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const result = await verifyOTP(currentVerificationId, code, {
                email,
                password,
                phoneNumber,
                isSignUp,
            });

            if (result.success) {
                // Navigate based on user role
                if (result.isAdmin) {
                    navigation.replace('AdminStack');
                } else {
                    navigation.replace('UserTabs');
                }
            } else {
                Alert.alert(t.common.error, result.error || t.auth.invalidCode || 'Invalid verification code');
            }
        } catch (error) {
            Alert.alert(t.common.error, t.auth.somethingWentWrong);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsLoading(true);
        try {
            const result = await sendOTP(phoneNumber);
            if (result.success && result.verificationId) {
                setCurrentVerificationId(result.verificationId);
                setResendTimer(60);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                Alert.alert(t.common.success || 'Success', t.auth.codeSent || 'Verification code sent!');
            } else {
                Alert.alert(t.common.error, result.error || t.auth.failedToSendOTP || 'Failed to send OTP');
            }
        } catch (error) {
            Alert.alert(t.common.error, t.auth.somethingWentWrong);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <View
                style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
                className="flex-1 px-6"
            >
                {/* Header */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-8"
                >
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>

                {/* Title */}
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-foreground mb-2">
                        {t.auth.verifyPhone || 'Verify Phone'}
                    </Text>
                    <Text className="text-gray-600">
                        {t.auth.enterCodeSentTo || 'Enter the code sent to'}{' '}
                        <Text className="font-semibold">{phoneNumber}</Text>
                    </Text>
                </View>

                {/* OTP Inputs */}
                <View className="flex-row justify-between mb-8">
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={6}
                            className="w-12 h-14 border-2 border-gray-300 rounded-xl text-center text-2xl font-bold text-foreground"
                            style={{
                                borderColor: digit ? '#22C55E' : '#D1D5DB',
                            }}
                        />
                    ))}
                </View>

                {/* Resend Timer */}
                <View className="items-center mb-8">
                    {canResend ? (
                        <TouchableOpacity
                            onPress={handleResend}
                            className="flex-row items-center"
                            disabled={isLoading}
                        >
                            <RefreshCw size={18} color="#22C55E" />
                            <Text className="text-primary font-semibold ml-2">
                                {t.auth.resendCode || 'Resend Code'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Text className="text-gray-500">
                            {t.auth.resendIn || 'Resend code in'} {resendTimer}s
                        </Text>
                    )}
                </View>

                {/* Verify Button */}
                <Button onPress={handleVerify} disabled={isLoading || otp.join('').length !== 6}>
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-lg">
                            {t.auth.verify || 'Verify'}
                        </Text>
                    )}
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
};
