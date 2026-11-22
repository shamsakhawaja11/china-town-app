import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import { haptics } from '../../lib/haptics';
import { ordersApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors, fonts, radius } from '../../theme';
import { dateTime, money, time } from '../../utils/format';
import { kitchenStatus, orderStatus, paymentStatus } from '../../utils/status';
import { toast } from '../../store/toast';
import {
    Body,
    BottomBar,
    Button,
    Card,
    DishImage,
    Divider,
    EmptyState,
    Header,
    Icon,
    KV,
    ListSkeleton,
    Pill,
    Screen,
    Txt,
} from '../../components/ui';
import { OrderTimeline } from '../../components/OrderTimeline';
const HEADLINE = {
    pending: 'Waiting for the restaurant to accept',
    accepted: 'Accepted! Chefs are getting ready',
    preparing: 'Your food is being cooked',
    ready: 'Ready! Almost there',
    served: 'Enjoy your meal',
    completed: 'Thanks for dining with us',
    rejected: 'Sorry, the order was rejected',
    cancelled: 'This order was cancelled',
};
function LiveIcon({ icon, color, active }) {
    const r = useSharedValue(0);
    useEffect(() => {
        r.value = active
            ? withRepeat(withSequence(withTiming(-8, { duration: 400 }), withTiming(8, { duration: 400 })), -1, true)
            : withTiming(0);
    }, [active, r]);
    const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
    return (
        <Animated.View style={[styles.liveIcon, style]}>
            <Icon name={icon} size={40} color={color} />
        </Animated.View>
    );
}
export function OrderTrackingScreen({ route, navigation }) {
    const { id, justPlaced } = route.params;
    const qc = useQueryClient();
    const q = useQuery({
        queryKey: ['orders', id],
        queryFn: () => ordersApi.get(id),
        refetchInterval: (query) => (['completed', 'cancelled', 'rejected'].includes(query.state.data?.status ?? '') ? false : 8000),
    });
    const status = q.data?.status;
    const prev = React.useRef(status);
    useEffect(() => {
        if (prev.current && status && prev.current !== status) {
            haptics.success();
            toast.info('Order update', orderStatus[status]?.label);
        }
        prev.current = status;
    }, [status]);
    const cancel = useMutation({
        mutationFn: () => ordersApi.cancel(id, 'Cancelled in app'),
        onSuccess: (o) => {
            qc.invalidateQueries({ queryKey: ['orders'] });
            qc.invalidateQueries({ queryKey: ['wallet'] });
            toast.success('Order cancelled', o.refundedToWallet ? `${money(o.refundedToWallet)} returned to your wallet.` : undefined);
        },
        onError: (e) => toast.error("Couldn't cancel", errorMessage(e)),
    });
    const o = q.data;
    if (q.isLoading) {
        return (
            <Screen>
                <Header title="Order" />
                <ListSkeleton rows={3} />
            </Screen>
        );
    }
    if (!o) {
        return (
            <Screen>
                <Header title="Order" />
                <EmptyState tone="error" title="Order not found" action="Retry" onAction={() => q.refetch()} />
            </Screen>
        );
    }
    const tone = orderStatus[o.status];
    const pay = paymentStatus[o.paymentStatus];
    const live = ['pending', 'accepted', 'preparing', 'ready', 'served'].includes(o.status);
    const canPay = o.paymentStatus === 'unpaid' && live;
    const canRate = o.status === 'completed' && (!o.restaurantReview || o.items.some((i) => !i.review));
    const doneItems = o.items.filter((i) => i.kitchenStatus === 'done').length;
    return (
        <Screen>
            <Header
                title={`Order #${o.orderNumber}`}
                subtitle={dateTime(o.placedAt)}
                onBack={justPlaced ? () => navigation.navigate('Tabs', { screen: 'Orders', params: { scope: 'active' } }) : undefined}
            />
            <Body refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
                <Animated.View entering={FadeInDown.springify()}>
                    <LinearGradient
                        colors={o.status === 'rejected' || o.status === 'cancelled' ? ['#5A1E1A', '#8E2A22'] : [colors.dark, '#4A1A12']}
                        style={styles.hero}
                    >
                        <LiveIcon icon={tone.icon} color={colors.gold} active={o.status === 'preparing'} />
                        <View style={{ flex: 1, gap: 4 }}>
                            {justPlaced && o.status === 'pending' ? (
                                <Txt variant="smallMedium" color={colors.gold}>
                                    ORDER PLACED 🎉
                                </Txt>
                            ) : null}
                            <Txt variant="h2" color={colors.white}>
                                {HEADLINE[o.status]}
                            </Txt>
                            {o.status === 'preparing' || o.status === 'accepted' ? (
                                <Txt variant="small" color="#D9C2B9">
                                    {doneItems}/{o.items.length} dishes ready
                                </Txt>
                            ) : null}
                            {o.rejectionReason ? (
                                <Txt variant="small" color="#FFC9C0">
                                    {o.rejectionReason}
                                </Txt>
                            ) : null}
                            {o.cancellationReason ? (
                                <Txt variant="small" color="#FFC9C0">
                                    {o.cancellationReason}
                                </Txt>
                            ) : null}
                        </View>
                    </LinearGradient>
                </Animated.View>

                {o.pickup ? (
                    <Animated.View entering={ZoomIn.delay(150).springify()}>
                        <Card style={{ alignItems: 'center', gap: 6, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.primary }}>
                            <Txt variant="smallMedium" color={colors.primary}>
                                SHOW THIS AT THE COUNTER
                            </Txt>
                            <Txt style={{ fontFamily: fonts.bold, fontWeight: '700', fontSize: 34, letterSpacing: 4, color: colors.text }}>
                                {o.pickup.pickupCode}
                            </Txt>
                            <Txt variant="small">
                                {o.pickup.pickedUpAt
                                    ? `Picked up at ${time(o.pickup.pickedUpAt)}`
                                    : o.pickup.estimatedReadyAt
                                      ? `Estimated ready by ${time(o.pickup.estimatedReadyAt)}`
                                      : ''}
                            </Txt>
                        </Card>
                    </Animated.View>
                ) : null}

                <Card>
                    <OrderTimeline steps={o.timeline} />
                </Card>

                <Card style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Txt variant="h3">Your dishes</Txt>
                        <Pill
                            label={
                                o.orderType === 'takeaway'
                                    ? 'Takeaway'
                                    : `Dine-in${o.tables[0] ? ` · ${o.tables.map((t) => t.table_number).join(', ')}` : ''}`
                            }
                            fg={colors.textMuted}
                            bg={colors.surfaceAlt}
                        />
                    </View>
                    {o.items.map((item) => {
                        const k = kitchenStatus[item.kitchenStatus];
                        return (
                            <View key={item.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                <DishImage uri={item.imageUrl} size={48} radius={12} />
                                <View style={{ flex: 1 }}>
                                    <Txt variant="bodyMedium" numberOfLines={1}>
                                        {item.quantity}× {item.name}
                                    </Txt>
                                    {item.specialInstructions ? (
                                        <Txt variant="tiny" color={colors.gold}>
                                            “{item.specialInstructions}”
                                        </Txt>
                                    ) : null}
                                    {live && o.status !== 'pending' ? (
                                        <Pill label={k.label} icon={k.icon} fg={k.fg} bg={k.bg} style={{ marginTop: 3 }} />
                                    ) : null}
                                </View>
                                <Txt variant="bodyMedium">{money(item.subtotal)}</Txt>
                            </View>
                        );
                    })}
                    <Divider dashed />
                    <KV label="Subtotal" value={money(o.subtotal)} />
                    <KV label="Tax" value={money(o.tax)} />
                    {o.tip ? <KV label="Tip" value={money(o.tip)} /> : null}
                    <KV label="Total" value={money(o.total)} bold big color={colors.primary} />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <Pill
                            label={`${pay.label}${o.paymentMethod ? ` · ${o.paymentMethod}` : ''}`}
                            icon={pay.icon}
                            fg={pay.fg}
                            bg={pay.bg}
                        />
                    </View>
                </Card>
                {o.notes ? (
                    <Card flat style={{ flexDirection: 'row', gap: 10 }}>
                        <Icon name="message-text-outline" size={20} color={colors.textMuted} />
                        <Txt variant="small" style={{ flex: 1 }}>
                            {o.notes}
                        </Txt>
                    </Card>
                ) : null}
                {o.status === 'pending' ? (
                    <Button
                        title="Cancel order"
                        variant="outline"
                        icon="close"
                        loading={cancel.isPending}
                        onPress={() =>
                            Alert.alert(
                                'Cancel order?',
                                'You can cancel until the restaurant accepts it. Anything paid goes back to your wallet.',
                                [
                                    { text: 'Keep order', style: 'cancel' },
                                    { text: 'Cancel order', style: 'destructive', onPress: () => cancel.mutate() },
                                ],
                            )
                        }
                    />
                ) : null}
            </Body>
            {canPay || canRate ? (
                <BottomBar>
                    {canPay ? (
                        <Button
                            title={`View bill & pay · ${money(o.total)}`}
                            icon="receipt"
                            onPress={() => navigation.navigate('Bill', { orderId: o.id })}
                        />
                    ) : null}
                    {canRate ? (
                        <Button
                            title="Rate your order"
                            icon="star"
                            variant="dark"
                            onPress={() => navigation.navigate('RateOrder', { orderId: o.id })}
                        />
                    ) : null}
                </BottomBar>
            ) : null}
        </Screen>
    );
}
const styles = StyleSheet.create({
    hero: { borderRadius: radius.xl, padding: 18, flexDirection: 'row', gap: 16, alignItems: 'center' },
    liveIcon: {
        width: 70,
        height: 70,
        borderRadius: 22,
        backgroundColor: 'rgba(230,169,58,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
