import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';

export const SignUpScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { login, register } = useAuth();
    const { t, isRTL } = useTranslation();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert(t.common.error, t.auth.fillAllFields);
            return;
        }

        setIsLoading(true);
        try {
            let result;
            if (isLogin) {
                result = await login(email, password);
            } else {
                if (!name) {
                    Alert.alert(t.common.error, t.auth.enterYourName);
                    setIsLoading(false);
                    return;
                }
                result = await register(email, password, name);
            }

            if (result.success) {
                // Check if admin and navigate accordingly
                const { user } = await import('../../services/api').then(m => m.authApi.getStoredUser()).then(u => ({ user: u }));
                if (user?.role === 'ADMIN') {
                    navigation.replace('AdminStack');
                } else {
                    navigation.replace('UserTabs');
                }
            } else {
                Alert.alert(t.common.error, result.error || t.auth.authFailed);
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
            className="flex-1"
        >
            <ScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + 48,
                    paddingBottom: insets.bottom + 24,
                    paddingHorizontal: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={{ width: '100%', maxWidth: 400 }}>
                    {/* Logo */}
                    <View className="items-center mb-12">
                        <View className="w-20 h-20 bg-primary rounded-3xl items-center justify-center mb-4 shadow-lg overflow-hidden">
                            <Image
                                source={require('../../../assets/icon.png')}
                                style={{ width: 64, height: 64 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-3xl font-bold text-foreground mb-2">
                            {isLogin ? t.auth.welcomeBack : t.auth.createAccount}
                        </Text>
                        <Text className="text-gray-600 text-center">
                            {isLogin ? t.auth.signInToContinue : t.auth.signUpToGetStarted}
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="gap-4">
                        {!isLogin && (
                            <View>
                                <Text className="text-sm text-gray-700 mb-2">{t.auth.name}</Text>
                                <Input
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t.auth.yourName}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <View>
                            <Text className="text-sm text-gray-700 mb-2">{t.auth.email}</Text>
                            <Input
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View>
                            <Text className="text-sm text-gray-700 mb-2">{t.auth.password}</Text>
                            <Input
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                secureTextEntry
                            />
                        </View>

                        <Button onPress={handleSubmit} disabled={isLoading}>
                            <View className="flex-row items-center">
                                {isLogin ? <Lock size={20} color="white" /> : <User size={20} color="white" />}
                                <Text className="text-white font-semibold ml-2">
                                    {isLoading ? t.auth.pleaseWait : (isLogin ? t.auth.signIn : t.auth.createAccount)}
                                </Text>
                            </View>
                        </Button>

                        {/* Toggle */}
                        <TouchableOpacity
                            onPress={() => setIsLogin(!isLogin)}
                            className="mt-4 items-center"
                        >
                            <Text className="text-gray-600">
                                {isLogin ? t.auth.dontHaveAccount + " " : t.auth.alreadyHaveAccount + " "}
                                <Text className="text-primary font-semibold">
                                    {isLogin ? t.auth.signUp : t.auth.signIn}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
