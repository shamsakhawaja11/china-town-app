import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { secureStorage } from '../../lib/secureStorage';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { colors } from '../../theme';
import { Button, CheckRow, Chip, Input, PressableScale, Txt } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { errorMessage } from '../../api/client';
import { toast } from '../../store/toast';
import { AuthShell } from './AuthShell';
const REMEMBER_KEY = 'ct.rememberedContact';
const DEMO = [
    { label: 'Customer', icon: 'account', contact: 'ayesha@gmail.com' },
    { label: 'Admin', icon: 'shield-crown', contact: 'admin@chinatown.pk' },
    { label: 'Manager', icon: 'briefcase', contact: 'manager@chinatown.pk' },
    { label: 'Chef', icon: 'chef-hat', contact: 'chef@chinatown.pk' },
    { label: 'Waiter', icon: 'room-service', contact: 'waiter@chinatown.pk' },
];
export function LoginScreen({ navigation }) {
    const login = useAuth((s) => s.login);
    const [contact, setContact] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const shake = useSharedValue(0);
    const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
    useEffect(() => {
        secureStorage
            .getItem(REMEMBER_KEY)
            .then((v) => v && setContact(v))
            .catch(() => undefined);
    }, []);
    const submit = async () => {
        const e = {};
        if (!contact.trim()) e.contact = 'Enter your email or phone number';
        if (password.length < 8) e.password = 'Password is at least 8 characters';
        setErrors(e);
        if (Object.keys(e).length) {
            shake.value = withSequence(
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(-6, { duration: 50 }),
                withTiming(0, { duration: 50 }),
            );
            return;
        }
        setLoading(true);
        try {
            if (remember) await secureStorage.setItem(REMEMBER_KEY, contact.trim());
            else await secureStorage.deleteItem(REMEMBER_KEY);
            const user = await login(contact, password);
            toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
        } catch (err) {
            shake.value = withSequence(
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(-6, { duration: 50 }),
                withTiming(0, { duration: 50 }),
            );
            toast.error('Sign in failed', errorMessage(err, 'Wrong email/phone or password'));
        } finally {
            setLoading(false);
        }
    };
    return (
        <AuthShell title="Welcome back" subtitle="Sign in to order, book a table and track your food.">
            <Animated.View style={[{ gap: 14 }, shakeStyle]}>
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                    <Input
                        label="Email or phone"
                        icon="account-outline"
                        placeholder="you@example.com or 0300 1234567"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={contact}
                        onChangeText={(t) => {
                            setContact(t);
                            setErrors((x) => ({ ...x, contact: undefined }));
                        }}
                        error={errors.contact}
                        returnKeyType="next"
                    />
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(160).springify()}>
                    <Input
                        label="Password"
                        icon="lock-outline"
                        placeholder="••••••••"
                        password
                        value={password}
                        onChangeText={(t) => {
                            setPassword(t);
                            setErrors((x) => ({ ...x, password: undefined }));
                        }}
                        error={errors.password}
                        onSubmitEditing={submit}
                        returnKeyType="go"
                    />
                </Animated.View>
                <Animated.View
                    entering={FadeInDown.delay(240).springify()}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <View style={{ flex: 1 }}>
                        <CheckRow checked={remember} onChange={setRemember} label="Remember me" />
                    </View>
                    <PressableScale onPress={() => toast.info('Forgot password?', 'Ask the restaurant manager to reset it for you.')}>
                        <Txt variant="smallMedium" color={colors.primary}>
                            Forgot password?
                        </Txt>
                    </PressableScale>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(320).springify()}>
                    <Button title="Sign in" iconRight="arrow-right" loading={loading} onPress={submit} />
                </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(420).springify()} style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                    <Txt variant="small">Demo accounts · Password@123</Txt>
                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {DEMO.map((d) => (
                        <Chip
                            key={d.label}
                            small
                            icon={d.icon}
                            label={d.label}
                            active={contact === d.contact}
                            onPress={() => {
                                setContact(d.contact);
                                setPassword('Password@123');
                                setErrors({});
                            }}
                        />
                    ))}
                </View>
            </Animated.View>

            <Animated.View
                entering={FadeInDown.delay(500).springify()}
                style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4 }}
            >
                <Txt variant="body" color={colors.textMuted}>
                    New to Chinatown?
                </Txt>
                <PressableScale onPress={() => navigation.navigate('Register')}>
                    <Txt variant="bodyMedium" color={colors.primary}>
                        Create account
                    </Txt>
                </PressableScale>
            </Animated.View>
        </AuthShell>
    );
}
