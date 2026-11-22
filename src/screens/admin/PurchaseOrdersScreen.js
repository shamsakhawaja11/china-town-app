import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { inventoryApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { dateTime, money } from '../../utils/format';
import { poStatus } from '../../utils/status';
import { Card, ChipRow, EmptyState, Header, Icon, ListSkeleton, Pill, ProgressBar, Screen, Txt } from '../../components/ui';
export function PurchaseOrdersScreen({ navigation }) {
    const [status, setStatus] = useState('all');
    const q = useQuery({
        queryKey: ['inventory', 'po', status],
        queryFn: () => inventoryApi.purchaseOrders(status === 'all' ? undefined : status),
    });
    return (
        <Screen>
            <Header title="Purchase orders" right={<Icon name="clipboard-list-outline" size={24} color={colors.primary} />} />
            <ChipRow
                small
                value={status}
                onChange={(v) => setStatus(v)}
                items={[
                    { value: 'all', label: 'All' },
                    { value: 'ordered', label: 'On the way' },
                    { value: 'partially_received', label: 'Partly received' },
                    { value: 'received', label: 'Received' },
                    { value: 'cancelled', label: 'Cancelled' },
                ]}
            />
            {q.isLoading ? (
                <ListSkeleton />
            ) : (
                <FlatList
                    data={q.data?.items ?? []}
                    keyExtractor={(p) => p.id}
                    contentContainerStyle={{ padding: 20, gap: 12 }}
                    refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="truck-outline"
                            title="No purchase orders"
                            action="Open restock plan"
                            onAction={() => navigation.navigate('RestockPlan')}
                        />
                    }
                    renderItem={({ item, index }) => {
                        const tone = poStatus[item.status];
                        return (
                            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                                <Card onPress={() => navigation.navigate('PurchaseOrder', { id: item.id })} style={{ gap: 10 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 14,
                                                backgroundColor: tone.bg,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Icon name={tone.icon} size={22} color={tone.fg} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Txt variant="h3">{item.poNumber}</Txt>
                                            <Txt variant="small" numberOfLines={1}>
                                                {item.supplierName ?? 'No supplier'} · {item.items.length} items
                                            </Txt>
                                        </View>
                                        <Txt variant="bodyMedium">{money(item.totalCost)}</Txt>
                                    </View>
                                    <ProgressBar
                                        value={item.progress.lines ? item.progress.fullyReceived / item.progress.lines : 0}
                                        color={tone.fg}
                                        height={6}
                                    />
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Pill label={tone.label} fg={tone.fg} bg={tone.bg} />
                                        <Txt variant="tiny">{dateTime(item.orderedAt)}</Txt>
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
