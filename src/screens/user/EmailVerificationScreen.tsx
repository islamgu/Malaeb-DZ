import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../translations';
import { sendEmailVerification, reloadUser, isEmailVerified, getCurrentUser, signOutFirebase } from '../../services/firebase';
=======
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';
>>>>>>> fb41bf6 (the 1.0 version)

export const EmailVerificationScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
<<<<<<< HEAD
    const { t } = useTranslation();

    const [isChecking, setIsChecking] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [verified, setVerified] = useState(false);

    const email = route.params?.email || getCurrentUser()?.email || '';
    const userData = route.params?.userData; // Contains name, password for backend registration

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Check verification status periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                await reloadUser();
                if (isEmailVerified()) {
                    setVerified(true);
                    clearInterval(interval);
                }
            } catch (error) {
                console.log('Error checking verification:', error);
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const handleResendEmail = async () => {
        if (countdown > 0) return;

        setIsResending(true);
        try {
            await sendEmailVerification();
            setCountdown(60);
            Alert.alert(t.common.success || 'Success', t.auth.verificationEmailSent || 'Verification email sent!');
        } catch (error: any) {
            console.error('Error resending email:', error);
            Alert.alert(t.common.error, error.message || t.auth.somethingWentWrong);
        } finally {
            setIsResending(false);
        }
    };

    const handleCheckVerification = async () => {
        setIsChecking(true);
        try {
            await reloadUser();
            if (isEmailVerified()) {
                setVerified(true);
            } else {
                Alert.alert(
                    t.auth.emailNotVerified || 'Email Not Verified',
                    t.auth.pleaseCheckEmail || 'Please check your email and click the verification link.'
                );
            }
        } catch (error: any) {
            console.error('Error checking verification:', error);
            Alert.alert(t.common.error, error.message || t.auth.somethingWentWrong);
=======
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
>>>>>>> fb41bf6 (the 1.0 version)
        } finally {
            setIsChecking(false);
        }
    };

<<<<<<< HEAD
    const handleContinue = () => {
        // Navigate to phone enrollment
        navigation.navigate('PhoneEnrollment', { userData });
    };

    const handleCancel = async () => {
        Alert.alert(
            t.common.cancel,
            t.auth.cancelVerification || 'Are you sure you want to cancel? Your account will not be created.',
            [
                { text: t.common.no || 'No', style: 'cancel' },
                {
                    text: t.common.yes || 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const user = getCurrentUser();
                            if (user) {
                                await user.delete();
                            }
                        } catch (error) {
                            await signOutFirebase();
                        }
                        navigation.navigate('SignUp');
                    }
                }
            ]
        );
=======
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
>>>>>>> fb41bf6 (the 1.0 version)
    };

    return (
        <View
            className="flex-1 bg-white"
<<<<<<< HEAD
            style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
        >
            {/* Icon */}
            <View className="items-center mt-12 mb-8">
                <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${verified ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {verified ? (
                        <CheckCircle size={48} color="#059669" />
                    ) : (
                        <Mail size={48} color="#3b82f6" />
                    )}
                </View>
                <Text className="text-2xl font-bold text-foreground mb-2 text-center">
                    {verified ? (t.auth.emailVerified || 'Email Verified!') : (t.auth.verifyYourEmail || 'Verify Your Email')}
                </Text>
                <Text className="text-gray-600 text-center px-4">
                    {verified
                        ? (t.auth.emailVerifiedMessage || 'Your email has been verified. Continue to set up phone verification.')
                        : (t.auth.verificationEmailSentTo || `We've sent a verification link to:`)
                    }
                </Text>
                {!verified && (
                    <Text className="text-primary font-semibold mt-2 text-lg">{email}</Text>
                )}
            </View>

            {verified ? (
                /* Verified - Show continue button */
                <View className="flex-1 justify-end">
                    <Button onPress={handleContinue}>
                        <Text className="text-white font-semibold text-lg">
                            {t.auth.continueToPhoneSetup || 'Continue to Phone Setup'}
                        </Text>
                    </Button>
                </View>
            ) : (
                /* Not verified - Show check and resend options */
                <View className="flex-1">
                    {/* Instructions */}
                    <View className="bg-gray-50 rounded-xl p-4 mb-6">
                        <Text className="text-gray-600 text-center">
                            {t.auth.clickVerificationLink || 'Click the link in the email to verify your account. Check your spam folder if you don\'t see it.'}
                        </Text>
                    </View>

                    {/* Check button */}
                    <Button onPress={handleCheckVerification} disabled={isChecking}>
                        <View className="flex-row items-center">
                            {isChecking ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <RefreshCw size={20} color="white" />
                            )}
                            <Text className="text-white font-semibold ml-2">
                                {isChecking ? (t.auth.checking || 'Checking...') : (t.auth.iVerifiedMyEmail || 'I Verified My Email')}
                            </Text>
                        </View>
                    </Button>

                    {/* Resend button */}
                    <TouchableOpacity
                        onPress={handleResendEmail}
                        disabled={countdown > 0 || isResending}
                        className="mt-4 py-3"
                    >
                        <Text className={`text-center font-medium ${countdown > 0 ? 'text-gray-400' : 'text-primary'}`}>
                            {isResending
                                ? (t.auth.sending || 'Sending...')
                                : countdown > 0
                                    ? `${t.auth.resendIn || 'Resend in'} ${countdown}s`
                                    : (t.auth.resendVerificationEmail || 'Resend Verification Email')
                            }
                        </Text>
                    </TouchableOpacity>

                    {/* Cancel */}
                    <View className="flex-1 justify-end">
                        <TouchableOpacity onPress={handleCancel} className="py-4">
                            <Text className="text-gray-500 text-center">
                                {t.common.cancel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
=======
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
>>>>>>> fb41bf6 (the 1.0 version)
        </View>
    );
};
