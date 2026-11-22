import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { walletApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors, radius } from '../../theme';
import { dateTime, money } from '../../utils/format';
import { toast } from '../../store/toast';
import { AnimatedNumber, Button, Card, Chip, EmptyState, Header, Icon, Input, Screen, Skeleton, Txt } from '../../components/ui';
import { CardPaySheet } from '../../components/CardPaySheet';
const AMOUNTS = [500, 1000, 2000, 5000];
export function WalletScreen() {
    const qc = useQueryClient();
    const wallet = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
    const txns = useQuery({ queryKey: ['wallet', 'txns'], queryFn: () => walletApi.transactions() });
    const [amount, setAmount] = useState('1000');
    const [sheet, setSheet] = useState(false);
    const key = useRef(`${Date.now()}`);
    const topUp = useMutation({
        mutationFn: (v) => {
            if (v.decline) return Promise.reject(new Error('declined'));
            return walletApi.topUp(Number(amount), v.last4, key.current);
        },
        onSuccess: (r) => {
            setSheet(false);
            key.current = `${Date.now()}`;
            toast.success('Wallet topped up', `New balance ${money(r.balance)}`);
            qc.invalidateQueries({ queryKey: ['wallet'] });
            qc.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (e) => {
            setSheet(false);
            toast.error('Top-up failed', e.message === 'declined' ? 'The card was declined (simulated).' : errorMessage(e));
        },
    });
    const amt = Number(amount) || 0;
    const valid = amt >= 100 && amt <= 50000;
    return (
        <Screen>
            <Header title="Wallet" />
            <FlatList
                data={txns.data?.items ?? []}
                keyExtractor={(t) => t.id}
                contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
                ListHeaderComponent={
                    <View style={{ gap: 16, marginBottom: 6 }}>
                        <Animated.View entering={FadeInDown.springify()}>
                            <LinearGradient
                                colors={[colors.dark, '#5A1A12', colors.primary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.card}
                            >
                                <View style={styles.c1} />
                                <View style={styles.c2} />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Txt variant="smallMedium" color="#E6C7BC">
                                        Available balance
                                    </Txt>
                                    <Icon name="contactless-payment" size={24} color={colors.gold} />
                                </View>
                                {wallet.isLoading ? (
                                    <Skeleton width={160} height={36} />
                                ) : (
                                    <AnimatedNumber
                                        value={wallet.data?.balance ?? 0}
                                        format={money}
                                        variant="display"
                                        color={colors.white}
                                    />
                                )}
                                <Txt variant="tiny" color={colors.gold}>
                                    CHINATOWN WALLET
                                </Txt>
                            </LinearGradient>
                        </Animated.View>
                        <Card style={{ gap: 12 }}>
                            <Txt variant="h3">Top up</Txt>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {AMOUNTS.map((a) => (
                                    <Chip
                                        key={a}
                                        small
                                        label={`Rs ${a}`}
                                        active={amount === String(a)}
                                        onPress={() => setAmount(String(a))}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    />
                                ))}
                            </View>
                            <Input
                                icon="cash-plus"
                                keyboardType="number-pad"
                                value={amount}
                                onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
                                hint="Between Rs 100 and Rs 50,000"
                                error={amount && !valid ? 'Enter Rs 100 – 50,000' : null}
                            />
                            <Button
                                title={`Add ${money(amt)}`}
                                icon="credit-card-plus-outline"
                                disabled={!valid}
                                onPress={() => setSheet(true)}
                            />
                        </Card>
                        <Txt variant="h3">History</Txt>
                    </View>
                }
                ListEmptyComponent={
                    txns.isLoading ? <Skeleton height={60} /> : <EmptyState icon="wallet-outline" title="No transactions yet" />
                }
                renderItem={({ item, index }) => {
                    const credit = item.type !== 'debit';
                    return (
                        <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
                            <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                                <View style={[styles.txIcon, { backgroundColor: credit ? colors.successSoft : colors.primaryLight }]}>
                                    <Icon
                                        name={item.type === 'refund' ? 'cash-refund' : credit ? 'arrow-down-bold' : 'arrow-up-bold'}
                                        size={20}
                                        color={credit ? colors.success : colors.primary}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Txt variant="bodyMedium" numberOfLines={1}>
                                        {item.description ?? item.type}
                                    </Txt>
                                    <Txt variant="tiny">{dateTime(item.createdAt)}</Txt>
                                </View>
                                <Txt variant="bodyMedium" color={credit ? colors.success : colors.text}>
                                    {credit ? '+' : '−'}
                                    {money(item.amount)}
                                </Txt>
                            </Card>
                        </Animated.View>
                    );
                }}
            />
            <CardPaySheet
                visible={sheet}
                amount={amt}
                onClose={() => setSheet(false)}
                loading={topUp.isPending}
                onPay={(v) => topUp.mutate(v)}
            />
        </Screen>
    );
}
const styles = StyleSheet.create({
    card: { borderRadius: radius.xxl, padding: 22, gap: 8, overflow: 'hidden', minHeight: 170, justifyContent: 'space-between' },
    c1: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        right: -70,
        top: -90,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    c2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        right: 40,
        bottom: -80,
        backgroundColor: 'rgba(230,169,58,0.14)',
    },
    txIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
