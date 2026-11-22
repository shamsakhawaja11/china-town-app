import React, { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ordersApi, walletApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { money } from '../../utils/format';
import { toast } from '../../store/toast';
import {
    AnimatedNumber,
    Body,
    BottomBar,
    Button,
    Card,
    Chip,
    Divider,
    EmptyState,
    Header,
    Icon,
    KV,
    ListSkeleton,
    Pill,
    RadioGroup,
    Screen,
    Txt,
} from '../../components/ui';
import { CardPaySheet } from '../../components/CardPaySheet';
const TIPS = [0, 5, 10, 15];
export function BillScreen({ route, navigation }) {
    const { orderId } = route.params;
    const qc = useQueryClient();
    const bill = useQuery({ queryKey: ['bill', orderId], queryFn: () => ordersApi.bill(orderId), refetchInterval: 10000 });
    const wallet = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
    const [tipPct, setTipPct] = useState(0);
    const [method, setMethod] = useState('wallet');
    const [card, setCard] = useState(null);
    const b = bill.data;
    const tip = b ? Math.round((b.subtotal * tipPct) / 100) : 0;
    const total = b ? b.subtotal + b.tax + tip : 0;
    const balance = wallet.data?.balance ?? 0;
    const waitingCash = b?.payments.find((p) => p.method === 'cash' && p.status === 'initiated');
    const success = (amount, m) => {
        qc.invalidateQueries({ queryKey: ['orders'] });
        qc.invalidateQueries({ queryKey: ['bill', orderId] });
        qc.invalidateQueries({ queryKey: ['wallet'] });
        navigation.replace('PaymentSuccess', { amount, orderId, method: m });
    };
    const pay = useMutation({
        mutationFn: () => ordersApi.pay(orderId, { method, tip: tip || undefined }),
        onSuccess: (res) => {
            if (res.nextStep === 'done') success(res.payment.amount, 'wallet');
            else if (res.nextStep === 'confirm_card') setCard({ paymentId: res.payment.id, amount: res.payment.amount });
            else {
                toast.success('Waiter is on the way', 'Pay in cash at your table, staff will confirm it.');
                bill.refetch();
            }
        },
        onError: (e) => toast.error('Payment failed', errorMessage(e)),
    });
    const confirm = useMutation({
        mutationFn: (v) => ordersApi.confirmCard(card.paymentId, { success: !v.decline, cardLast4: v.last4 }),
        onSuccess: (res) => {
            setCard(null);
            if (res.payment.status === 'succeeded') success(res.payment.amount, 'card');
            else {
                toast.error('Card declined', 'Nothing was charged. Try another card or method.');
                bill.refetch();
            }
        },
        onError: (e) => toast.error('Payment failed', errorMessage(e)),
    });
    if (bill.isLoading) {
        return (
            <Screen>
                <Header title="Bill" />
                <ListSkeleton rows={3} />
            </Screen>
        );
    }
    if (!b) {
        return (
            <Screen>
                <Header title="Bill" />
                <EmptyState tone="error" title="Couldn't load the bill" action="Retry" onAction={() => bill.refetch()} />
            </Screen>
        );
    }
    if (b.paymentStatus !== 'unpaid') {
        return (
            <Screen>
                <Header title="Bill" />
                <EmptyState
                    icon="check-decagram"
                    title="Already paid"
                    message={`${money(b.paid)} received. Thank you!`}
                    action="Back to order"
                    onAction={() => navigation.goBack()}
                />
            </Screen>
        );
    }
    return (
        <Screen>
            <Header
                title="Bill"
                subtitle={b.tableNumber ? `Table ${b.tableNumber}` : b.orderType === 'takeaway' ? 'Takeaway' : undefined}
            />
            <Body>
                <Animated.View entering={FadeInDown.springify()}>
                    <Card style={{ gap: 10 }}>
                        {b.items.map((i) => (
                            <View key={i.id} style={{ flexDirection: 'row', gap: 10 }}>
                                <Txt variant="bodyMedium" color={colors.primary} style={{ width: 28 }}>
                                    {i.quantity}×
                                </Txt>
                                <Txt variant="body" style={{ flex: 1 }} numberOfLines={1}>
                                    {i.name}
                                </Txt>
                                <Txt variant="bodyMedium">{money(i.subtotal)}</Txt>
                            </View>
                        ))}
                        <Divider dashed />
                        <KV label="Subtotal" value={money(b.subtotal)} />
                        <KV label={`Tax (${b.taxRatePercent}%)`} value={money(b.tax)} />
                        <KV label="Tip" value={money(tip)} />
                        <Divider />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Txt variant="h3">Total</Txt>
                            <AnimatedNumber value={total} format={money} variant="h1" color={colors.primary} duration={500} />
                        </View>
                    </Card>
                </Animated.View>

                {waitingCash ? (
                    <Animated.View entering={FadeIn}>
                        <Card flat style={{ flexDirection: 'row', gap: 10, backgroundColor: colors.goldSoft, borderColor: '#F3DDB0' }}>
                            <Icon name="cash-clock" size={24} color={colors.gold} />
                            <View style={{ flex: 1 }}>
                                <Txt variant="bodyMedium">Cash payment requested</Txt>
                                <Txt variant="small">
                                    Hand {money(waitingCash.amount)} to your waiter. This screen updates once they confirm.
                                </Txt>
                            </View>
                        </Card>
                    </Animated.View>
                ) : null}

                <View style={{ gap: 10 }}>
                    <Txt variant="h3">Add a tip for the team</Txt>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {TIPS.map((t) => (
                            <Chip
                                key={t}
                                label={t ? `${t}%` : 'No tip'}
                                active={tipPct === t}
                                onPress={() => setTipPct(t)}
                                style={{ flex: 1, justifyContent: 'center' }}
                            />
                        ))}
                    </View>
                </View>

                <View style={{ gap: 10 }}>
                    <Txt variant="h3">Pay with</Txt>
                    <RadioGroup
                        value={method}
                        onChange={setMethod}
                        options={[
                            {
                                value: 'wallet',
                                label: 'Chinatown wallet',
                                description: `Balance ${money(balance)}${balance < total ? ' · not enough' : ''}`,
                                icon: 'wallet-outline',
                                disabled: balance < total,
                                right: balance < total ? <Pill label="Top up" fg={colors.primary} bg={colors.primaryLight} /> : null,
                            },
                            {
                                value: 'card',
                                label: 'Debit / credit card',
                                description: 'Visa, Mastercard, UnionPay',
                                icon: 'credit-card-outline',
                            },
                            { value: 'cash', label: 'Cash', description: 'Pay your waiter at the table', icon: 'cash' },
                        ]}
                    />
                    {balance < total ? (
                        <Button
                            title="Top up wallet"
                            variant="ghost"
                            icon="plus-circle-outline"
                            size="sm"
                            onPress={() => navigation.navigate('Wallet')}
                        />
                    ) : null}
                </View>
            </Body>
            <BottomBar>
                <Button
                    title={method === 'cash' ? `Request cash payment · ${money(total)}` : `Pay ${money(total)}`}
                    icon={method === 'cash' ? 'hand-coin-outline' : 'lock'}
                    loading={pay.isPending}
                    disabled={(method === 'wallet' && balance < total) || (method === 'cash' && !!waitingCash)}
                    onPress={() => pay.mutate()}
                />
            </BottomBar>
            <CardPaySheet
                visible={!!card}
                amount={card?.amount ?? 0}
                onClose={() => setCard(null)}
                loading={confirm.isPending}
                onPay={(v) => confirm.mutate(v)}
            />
        </Screen>
    );
}
