import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { adminApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors, radius } from '../../theme';
import { kitchenStatus } from '../../utils/status';
import { appRoleOf, useAuth } from '../../store/auth';
import { toast } from '../../store/toast';
import { Button, Card, EmptyState, Icon, ListSkeleton, Pill, PressableScale, PulseDot, Screen, Segmented, Txt } from '../../components/ui';
export function KitchenBoardScreen() {
    const nav = useNavigation();
    const qc = useQueryClient();
    const role = appRoleOf(useAuth((s) => s.user));
    const [col, setCol] = useState(role === 'waiter' ? 'ready' : 'new');
    const q = useQuery({ queryKey: ['kitchen', 'board'], queryFn: adminApi.board, refetchInterval: 10000 });
    const act = useMutation({
        mutationFn: (v) => (v.kind === 'start' ? adminApi.startTask(v.id) : adminApi.doneTask(v.id)),
        onSuccess: (_, v) => {
            toast.success(v.kind === 'start' ? 'Cooking started' : 'Dish done');
            qc.invalidateQueries({ queryKey: ['kitchen'] });
            qc.invalidateQueries({ queryKey: ['admin'] });
        },
        onError: (e) => toast.error('Update failed', errorMessage(e)),
    });
    const list = q.data?.[col] ?? [];
    const canCook = role === 'manager' || role === 'admin';
    const ticket = (o) => {
        const wait = o.waitingMinutes ?? 0;
        const urgent = wait > 25 && col !== 'ready';
        return (
            <Card
                style={{
                    gap: 10,
                    borderLeftWidth: 5,
                    borderLeftColor: urgent
                        ? colors.danger
                        : col === 'ready'
                          ? colors.success
                          : col === 'cooking'
                            ? colors.gold
                            : colors.info,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                        <Txt variant="h3">#{o.orderNumber}</Txt>
                        <Txt variant="small">
                            {o.orderType === 'takeaway' ? 'Takeaway' : `Table ${o.tables.map((t) => t.table_number).join(', ') || '–'}`}
                        </Txt>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {urgent ? (
                                <PulseDot color={colors.danger} size={7} />
                            ) : (
                                <Icon name="timer-outline" size={14} color={colors.textMuted} />
                            )}
                            <Txt variant="smallMedium" color={urgent ? colors.danger : colors.textMuted}>
                                {wait} min
                            </Txt>
                        </View>
                        {o.unassignedItems ? (
                            <Pill label={`${o.unassignedItems} unassigned`} fg={colors.warning} bg={colors.warningSoft} />
                        ) : null}
                    </View>
                </View>
                {o.items.map((it) => {
                    const k = kitchenStatus[it.kitchenStatus];
                    const mine = it.assignments.find((a) => a.status !== 'done');
                    return (
                        <View
                            key={it.id}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                                backgroundColor: colors.bg,
                                borderRadius: radius.md,
                                padding: 10,
                            }}
                        >
                            <Txt variant="h3" color={colors.primary} style={{ width: 28 }}>
                                {it.quantity}×
                            </Txt>
                            <View style={{ flex: 1 }}>
                                <Txt variant="bodyMedium">{it.name}</Txt>
                                {it.specialInstructions ? (
                                    <Txt variant="tiny" color={colors.gold}>
                                        “{it.specialInstructions}”
                                    </Txt>
                                ) : null}
                                <Txt variant="tiny">{it.assignments.map((a) => a.chefName).join(', ') || 'No chef yet'}</Txt>
                            </View>
                            {canCook && mine ? (
                                <Button
                                    title={mine.status === 'assigned' ? 'Start' : 'Done'}
                                    size="sm"
                                    full={false}
                                    variant={mine.status === 'assigned' ? 'primary' : 'success'}
                                    loading={act.isPending && act.variables?.id === mine.id}
                                    onPress={() => act.mutate({ id: mine.id, kind: mine.status === 'assigned' ? 'start' : 'done' })}
                                />
                            ) : (
                                <Pill label={k.label} icon={k.icon} fg={k.fg} bg={k.bg} />
                            )}
                        </View>
                    );
                })}
                {o.notes ? (
                    <Txt variant="tiny" color={colors.gold}>
                        Note: {o.notes}
                    </Txt>
                ) : null}
                {canCook && o.unassignedItems ? (
                    <Button
                        title="Assign chefs"
                        size="md"
                        variant="secondary"
                        icon="account-switch"
                        onPress={() => nav.navigate('AssignChefs', { orderId: o.id })}
                    />
                ) : null}
            </Card>
        );
    };
    return (
        <Screen>
            <View style={{ padding: 20, paddingBottom: 8, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Txt variant="h1" style={{ flex: 1 }}>
                        Kitchen
                    </Txt>
                    <PulseDot color={colors.success} />
                    <Txt variant="small">Live</Txt>
                </View>
                <Segmented
                    value={col}
                    onChange={setCol}
                    items={[
                        { value: 'new', label: 'New', count: q.data?.counts.new },
                        { value: 'cooking', label: 'Cooking', count: q.data?.counts.cooking },
                        { value: 'ready', label: 'Ready', count: q.data?.counts.ready },
                    ]}
                />
            </View>
            {q.isLoading ? (
                <ListSkeleton rows={3} height={140} />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(o) => o.id}
                    contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="pot-steam-outline"
                            title={col === 'ready' ? 'Nothing waiting to go out' : 'All clear'}
                            message="New tickets appear here automatically."
                        />
                    }
                    renderItem={({ item, index }) => (
                        <Animated.View
                            entering={FadeInDown.delay(index * 60).springify()}
                            exiting={FadeOut}
                            layout={LinearTransition.springify()}
                        >
                            <PressableScale scaleTo={0.99} onPress={() => nav.navigate('AdminOrder', { id: item.id })}>
                                {ticket(item)}
                            </PressableScale>
                        </Animated.View>
                    )}
                />
            )}
        </Screen>
    );
}
