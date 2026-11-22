import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { adminApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { ago, money, minutesSince } from '../../utils/format';
import { orderStatus, paymentStatus } from '../../utils/status';
import { appRoleOf, useAuth } from '../../store/auth';
import { toast } from '../../store/toast';
import { Button, Card, ChipRow, EmptyState, Icon, IconButton, Input, ListSkeleton, Pill, Screen, Txt } from '../../components/ui';
import { ReasonSheet } from '../../components/ReasonSheet';
const GROUPS = {
    new: ['pending'],
    kitchen: ['accepted', 'preparing'],
    ready: ['ready'],
    served: ['served'],
    done: ['completed', 'cancelled', 'rejected'],
    all: undefined,
};
export function OrderRow({ o, onPress, actions }) {
    const tone = orderStatus[o.status];
    const pay = paymentStatus[o.paymentStatus];
    const waiting = minutesSince(o.placedAt);
    const late = ['pending', 'accepted', 'preparing'].includes(o.status) && waiting > 25;
    return (
        <Card onPress={onPress} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                    style={{
                        width: 46,
                        height: 46,
                        borderRadius: 15,
                        backgroundColor: tone.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon name={o.orderType === 'takeaway' ? 'shopping-outline' : 'silverware-fork-knife'} size={22} color={tone.fg} />
                </View>
                <View style={{ flex: 1 }}>
                    <Txt variant="h3">#{o.orderNumber}</Txt>
                    <Txt variant="small" numberOfLines={1}>
                        {o.customer?.name} ·{' '}
                        {o.orderType === 'takeaway' ? 'Takeaway' : `Table ${o.tables.map((t) => t.table_number).join(', ') || '–'}`}
                    </Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Txt variant="price">{money(o.total)}</Txt>
                    <Txt variant="tiny" color={late ? colors.danger : colors.textMuted}>
                        {ago(o.placedAt)}
                    </Txt>
                </View>
            </View>
            <Txt variant="small" color={colors.text} numberOfLines={2}>
                {o.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <Pill label={tone.label} icon={tone.icon} fg={tone.fg} bg={tone.bg} />
                <Pill label={pay.label} fg={pay.fg} bg={pay.bg} />
                {o.notes ? <Pill label="Note" icon="message-text-outline" fg={colors.gold} bg={colors.goldSoft} /> : null}
                {late ? <Pill label={`${waiting} min`} icon="alarm" fg={colors.danger} bg={colors.dangerSoft} /> : null}
            </View>
            {actions}
        </Card>
    );
}
export function AdminOrdersScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const role = appRoleOf(useAuth((s) => s.user));
    const canDecide = role === 'admin' || role === 'manager';
    const qc = useQueryClient();
    const [group, setGroup] = useState(role === 'waiter' ? 'ready' : 'new');
    const [search, setSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [rejecting, setRejecting] = useState(null);
    useEffect(() => {
        if (route.params?.status === 'pending') setGroup('new');
    }, [route.params?.status]);
    const q = useQuery({
        queryKey: ['admin', 'orders', group, search],
        queryFn: () => adminApi.orders({ status: GROUPS[group], search: search.trim() || undefined, limit: 50 }),
        refetchInterval: 15000,
    });
    const counts = q.data?.countsByStatus ?? {};
    const c = (s) => s.reduce((n, x) => n + (counts[x] ?? 0), 0);
    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['admin'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
    };
    const accept = useMutation({
        mutationFn: (id) => adminApi.accept(id),
        onSuccess: (o) => {
            toast.success(`#${o.orderNumber} accepted`, 'Assign chefs to start cooking.');
            invalidate();
            nav.navigate('AssignChefs', { orderId: o.id });
        },
        onError: (e) => toast.error("Couldn't accept", errorMessage(e)),
    });
    const reject = useMutation({
        mutationFn: (v) => adminApi.reject(v.id, v.reason),
        onSuccess: (o) => {
            setRejecting(null);
            toast.success(
                `#${o.orderNumber} rejected`,
                o.paymentStatus !== 'unpaid' ? 'Payment refunded to the customer wallet.' : undefined,
            );
            invalidate();
        },
        onError: (e) => toast.error("Couldn't reject", errorMessage(e)),
    });
    return (
        <Screen>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <Txt variant="small">{q.data ? `${q.data.total} orders` : ' '}</Txt>
                    <Txt variant="h1">Orders</Txt>
                </View>
                <IconButton
                    icon={searchOpen ? 'close' : 'magnify'}
                    onPress={() => (searchOpen ? (setSearch(''), setSearchOpen(false)) : setSearchOpen(true))}
                />
            </View>
            {searchOpen ? (
                <Animated.View entering={FadeInDown} exiting={FadeOut} style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                    <Input
                        autoFocus
                        icon="magnify"
                        placeholder="Order no., customer name or phone"
                        value={search}
                        onChangeText={setSearch}
                    />
                </Animated.View>
            ) : null}
            <View style={{ marginTop: 12 }}>
                <ChipRow
                    value={group}
                    onChange={setGroup}
                    items={[
                        { value: 'new', label: 'New', count: c(['pending']), icon: 'bell-ring-outline' },
                        { value: 'kitchen', label: 'Kitchen', count: c(['accepted', 'preparing']) },
                        { value: 'ready', label: 'Ready', count: c(['ready']) },
                        { value: 'served', label: 'Served', count: c(['served']) },
                        { value: 'done', label: 'Closed' },
                        { value: 'all', label: 'All' },
                    ]}
                />
            </View>
            {q.isLoading ? (
                <ListSkeleton rows={4} />
            ) : (
                <FlatList
                    data={q.data?.items ?? []}
                    keyExtractor={(o) => o.id}
                    contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        q.isError ? (
                            <EmptyState
                                tone="error"
                                title="Couldn't load orders"
                                message={errorMessage(q.error)}
                                action="Retry"
                                onAction={() => q.refetch()}
                            />
                        ) : (
                            <EmptyState
                                icon="clipboard-check-outline"
                                title="Nothing here"
                                message={group === 'new' ? 'No orders are waiting. Nice!' : 'No orders in this list right now.'}
                            />
                        )
                    }
                    renderItem={({ item, index }) => (
                        <Animated.View
                            entering={FadeInDown.delay(Math.min(index, 8) * 50).springify()}
                            exiting={FadeOut}
                            layout={LinearTransition.springify()}
                        >
                            <OrderRow
                                o={item}
                                onPress={() => nav.navigate('AdminOrder', { id: item.id })}
                                actions={
                                    canDecide && item.status === 'pending' ? (
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <Button
                                                title="Reject"
                                                variant="outline"
                                                size="md"
                                                icon="close"
                                                style={{ flex: 1 }}
                                                onPress={() => setRejecting(item)}
                                            />
                                            <Button
                                                title="Accept"
                                                variant="success"
                                                size="md"
                                                icon="check"
                                                style={{ flex: 1.4 }}
                                                loading={accept.isPending && accept.variables === item.id}
                                                onPress={() => accept.mutate(item.id)}
                                            />
                                        </View>
                                    ) : null
                                }
                            />
                        </Animated.View>
                    )}
                />
            )}
            <ReasonSheet
                visible={!!rejecting}
                title={`Reject #${rejecting?.orderNumber ?? ''}`}
                message="The customer is notified and any payment goes back to their wallet."
                presets={['Kitchen at full capacity', 'Item out of stock', 'Closing soon', 'Duplicate order']}
                confirmLabel="Reject order"
                loading={reject.isPending}
                onClose={() => setRejecting(null)}
                onConfirm={(reason) => rejecting && reject.mutate({ id: rejecting.id, reason })}
            />
        </Screen>
    );
}
