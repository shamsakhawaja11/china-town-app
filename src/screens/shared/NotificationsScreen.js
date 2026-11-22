import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { notificationsApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { ago } from '../../utils/format';
import { Card, EmptyState, Header, Icon, ListSkeleton, PressableScale, Screen, Txt } from '../../components/ui';
const ICON = {
    order_placed: { icon: 'receipt', color: colors.info },
    order_accepted: { icon: 'check-circle-outline', color: colors.success },
    order_preparing: { icon: 'chef-hat', color: colors.gold },
    order_ready: { icon: 'bell-ring-outline', color: colors.success },
    order_served: { icon: 'silverware-fork-knife', color: colors.success },
    order_rejected: { icon: 'close-circle-outline', color: colors.danger },
    order_cancelled: { icon: 'cancel', color: colors.danger },
    payment_succeeded: { icon: 'check-decagram', color: colors.success },
    refund_processed: { icon: 'cash-refund', color: colors.info },
    cash_requested: { icon: 'cash-clock', color: colors.gold },
    low_stock: { icon: 'package-variant-remove', color: colors.warning },
    new_review: { icon: 'star', color: colors.gold },
    kitchen_assignment: { icon: 'clipboard-text-outline', color: colors.primary },
    reservation_created: { icon: 'calendar-plus', color: colors.info },
};
const iconFor = (t) =>
    ICON[t] ??
    (t.startsWith('reservation') ? { icon: 'calendar-check', color: colors.info } : { icon: 'bell-outline', color: colors.primary });
export function NotificationsScreen() {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['notifications', 'list'], queryFn: () => notificationsApi.list() });
    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    const readOne = useMutation({ mutationFn: (id) => notificationsApi.read(id), onSuccess: refresh });
    const readAll = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: refresh });
    const unread = q.data?.items.filter((n) => !n.isRead).length ?? 0;
    return (
        <Screen>
            <Header
                title="Notifications"
                subtitle={unread ? `${unread} unread` : 'All caught up'}
                right={
                    unread ? (
                        <PressableScale onPress={() => readAll.mutate()}>
                            <Txt variant="smallMedium" color={colors.primary}>
                                Read all
                            </Txt>
                        </PressableScale>
                    ) : null
                }
            />
            {q.isLoading ? (
                <ListSkeleton rows={6} height={70} />
            ) : (
                <FlatList
                    data={q.data?.items ?? []}
                    keyExtractor={(n) => n.id}
                    contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="bell-sleep-outline"
                            title="No notifications"
                            message="Order and booking updates will appear here."
                        />
                    }
                    renderItem={({ item, index }) => {
                        const ic = iconFor(item.type);
                        return (
                            <Animated.View entering={FadeInDown.delay(Math.min(index, 12) * 40).springify()} layout={LinearTransition}>
                                <Card
                                    onPress={() => !item.isRead && readOne.mutate(item.id)}
                                    flat={item.isRead}
                                    style={{
                                        flexDirection: 'row',
                                        gap: 12,
                                        padding: 14,
                                        backgroundColor: item.isRead ? colors.surface : colors.primarySoft,
                                        borderColor: item.isRead ? colors.border : '#F6CFC7',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 14,
                                            backgroundColor: ic.color + '1A',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon name={ic.icon} size={21} color={ic.color} />
                                    </View>
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Txt variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                                                {item.title}
                                            </Txt>
                                            {!item.isRead ? (
                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                                            ) : null}
                                        </View>
                                        <Txt variant="small" color={colors.text}>
                                            {item.message}
                                        </Txt>
                                        <Txt variant="tiny">{ago(item.createdAt)}</Txt>
                                    </View>
                                </Card>
                            </Animated.View>
                        );
                    }}
                />
            )}
        </Screen>
    );
}
