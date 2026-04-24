import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';

export const EmailVerificationScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { checkEmailVerified, sendVerificationEmail, logout } = useAuth();
    const { t } = useTranslation();

    const { email, isAdmin } = route.params || {};

    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleCheckVerified = async () => {
        setIsChecking(true);
        try {
            const result = await checkEmailVerified();
            if (result.verified) {
                // Navigate based on user role
                if (isAdmin) {
                    navigation.replace('AdminStack');
                } else {
                    navigation.replace('UserTabs');
                }
            } else {
                Alert.alert(
                    t.auth.emailNotVerified || 'Email Not Verified',
                    t.auth.pleaseVerifyEmail || 'Please click the verification link in your email first.'
                );
            }
        } catch (error) {
            Alert.alert(t.common.error, t.auth.somethingWentWrong);
        } finally {
            setIsChecking(false);
        }
    };

    const handleResend = async () => {
        setIsLoading(true);
        try {
            const result = await sendVerificationEmail();
            if (result.success) {
                setResendTimer(60);
                setCanResend(false);
                Alert.alert(
                    t.common.success || 'Success',
                    t.auth.verificationEmailSent || 'Verification email sent!'
                );
            } else {
                Alert.alert(t.common.error, result.error || t.auth.failedToSendEmail || 'Failed to send email');
            }
        } catch (error) {
            Alert.alert(t.common.error, t.auth.somethingWentWrong);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenMail = () => {
        Linking.openURL('mailto:');
    };

    const handleGoBack = async () => {
        await logout();
        navigation.goBack();
    };

    return (
        <View
            className="flex-1 bg-white"
            style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        >
            <View className="flex-1 px-6">
                {/* Header */}
                <TouchableOpacity
                    onPress={handleGoBack}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-8"
                >
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>

                {/* Icon & Title */}
                <View className="items-center mb-8">
                    <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center mb-6">
                        <Mail size={48} color="#22C55E" />
                    </View>
                    <Text className="text-3xl font-bold text-foreground mb-3 text-center">
                        {t.auth.checkYourEmail || 'Check Your Email'}
                    </Text>
                    <Text className="text-gray-600 text-center text-base leading-6">
                        {t.auth.verificationLinkSent || 'We sent a verification link to'}
                    </Text>
                    <Text className="text-foreground font-semibold text-base mt-1">
                        {email}
                    </Text>
                </View>

                {/* Actions */}
                <View className="gap-4">
                    {/* Check Verification Button */}
                    <Button onPress={handleCheckVerified} disabled={isChecking}>
                        {isChecking ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View className="flex-row items-center">
                                <CheckCircle size={20} color="white" />
                                <Text className="text-white font-semibold ml-2 text-base">
                                    {t.auth.iVerifiedMyEmail || "I've Verified My Email"}
                                </Text>
                            </View>
                        )}
                    </Button>

                    {/* Open Mail Button */}
                    <TouchableOpacity
                        onPress={handleOpenMail}
                        className="bg-gray-100 py-4 rounded-xl items-center flex-row justify-center"
                    >
                        <Mail size={20} color="#374151" />
                        <Text className="text-foreground font-semibold ml-2 text-base">
                            {t.auth.openEmailApp || 'Open Email App'}
                        </Text>
                    </TouchableOpacity>

                    {/* Resend Timer */}
                    <View className="items-center mt-4">
                        {canResend ? (
                            <TouchableOpacity
                                onPress={handleResend}
                                className="flex-row items-center"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#22C55E" />
                                ) : (
                                    <>
                                        <RefreshCw size={18} color="#22C55E" />
                                        <Text className="text-primary font-semibold ml-2">
                                            {t.auth.resendEmail || 'Resend Email'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <Text className="text-gray-500">
                                {t.auth.resendIn || 'Resend code in'} {resendTimer}s
                            </Text>
                        )}
                    </View>

                    {/* Help Text */}
                    <Text className="text-gray-400 text-center text-sm mt-4">
                        {t.auth.checkSpamFolder || "Didn't receive the email? Check your spam folder."}
                    </Text>
                </View>
            </View>
        </View>
    );
};
