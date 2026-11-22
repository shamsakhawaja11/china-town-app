import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { inventoryApi } from '../../api/endpoints';
import { colors, radius } from '../../theme';
import { compact, qty, titleCase } from '../../utils/format';
import { ingredientIcon } from '../../utils/dishVisual';
import { stockStatus } from '../../utils/status';
import { appRoleOf, useAuth } from '../../store/auth';
import { Card, ChipRow, EmptyState, Fab, Icon, IconButton, Input, ListSkeleton, Pill, ProgressBar, Screen, Txt } from '../../components/ui';
const CATS = ['meat', 'seafood', 'vegetables', 'dry_goods', 'sauces', 'dairy', 'beverages', 'other'];
export function InventoryScreen() {
    const nav = useNavigation();
    const role = appRoleOf(useAuth((s) => s.user));
    const canManage = role === 'admin' || role === 'manager';
    const [category, setCategory] = useState('all');
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const q = useQuery({
        queryKey: ['inventory', category, status, search],
        queryFn: () =>
            inventoryApi.list({
                category: category === 'all' ? undefined : category,
                status: status === 'all' ? undefined : status,
                search: search.trim() || undefined,
            }),
    });
    const s = q.data?.summary;
    return (
        <Screen>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <Txt variant="small">{s ? `${s.totalItems} ingredients · Rs ${compact(s.stockValue)} in stock` : ' '}</Txt>
                    <Txt variant="h1">Inventory</Txt>
                </View>
                {canManage ? (
                    <>
                        <IconButton icon="truck-outline" onPress={() => nav.navigate('PurchaseOrders')} />
                        <IconButton icon="clipboard-list-outline" color={colors.primary} onPress={() => nav.navigate('RestockPlan')} />
                    </>
                ) : null}
            </View>
            <FlatList
                data={q.data?.items ?? []}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ paddingBottom: 110, gap: 10 }}
                refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                ListHeaderComponent={
                    <View style={{ gap: 14, paddingTop: 14, paddingBottom: 4 }}>
                        {s && (s.lowStock || s.outOfStock) ? (
                            <Animated.View entering={FadeInDown.springify()} style={{ paddingHorizontal: 20 }}>
                                <Card
                                    onPress={canManage ? () => nav.navigate('RestockPlan') : undefined}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                        backgroundColor: colors.dangerSoft,
                                        borderColor: '#F6CFC7',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 14,
                                            backgroundColor: colors.white,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon name="alert" size={22} color={colors.danger} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Txt variant="bodyMedium">
                                            {s.outOfStock} out of stock · {s.lowStock} running low
                                        </Txt>
                                        <Txt variant="small">
                                            {canManage ? 'Open the restock plan to reorder' : 'Tell the manager to reorder'}
                                        </Txt>
                                    </View>
                                    {canManage ? <Icon name="chevron-right" size={22} color={colors.danger} /> : null}
                                </Card>
                            </Animated.View>
                        ) : null}
                        <View style={{ paddingHorizontal: 20 }}>
                            <Input icon="magnify" placeholder="Search ingredients" value={search} onChangeText={setSearch} />
                        </View>
                        <ChipRow
                            small
                            value={status}
                            onChange={setStatus}
                            items={[
                                { value: 'all', label: 'All' },
                                { value: 'out_of_stock', label: 'Out', count: s?.outOfStock },
                                { value: 'low', label: 'Low', count: s?.lowStock },
                                { value: 'ok', label: 'In stock' },
                            ]}
                        />
                        <ChipRow
                            small
                            value={category}
                            onChange={setCategory}
                            items={[
                                { value: 'all', label: 'All categories' },
                                ...CATS.map((c) => ({ value: c, label: titleCase(c), icon: ingredientIcon(c) })),
                            ]}
                        />
                    </View>
                }
                ListEmptyComponent={
                    q.isLoading ? (
                        <ListSkeleton rows={5} height={80} />
                    ) : (
                        <EmptyState icon="package-variant" title="No items" message="Try another filter." />
                    )
                }
                renderItem={({ item, index }) => {
                    const tone = stockStatus[item.status];
                    return (
                        <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40).springify()} style={{ paddingHorizontal: 20 }}>
                            <Card onPress={() => nav.navigate('InventoryItem', { id: item.id })} style={{ gap: 10, padding: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: radius.md,
                                            backgroundColor: tone.bg,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon name={ingredientIcon(item.category)} size={22} color={tone.fg} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Txt variant="bodyMedium">{item.name}</Txt>
                                        <Txt variant="tiny">
                                            {titleCase(item.category)}
                                            {item.defaultSupplier ? ` · ${item.defaultSupplier}` : ''}
                                        </Txt>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                                        <Txt variant="h3" color={tone.fg}>
                                            {qty(item.currentQuantity, item.unit)}
                                        </Txt>
                                        <Pill label={tone.label} fg={tone.fg} bg={tone.bg} />
                                    </View>
                                </View>
                                <View style={{ gap: 4 }}>
                                    <ProgressBar value={(item.fillPercent ?? 0) / 100} color={tone.fg} height={6} delay={index * 30} />
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Txt variant="tiny">Reorder at {qty(item.reorderLevel, item.unit)}</Txt>
                                        <Txt variant="tiny">Target {qty(item.parLevel, item.unit)}</Txt>
                                    </View>
                                </View>
                            </Card>
                        </Animated.View>
                    );
                }}
            />
            {canManage ? <Fab icon="plus" label="Add item" onPress={() => nav.navigate('AddInventoryItem')} /> : null}
        </Screen>
    );
}
