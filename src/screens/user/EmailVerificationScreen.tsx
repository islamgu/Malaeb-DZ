import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../translations';
import { sendEmailVerification, reloadUser, isEmailVerified, getCurrentUser, signOutFirebase } from '../../services/firebase';

export const EmailVerificationScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
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
        } finally {
            setIsChecking(false);
        }
    };

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
    };

    return (
        <View
            className="flex-1 bg-white"
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
        </View>
    );
};
