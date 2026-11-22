import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../theme';
import { Button, CheckRow, Input, PressableScale, ProgressBar, Txt } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { errorMessage } from '../../api/client';
import { toast } from '../../store/toast';
import { AuthShell } from './AuthShell';
const strength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
};
const STRENGTH = [
    { label: 'Too short', color: colors.danger },
    { label: 'Weak', color: colors.danger },
    { label: 'Fair', color: colors.warning },
    { label: 'Good', color: colors.success },
    { label: 'Strong', color: colors.success },
];
export function RegisterScreen({ navigation }) {
    const register = useAuth((s) => s.register);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
    const [agree, setAgree] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const set = (k) => (v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: undefined }));
    };
    const s = strength(form.password);
    const submit = async () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Tell us your name';
        if (!form.email.trim() && !form.phone.trim()) e.email = 'Add an email or a phone number';
        if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'That email looks wrong';
        if (form.phone && !/^(\+92|0092|92|0)?3\d{9}$/.test(form.phone.replace(/[\s-]/g, '')))
            e.phone = 'Use a Pakistani mobile like 0300 1234567';
        if (form.password.length < 8) e.password = 'At least 8 characters';
        if (form.confirm !== form.password) e.confirm = "Passwords don't match";
        if (!agree) e.agree = 'Please accept the terms';
        setErrors(e);
        if (Object.keys(e).length) return;
        setLoading(true);
        try {
            const user = await register({
                name: form.name.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                password: form.password,
            });
            toast.success(`Welcome, ${user.name.split(' ')[0]}!`, 'Your account is ready.');
        } catch (err) {
            toast.error("Couldn't create account", errorMessage(err));
        } finally {
            setLoading(false);
        }
    };
    const fields = [
        { k: 'name', label: 'Full name', icon: 'account-outline', placeholder: 'Ali Raza', extra: { autoCapitalize: 'words' } },
        {
            k: 'email',
            label: 'Email',
            icon: 'email-outline',
            placeholder: 'you@example.com',
            extra: { autoCapitalize: 'none', keyboardType: 'email-address' },
        },
        {
            k: 'phone',
            label: 'Phone (optional if email given)',
            icon: 'phone-outline',
            placeholder: '0300 1234567',
            extra: { keyboardType: 'phone-pad' },
        },
    ];
    return (
        <AuthShell title="Create account" subtitle="Join Chinatown to order faster and earn a wallet.">
            {fields.map((f, i) => (
                <Animated.View key={f.k} entering={FadeInDown.delay(60 * i).springify()}>
                    <Input
                        label={f.label}
                        icon={f.icon}
                        placeholder={f.placeholder}
                        value={form[f.k]}
                        onChangeText={set(f.k)}
                        error={errors[f.k]}
                        {...f.extra}
                    />
                </Animated.View>
            ))}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={{ gap: 8 }}>
                <Input
                    label="Password"
                    icon="lock-outline"
                    placeholder="At least 8 characters"
                    password
                    value={form.password}
                    onChangeText={set('password')}
                    error={errors.password}
                />
                {form.password ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <ProgressBar value={s / 4} color={STRENGTH[s].color} height={6} />
                        </View>
                        <Txt variant="tiny" color={STRENGTH[s].color}>
                            {STRENGTH[s].label}
                        </Txt>
                    </View>
                ) : null}
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(260).springify()}>
                <Input
                    label="Confirm password"
                    icon="lock-check-outline"
                    placeholder="Type it again"
                    password
                    value={form.confirm}
                    onChangeText={set('confirm')}
                    error={errors.confirm}
                />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(320).springify()}>
                <CheckRow
                    checked={agree}
                    onChange={(v) => {
                        setAgree(v);
                        setErrors((e) => ({ ...e, agree: undefined }));
                    }}
                >
                    <Txt variant="small" color={errors.agree ? colors.danger : colors.textMuted}>
                        I agree to the{' '}
                        <Txt variant="smallMedium" color={colors.primary}>
                            Terms
                        </Txt>{' '}
                        and{' '}
                        <Txt variant="smallMedium" color={colors.primary}>
                            Privacy Policy
                        </Txt>
                    </Txt>
                </CheckRow>
            </Animated.View>
            <Button title="Create account" icon="account-plus" loading={loading} onPress={submit} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                <Txt variant="body" color={colors.textMuted}>
                    Already have an account?
                </Txt>
                <PressableScale onPress={() => navigation.goBack()}>
                    <Txt variant="bodyMedium" color={colors.primary}>
                        Sign in
                    </Txt>
                </PressableScale>
            </View>
        </AuthShell>
    );
}
