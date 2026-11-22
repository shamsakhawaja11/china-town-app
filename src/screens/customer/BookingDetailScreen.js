import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { cartApi, ordersApi, reservationsApi, walletApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { date, money, time } from '../../utils/format';
import { reservationStatus } from '../../utils/status';
import { CART_KEY } from '../../hooks/useCart';
import { toast } from '../../store/toast';
import {
    Body,
    Button,
    Card,
    Divider,
    EmptyState,
    Header,
    Icon,
    KV,
    ListSkeleton,
    Pill,
    RadioGroup,
    Screen,
    SuccessBurst,
    Txt,
} from '../../components/ui';
import { CardPaySheet } from '../../components/CardPaySheet';
export function BookingDetailScreen({ route, navigation }) {
    const { id, justBooked } = route.params;
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['reservations', id], queryFn: () => reservationsApi.get(id) });
    const wallet = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
    const [method, setMethod] = useState('wallet');
    const [card, setCard] = useState(null);
    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['reservations'] });
        qc.invalidateQueries({ queryKey: ['wallet'] });
    };
    const pay = useMutation({
        mutationFn: () => reservationsApi.payDeposit(id, method),
        onSuccess: (res) => {
            if (res.nextStep === 'confirm_card') setCard({ paymentId: res.payment.id, amount: res.payment.amount });
            else {
                toast.success('Deposit paid', 'Your table is held.');
                refresh();
            }
        },
        onError: (e) => toast.error('Payment failed', errorMessage(e)),
    });
    const confirmCard = useMutation({
        mutationFn: (v) => ordersApi.confirmCard(card.paymentId, { success: !v.decline, cardLast4: v.last4 }),
        onSuccess: (res) => {
            setCard(null);
            if (res.payment.status === 'succeeded') toast.success('Deposit paid', 'Your table is held.');
            else toast.error('Card declined', 'Try another card or pay from your wallet.');
            refresh();
        },
        onError: (e) => toast.error('Payment failed', errorMessage(e)),
    });
    const cancel = useMutation({
        mutationFn: () => reservationsApi.cancel(id, 'Cancelled in app'),
        onSuccess: (r) => {
            toast.success('Booking cancelled', r.refundedToWallet ? `${money(r.refundedToWallet)} returned to your wallet.` : undefined);
            refresh();
        },
        onError: (e) => toast.error("Couldn't cancel", errorMessage(e)),
    });
    const orderFood = useMutation({
        mutationFn: () => cartApi.update({ orderType: 'dine_in', reservationId: id }),
        onSuccess: (cart) => {
            qc.setQueryData(CART_KEY, cart);
            toast.success('Ordering for your booking', 'Pick your dishes.');
            navigation.navigate('Tabs', { screen: 'Menu' });
        },
        onError: (e) => toast.error("Couldn't start order", errorMessage(e)),
    });
    const r = q.data;
    if (q.isLoading) {
        return (
            <Screen>
                <Header title="Booking" />
                <ListSkeleton rows={3} />
            </Screen>
        );
    }
    if (!r) {
        return (
            <Screen>
                <Header title="Booking" />
                <EmptyState tone="error" title="Booking not found" action="Retry" onAction={() => q.refetch()} />
            </Screen>
        );
    }
    const tone = reservationStatus[r.status];
    const depositDue = r.deposit && r.deposit.required > 0 ? Math.max(0, r.deposit.required - r.deposit.held) : 0;
    const canCancel = r.status === 'pending' || r.status === 'confirmed';
    return (
        <Screen>
            <Header
                title={justBooked ? 'Booking confirmed' : 'Your booking'}
                onBack={justBooked ? () => navigation.navigate('Tabs', { screen: 'Bookings' }) : undefined}
            />
            <Body>
                {justBooked ? (
                    <View style={{ alignItems: 'center' }}>
                        <SuccessBurst size={90} />
                        <Animated.View entering={FadeInDown.delay(400)}>
                            <Txt variant="h1" center>
                                Table reserved!
                            </Txt>
                            <Txt variant="small" center>
                                We'll confirm it shortly and send you a notification.
                            </Txt>
                        </Animated.View>
                    </View>
                ) : null}

                <Animated.View entering={ZoomIn.delay(justBooked ? 500 : 0).springify()}>
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                        <View style={styles.ticketTop}>
                            <View>
                                <Txt variant="tiny" color="#FFD9D2">
                                    BOOKING CODE
                                </Txt>
                                <Txt variant="h1" color={colors.white} style={{ letterSpacing: 2 }}>
                                    {r.bookingCode}
                                </Txt>
                            </View>
                            <Pill label={tone.label} icon={tone.icon} fg={tone.fg} bg={colors.white} />
                        </View>
                        <View style={styles.notchRow}>
                            <View style={[styles.notch, { left: -12 }]} />
                            <View
                                style={{
                                    flex: 1,
                                    borderTopWidth: 2,
                                    borderStyle: 'dashed',
                                    borderColor: colors.border,
                                    marginHorizontal: 16,
                                }}
                            />
                            <View style={[styles.notch, { right: -12 }]} />
                        </View>
                        <View style={{ padding: 18, gap: 14 }}>
                            <View style={{ flexDirection: 'row' }}>
                                {[
                                    { icon: 'calendar', l: 'Date', v: date(r.reservationTime) },
                                    { icon: 'clock-outline', l: 'Time', v: time(r.reservationTime) },
                                    { icon: 'account-group', l: 'Guests', v: String(r.partySize) },
                                ].map((x) => (
                                    <View key={x.l} style={{ flex: 1, gap: 2 }}>
                                        <Icon name={x.icon} size={18} color={colors.primary} />
                                        <Txt variant="tiny">{x.l}</Txt>
                                        <Txt variant="bodyMedium">{x.v}</Txt>
                                    </View>
                                ))}
                            </View>
                            <KV
                                label="Table"
                                value={r.tables.map((t) => `${t.tableNumber}${t.category ? ` (${t.category})` : ''}`).join(', ')}
                            />
                            <KV label="Duration" value={`${r.durationMinutes} min · until ${time(r.endTime)}`} />
                            {r.specialRequests ? <KV label="Requests" value={r.specialRequests} /> : null}
                            {r.cancellationReason ? <KV label="Cancelled" value={r.cancellationReason} color={colors.danger} /> : null}
                        </View>
                    </Card>
                </Animated.View>

                {r.deposit && r.deposit.required > 0 ? (
                    <Card style={{ gap: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Icon name="shield-check" size={22} color={depositDue ? colors.warning : colors.success} />
                            <Txt variant="h3" style={{ flex: 1 }}>
                                Deposit
                            </Txt>
                            <Pill
                                label={depositDue ? `${money(depositDue)} due` : r.deposit.refunded ? 'Returned' : 'Paid'}
                                fg={depositDue ? colors.warning : colors.success}
                                bg={depositDue ? colors.warningSoft : colors.successSoft}
                            />
                        </View>
                        <Txt variant="small">
                            Refundable. Returned to your wallet when you arrive, or if you cancel in time. Kept on a no-show.
                        </Txt>
                        {depositDue > 0 && canCancel ? (
                            <>
                                <Divider />
                                <RadioGroup
                                    value={method}
                                    onChange={setMethod}
                                    options={[
                                        {
                                            value: 'wallet',
                                            label: 'Wallet',
                                            description: `Balance ${money(wallet.data?.balance ?? 0)}`,
                                            icon: 'wallet-outline',
                                        },
                                        {
                                            value: 'card',
                                            label: 'Debit / credit card',
                                            description: 'Visa, Mastercard',
                                            icon: 'credit-card-outline',
                                        },
                                    ]}
                                />
                                <Button
                                    title={`Pay deposit · ${money(depositDue)}`}
                                    icon="lock"
                                    loading={pay.isPending}
                                    onPress={() => pay.mutate()}
                                />
                            </>
                        ) : null}
                    </Card>
                ) : null}

                {r.status === 'confirmed' || r.status === 'seated' ? (
                    <Button
                        title="Order food for this table"
                        icon="silverware-fork-knife"
                        loading={orderFood.isPending}
                        onPress={() => orderFood.mutate()}
                    />
                ) : null}
                {canCancel ? (
                    <Button
                        title="Cancel booking"
                        variant="outline"
                        icon="calendar-remove"
                        loading={cancel.isPending}
                        onPress={() =>
                            Alert.alert('Cancel this booking?', 'Deposits are refunded if you cancel at least 2 hours before.', [
                                { text: 'Keep it', style: 'cancel' },
                                { text: 'Cancel booking', style: 'destructive', onPress: () => cancel.mutate() },
                            ])
                        }
                    />
                ) : null}
                {justBooked ? (
                    <Button title="Back to home" variant="ghost" onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} />
                ) : null}
            </Body>
            <CardPaySheet
                visible={!!card}
                amount={card?.amount ?? 0}
                onClose={() => setCard(null)}
                loading={confirmCard.isPending}
                onPay={(v) => confirmCard.mutate(v)}
            />
        </Screen>
    );
}
const styles = StyleSheet.create({
    ticketTop: {
        backgroundColor: colors.primary,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notchRow: { flexDirection: 'row', alignItems: 'center', height: 24, backgroundColor: colors.surface },
    notch: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg },
});
