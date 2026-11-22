import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { adminApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { dateTime, money, time } from '../../utils/format';
import { kitchenStatus, orderStatus, paymentStatus } from '../../utils/status';
import { appRoleOf, useAuth } from '../../store/auth';
import { toast } from '../../store/toast';
import {
    Avatar,
    Body,
    BottomBar,
    Button,
    Card,
    CheckRow,
    Divider,
    EmptyState,
    Header,
    Icon,
    IconButton,
    Input,
    KV,
    ListSkeleton,
    Pill,
    Screen,
    Sheet,
    Txt,
} from '../../components/ui';
import { ReasonSheet } from '../../components/ReasonSheet';
import { OrderTimeline } from '../../components/OrderTimeline';
export function AdminOrderScreen({ route, navigation }) {
    const { id } = route.params;
    const qc = useQueryClient();
    const role = appRoleOf(useAuth((s) => s.user));
    const isBoss = role === 'admin' || role === 'manager';
    const isFloor = isBoss || role === 'waiter';
    const q = useQuery({ queryKey: ['admin', 'order', id], queryFn: () => adminApi.order(id), refetchInterval: 10000 });
    const bill = useQuery({ queryKey: ['admin', 'bill', id], queryFn: () => adminApi.bill(id), enabled: isFloor, refetchInterval: 10000 });
    const [sheet, setSheet] = useState(null);
    const [pickupCode, setPickupCode] = useState('');
    const [refundFor, setRefundFor] = useState(null);
    const [refund, setRefund] = useState({ amount: '', reason: '', toWallet: true });
    const done = (msg) => {
        toast.success(msg);
        setSheet(null);
        qc.invalidateQueries({ queryKey: ['admin'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
        qc.invalidateQueries({ queryKey: ['kitchen'] });
    };
    const fail = (title) => (e) => toast.error(title, errorMessage(e));
    const accept = useMutation({
        mutationFn: () => adminApi.accept(id),
        onSuccess: () => {
            done('Order accepted');
            navigation.navigate('AssignChefs', { orderId: id });
        },
        onError: fail("Couldn't accept"),
    });
    const reject = useMutation({
        mutationFn: (r) => adminApi.reject(id, r),
        onSuccess: () => done('Order rejected'),
        onError: fail("Couldn't reject"),
    });
    const cancel = useMutation({
        mutationFn: (r) => adminApi.cancel(id, r),
        onSuccess: () => done('Order cancelled'),
        onError: fail("Couldn't cancel"),
    });
    const serve = useMutation({
        mutationFn: () => adminApi.serve(id),
        onSuccess: () => done('Marked as served'),
        onError: fail("Couldn't update"),
    });
    const pickup = useMutation({
        mutationFn: () => adminApi.pickup(id, pickupCode.trim()),
        onSuccess: () => done('Handed over'),
        onError: fail('Pickup failed'),
    });
    const complete = useMutation({
        mutationFn: () => adminApi.complete(id),
        onSuccess: () => done('Order completed'),
        onError: fail("Couldn't complete"),
    });
    const cash = useMutation({
        mutationFn: () => adminApi.recordCash(id),
        onSuccess: () => done('Cash payment recorded'),
        onError: fail("Couldn't record cash"),
    });
    const confirmCash = useMutation({
        mutationFn: (pid) => adminApi.confirmCash(pid),
        onSuccess: () => done('Cash confirmed'),
        onError: fail("Couldn't confirm"),
    });
    const doRefund = useMutation({
        mutationFn: () =>
            adminApi.refund(refundFor.id, {
                amount: refund.amount ? Number(refund.amount) : undefined,
                reason: refund.reason.trim(),
                toWallet: refund.toWallet,
            }),
        onSuccess: () => {
            setRefundFor(null);
            done('Refund processed');
        },
        onError: fail('Refund failed'),
    });
    const o = q.data;
    if (q.isLoading) {
        return (
            <Screen>
                <Header title="Order" />
                <ListSkeleton rows={4} />
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
    const unpaid = o.paymentStatus === 'unpaid';
    const live = ['pending', 'accepted', 'preparing', 'ready', 'served'].includes(o.status);
    const unassigned = o.items.filter((i) => i.kitchenStatus === 'unassigned').length;
    const actions = [];
    if (o.status === 'pending' && isBoss) {
        actions.push(
            <View key="decide" style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Reject" variant="outline" icon="close" style={{ flex: 1 }} onPress={() => setSheet('reject')} />
                <Button
                    title="Accept"
                    variant="success"
                    icon="check"
                    style={{ flex: 1.5 }}
                    loading={accept.isPending}
                    onPress={() => accept.mutate()}
                />
            </View>,
        );
    }
    if ((o.status === 'accepted' || o.status === 'preparing') && isBoss) {
        actions.push(
            <Button
                key="assign"
                title={unassigned ? `Assign chefs (${unassigned} waiting)` : 'Reassign chefs'}
                icon="account-switch"
                onPress={() => navigation.navigate('AssignChefs', { orderId: id })}
            />,
        );
    }
    if (o.status === 'ready' && isFloor) {
        actions.push(
            o.orderType === 'dine_in' ? (
                <Button
                    key="serve"
                    title="Mark as served"
                    icon="silverware-fork-knife"
                    variant="success"
                    loading={serve.isPending}
                    onPress={() => serve.mutate()}
                />
            ) : (
                <Button
                    key="pickup"
                    title="Hand over (check code)"
                    icon="package-variant-closed-check"
                    variant="success"
                    disabled={unpaid}
                    onPress={() => setSheet('pickup')}
                />
            ),
        );
    }
    if (live && unpaid && isFloor && o.status !== 'pending') {
        actions.push(
            <Button
                key="cash"
                title={`Collect cash · ${money(o.total)}`}
                variant="dark"
                icon="cash"
                loading={cash.isPending}
                onPress={() => cash.mutate()}
            />,
        );
    }
    if (o.status === 'served' && !unpaid && isFloor) {
        actions.push(
            <Button
                key="complete"
                title="Complete order"
                icon="check-all"
                loading={complete.isPending}
                onPress={() => complete.mutate()}
            />,
        );
    }
    return (
        <Screen>
            <Header
                title={`#${o.orderNumber}`}
                subtitle={dateTime(o.placedAt)}
                right={<Pill label={tone.label} icon={tone.icon} fg={tone.fg} bg={tone.bg} />}
            />
            <Body
                refreshing={q.isRefetching}
                onRefresh={() => {
                    q.refetch();
                    bill.refetch();
                }}
            >
                {o.customer ? (
                    <Animated.View entering={FadeInDown.springify()}>
                        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Avatar name={o.customer.name} />
                            <View style={{ flex: 1 }}>
                                <Txt variant="h3">{o.customer.name}</Txt>
                                <Txt variant="small">
                                    {o.orderType === 'takeaway'
                                        ? `Takeaway${o.pickup ? ` · code ${o.pickup.pickupCode}` : ''}`
                                        : `Dine-in · Table ${o.tables.map((t) => t.table_number).join(', ') || '–'}`}
                                </Txt>
                            </View>
                            {o.customer.phone ? (
                                <IconButton
                                    icon="phone"
                                    color={colors.success}
                                    onPress={() => Linking.openURL(`tel:${o.customer.phone}`)}
                                />
                            ) : null}
                        </Card>
                    </Animated.View>
                ) : null}

                {o.rejectionReason || o.cancellationReason ? (
                    <Card flat style={{ backgroundColor: colors.dangerSoft, borderColor: '#F6CFC7', flexDirection: 'row', gap: 10 }}>
                        <Icon name="alert-circle-outline" size={20} color={colors.danger} />
                        <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
                            {o.rejectionReason ?? o.cancellationReason}
                        </Txt>
                    </Card>
                ) : null}
                {o.notes ? (
                    <Card flat style={{ backgroundColor: colors.goldSoft, borderColor: '#F3DDB0', flexDirection: 'row', gap: 10 }}>
                        <Icon name="message-text-outline" size={20} color={colors.gold} />
                        <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
                            {o.notes}
                        </Txt>
                    </Card>
                ) : null}

                <Card style={{ gap: 12 }}>
                    <Txt variant="h3">Items</Txt>
                    {o.items.map((item) => {
                        const k = kitchenStatus[item.kitchenStatus];
                        return (
                            <View key={item.id} style={{ gap: 4 }}>
                                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                    <Txt variant="h3" color={colors.primary} style={{ width: 30 }}>
                                        {item.quantity}×
                                    </Txt>
                                    <Txt variant="bodyMedium" style={{ flex: 1 }}>
                                        {item.name}
                                    </Txt>
                                    <Txt variant="bodyMedium">{money(item.subtotal)}</Txt>
                                </View>
                                {item.specialInstructions ? (
                                    <Txt variant="tiny" color={colors.gold} style={{ marginLeft: 40 }}>
                                        “{item.specialInstructions}”
                                    </Txt>
                                ) : null}
                                {o.status !== 'pending' ? (
                                    <View style={{ flexDirection: 'row', gap: 6, marginLeft: 40, flexWrap: 'wrap' }}>
                                        <Pill label={k.label} icon={k.icon} fg={k.fg} bg={k.bg} />
                                        {item.assignments.map((a) => (
                                            <Pill
                                                key={a.id}
                                                label={a.chefName}
                                                icon="chef-hat"
                                                fg={colors.textMuted}
                                                bg={colors.surfaceAlt}
                                            />
                                        ))}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                    <Divider dashed />
                    <KV label="Subtotal" value={money(o.subtotal)} />
                    <KV label="Tax" value={money(o.tax)} />
                    {o.tip ? <KV label="Tip" value={money(o.tip)} /> : null}
                    <KV label="Total" value={money(o.total)} bold big color={colors.primary} />
                </Card>

                {isFloor ? (
                    <Card style={{ gap: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Txt variant="h3">Payments</Txt>
                            <Pill label={pay.label} icon={pay.icon} fg={pay.fg} bg={pay.bg} />
                        </View>
                        {(bill.data?.payments ?? []).length === 0 ? <Txt variant="small">No payments yet.</Txt> : null}
                        {(bill.data?.payments ?? []).map((p) => {
                            const refunded = p.refunds.reduce((s, r) => s + r.amount, 0);
                            return (
                                <View key={p.id} style={{ gap: 6 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Icon
                                            name={
                                                p.method === 'card'
                                                    ? 'credit-card-outline'
                                                    : p.method === 'wallet'
                                                      ? 'wallet-outline'
                                                      : 'cash'
                                            }
                                            size={20}
                                            color={colors.textMuted}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Txt variant="bodyMedium">
                                                {money(p.amount)} · {p.method}
                                            </Txt>
                                            <Txt variant="tiny">
                                                {p.status} · {time(p.createdAt)}
                                                {refunded ? ` · refunded ${money(refunded)}` : ''}
                                            </Txt>
                                        </View>
                                        {p.method === 'cash' && p.status === 'initiated' ? (
                                            <Button
                                                title="Confirm cash"
                                                size="sm"
                                                variant="success"
                                                full={false}
                                                loading={confirmCash.isPending}
                                                onPress={() => confirmCash.mutate(p.id)}
                                            />
                                        ) : null}
                                        {p.status === 'succeeded' && isBoss && refunded < p.amount ? (
                                            <Button
                                                title="Refund"
                                                size="sm"
                                                variant="outline"
                                                full={false}
                                                onPress={() => {
                                                    setRefund({ amount: String(p.amount - refunded), reason: '', toWallet: true });
                                                    setRefundFor(p);
                                                }}
                                            />
                                        ) : null}
                                    </View>
                                </View>
                            );
                        })}
                    </Card>
                ) : null}

                <Card>
                    <OrderTimeline steps={o.timeline} />
                </Card>

                {isBoss && ['pending', 'accepted', 'preparing', 'ready'].includes(o.status) ? (
                    <Button title="Cancel order" variant="ghost" icon="cancel" onPress={() => setSheet('cancel')} />
                ) : null}
            </Body>
            {actions.length ? <BottomBar>{actions}</BottomBar> : null}

            <ReasonSheet
                visible={sheet === 'reject'}
                title="Reject order"
                presets={['Kitchen at full capacity', 'Item out of stock', 'Closing soon', 'Duplicate order']}
                confirmLabel="Reject"
                loading={reject.isPending}
                onClose={() => setSheet(null)}
                onConfirm={(r) => reject.mutate(r)}
            />
            <ReasonSheet
                visible={sheet === 'cancel'}
                title="Cancel order"
                message="Anything paid is refunded to the customer's wallet."
                presets={['Customer request', 'Ingredient ran out', 'Customer left', 'Kitchen issue']}
                confirmLabel="Cancel order"
                loading={cancel.isPending}
                onClose={() => setSheet(null)}
                onConfirm={(r) => cancel.mutate(r)}
            />
            <Sheet
                visible={sheet === 'pickup'}
                onClose={() => setSheet(null)}
                title="Hand over takeaway"
                footer={
                    <Button
                        title="Confirm hand-over"
                        icon="check"
                        disabled={pickupCode.trim().length < 4}
                        loading={pickup.isPending}
                        onPress={() => pickup.mutate()}
                    />
                }
            >
                <Txt variant="small">Ask the customer for the pickup code shown in their app.</Txt>
                <Input
                    icon="ticket-confirmation-outline"
                    placeholder="CT-123456"
                    autoCapitalize="characters"
                    value={pickupCode}
                    onChangeText={setPickupCode}
                />
            </Sheet>
            <Sheet
                visible={!!refundFor}
                onClose={() => setRefundFor(null)}
                title="Refund payment"
                footer={
                    <Button
                        title={`Refund ${money(Number(refund.amount) || 0)}`}
                        variant="danger"
                        icon="cash-refund"
                        disabled={!refund.reason.trim() || !(Number(refund.amount) > 0)}
                        loading={doRefund.isPending}
                        onPress={() => doRefund.mutate()}
                    />
                }
            >
                <Input
                    label="Amount (Rs)"
                    icon="cash"
                    keyboardType="decimal-pad"
                    value={refund.amount}
                    onChangeText={(amount) => setRefund((r) => ({ ...r, amount }))}
                    hint={refundFor ? `Up to ${money(refundFor.amount)}` : undefined}
                />
                <Input
                    label="Reason"
                    icon="message-text-outline"
                    placeholder="e.g. Dish arrived cold"
                    value={refund.reason}
                    onChangeText={(reason) => setRefund((r) => ({ ...r, reason }))}
                />
                {refundFor?.method !== 'wallet' ? (
                    <CheckRow
                        checked={refund.toWallet}
                        onChange={(toWallet) => setRefund((r) => ({ ...r, toWallet }))}
                        label="Send to the customer's wallet (instant)"
                    />
                ) : (
                    <Txt variant="small">Wallet payments are always refunded to the wallet.</Txt>
                )}
            </Sheet>
        </Screen>
    );
}
