import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ordersApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { dateTime, money } from '../../utils/format';
import { orderStatus, paymentStatus } from '../../utils/status';
import { Card, EmptyState, Icon, ListSkeleton, Pill, PulseDot, Screen, Segmented, Txt } from '../../components/ui';
export function OrdersScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const [scope, setScope] = useState(route.params?.scope ?? 'active');
    useEffect(() => {
        if (route.params?.scope) setScope(route.params.scope);
    }, [route.params?.scope]);
    const q = useQuery({
        queryKey: ['orders', 'mine', scope],
        queryFn: () => ordersApi.mine(scope),
        refetchInterval: scope === 'active' ? 15000 : false,
    });
    return (
        <Screen>
            <View style={{ padding: 20, paddingBottom: 8, gap: 14 }}>
                <Txt variant="h1">My orders</Txt>
                <Segmented
                    value={scope}
                    onChange={setScope}
                    items={[
                        { value: 'active', label: 'Active' },
                        { value: 'past', label: 'History' },
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
                            <EmptyState tone="error" title="Couldn't load orders" action="Retry" onAction={() => q.refetch()} />
                        ) : (
                            <EmptyState
                                icon="receipt-text-outline"
                                title={scope === 'active' ? 'No active orders' : 'No past orders yet'}
                                message="Hungry? The kitchen is ready when you are."
                                action="Order now"
                                onAction={() => nav.navigate('Tabs', { screen: 'Menu' })}
                            />
                        )
                    }
                    renderItem={({ item, index }) => {
                        const tone = orderStatus[item.status];
                        const pay = paymentStatus[item.paymentStatus];
                        const live = scope === 'active';
                        return (
                            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                                <Card onPress={() => nav.navigate('OrderTracking', { id: item.id })} style={{ gap: 10 }}>
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
                                            <Icon name={tone.icon} size={22} color={tone.fg} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                {live ? <PulseDot color={tone.fg} size={7} /> : null}
                                                <Txt variant="h3">#{item.orderNumber}</Txt>
                                            </View>
                                            <Txt variant="small">
                                                {dateTime(item.placedAt)} ·{' '}
                                                {item.orderType === 'takeaway'
                                                    ? 'Takeaway'
                                                    : `Dine-in${item.tables[0] ? ` · ${item.tables[0].table_number}` : ''}`}
                                            </Txt>
                                        </View>
                                        <Txt variant="price">{money(item.total)}</Txt>
                                    </View>
                                    <Txt variant="small" numberOfLines={1} color={colors.text}>
                                        {item.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                                    </Txt>
                                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                        <Pill label={tone.label} icon={tone.icon} fg={tone.fg} bg={tone.bg} />
                                        <Pill label={pay.label} icon={pay.icon} fg={pay.fg} bg={pay.bg} />
                                        {item.canReview && !item.restaurantReview ? (
                                            <Pill label="Rate it" icon="star-outline" fg={colors.gold} bg={colors.goldSoft} />
                                        ) : null}
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
