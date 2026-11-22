import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts, radius } from '../theme';
import { money } from '../utils/format';
import { Button, CheckRow, Icon, Input, Sheet, Txt } from './ui';
const brandOf = (n) => (/^4/.test(n) ? 'VISA' : /^5[1-5]/.test(n) ? 'MASTERCARD' : /^3[47]/.test(n) ? 'AMEX' : 'CARD');
export function CardPaySheet({ visible, amount, onClose, onPay, loading }) {
    const [number, setNumber] = useState('');
    const [name, setName] = useState('');
    const [exp, setExp] = useState('');
    const [cvv, setCvv] = useState('');
    const [decline, setDecline] = useState(false);
    const flip = useSharedValue(0);
    useEffect(() => {
        if (visible) {
            setNumber('');
            setExp('');
            setCvv('');
            setDecline(false);
        }
    }, [visible]);
    const front = useAnimatedStyle(() => ({
        transform: [{ perspective: 800 }, { rotateY: `${flip.value * 180}deg` }],
        backfaceVisibility: 'hidden',
    }));
    const back = useAnimatedStyle(() => ({
        transform: [{ perspective: 800 }, { rotateY: `${flip.value * 180 + 180}deg` }],
        backfaceVisibility: 'hidden',
    }));
    const digits = number.replace(/\D/g, '');
    const valid = digits.length >= 15 && /^(0[1-9]|1[0-2])\/\d{2}$/.test(exp) && cvv.length >= 3;
    const shown = (digits + '•'.repeat(Math.max(0, 16 - digits.length))).replace(/(.{4})/g, '$1 ').trim();
    return (
        <Sheet
            visible={visible}
            onClose={onClose}
            title="Pay by card"
            footer={
                <Button
                    title={`Pay ${money(amount)}`}
                    icon="lock"
                    disabled={!valid}
                    loading={loading}
                    onPress={() => onPay({ last4: digits.slice(-4), decline })}
                />
            }
        >
            <View style={{ height: 190 }}>
                <Animated.View style={[StyleSheet.absoluteFill, front]}>
                    <LinearGradient
                        colors={['#3B1712', colors.primaryDark, colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.card}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Icon name="integrated-circuit-chip" size={36} color={colors.gold} />
                            <Txt variant="h3" color={colors.white} style={{ letterSpacing: 1 }}>
                                {brandOf(digits)}
                            </Txt>
                        </View>
                        <Txt style={{ fontFamily: fonts.semibold, fontWeight: '600', fontSize: 20, color: colors.white, letterSpacing: 2 }}>
                            {shown}
                        </Txt>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Txt variant="tiny" color="#F4C9C0">
                                    CARD HOLDER
                                </Txt>
                                <Txt variant="bodyMedium" color={colors.white}>
                                    {name.toUpperCase() || 'YOUR NAME'}
                                </Txt>
                            </View>
                            <View>
                                <Txt variant="tiny" color="#F4C9C0">
                                    EXPIRES
                                </Txt>
                                <Txt variant="bodyMedium" color={colors.white}>
                                    {exp || 'MM/YY'}
                                </Txt>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, back]}>
                    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.card, { paddingHorizontal: 0 }]}>
                        <View style={{ height: 40, backgroundColor: '#1E1714', marginTop: 4 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20 }}>
                            <View style={{ backgroundColor: colors.white, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 }}>
                                <Txt variant="bodyMedium">{cvv || 'CVV'}</Txt>
                            </View>
                        </View>
                        <View />
                    </LinearGradient>
                </Animated.View>
            </View>
            <Input
                label="Card number"
                icon="credit-card-outline"
                keyboardType="number-pad"
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                value={number}
                onChangeText={(t) =>
                    setNumber(
                        t
                            .replace(/\D/g, '')
                            .slice(0, 16)
                            .replace(/(.{4})/g, '$1 ')
                            .trim(),
                    )
                }
            />
            <Input
                label="Name on card"
                icon="account-outline"
                placeholder="Ali Raza"
                value={name}
                onChangeText={setName}
                autoCapitalize="characters"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <Input
                    containerStyle={{ flex: 1 }}
                    label="Expiry"
                    placeholder="MM/YY"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={exp}
                    onChangeText={(t) => {
                        const d = t.replace(/\D/g, '').slice(0, 4);
                        setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    }}
                />
                <Input
                    containerStyle={{ flex: 1 }}
                    label="CVV"
                    placeholder="123"
                    keyboardType="number-pad"
                    password
                    maxLength={4}
                    value={cvv}
                    onFocus={() => (flip.value = withTiming(1, { duration: 450 }))}
                    onBlur={() => (flip.value = withTiming(0, { duration: 450 }))}
                    onChangeText={(t) => setCvv(t.replace(/\D/g, ''))}
                />
            </View>
            <Animated.View entering={FadeIn} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Icon name="shield-lock-outline" size={16} color={colors.success} />
                <Txt variant="tiny" style={{ flex: 1 }}>
                    Test gateway: only the last 4 digits are sent, the card is never stored.
                </Txt>
            </Animated.View>
            <CheckRow checked={decline} onChange={setDecline} label="Simulate a declined card (demo)" />
        </Sheet>
    );
}
const styles = StyleSheet.create({
    card: { flex: 1, borderRadius: radius.xl, padding: 20, justifyContent: 'space-between' },
});
