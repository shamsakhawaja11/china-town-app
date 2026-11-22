import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { inventoryApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors, radius } from '../../theme';
import { money, qty } from '../../utils/format';
import { stockStatus } from '../../utils/status';
import { toast } from '../../store/toast';
import {
    AnimatedNumber,
    Body,
    BottomBar,
    Button,
    Card,
    Checkbox,
    Chip,
    EmptyState,
    Header,
    ListSkeleton,
    Pill,
    PressableScale,
    Screen,
    Stepper,
    Txt,
} from '../../components/ui';
export function RestockPlanScreen({ navigation }) {
    const qc = useQueryClient();
    const [cover, setCover] = useState(7);
    const q = useQuery({ queryKey: ['inventory', 'plan', cover], queryFn: () => inventoryApi.restockPlan(cover) });
    const [sel, setSel] = useState({});
    useEffect(() => {
        if (q.data) setSel(Object.fromEntries(q.data.items.map((i) => [i.inventoryItemId, i.suggestedQuantity])));
    }, [q.data]);
    const items = q.data?.items ?? [];
    const total = useMemo(
        () => items.reduce((s, i) => s + (sel[i.inventoryItemId] ? sel[i.inventoryItemId] * i.unitCost : 0), 0),
        [items, sel],
    );
    const chosen = items.filter((i) => sel[i.inventoryItemId]);
    const order = useMutation({
        mutationFn: async () => {
            const bySupplier = new Map();
            for (const i of chosen) bySupplier.set(i.supplier ?? '', [...(bySupplier.get(i.supplier ?? '') ?? []), i]);
            const created = [];
            for (const [supplier, rows] of bySupplier) {
                created.push(
                    await inventoryApi.createPurchaseOrder({
                        supplierName: supplier || undefined,
                        notes: `Restock plan (${cover} days cover)`,
                        expectedAt: new Date(Date.now() + 86400000).toISOString(),
                        items: rows.map((r) => ({
                            inventoryItemId: r.inventoryItemId,
                            quantity: sel[r.inventoryItemId],
                            unitCost: r.unitCost,
                        })),
                    }),
                );
            }
            return created;
        },
        onSuccess: (pos) => {
            toast.success(`${pos.length} purchase order${pos.length > 1 ? 's' : ''} placed`, 'Receive them when the delivery arrives.');
            qc.invalidateQueries({ queryKey: ['inventory'] });
            navigation.replace('PurchaseOrders');
        },
        onError: (e) => toast.error("Couldn't place order", errorMessage(e)),
    });
    return (
        <Screen>
            <Header title="Restock plan" subtitle="Based on the last 14 days of use" />
            <Body refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Txt variant="smallMedium" style={{ flex: 1 }}>
                        Stock up for
                    </Txt>
                    {[3, 7, 14].map((d) => (
                        <Chip key={d} small label={`${d} days`} active={cover === d} onPress={() => setCover(d)} />
                    ))}
                </View>
                {q.data ? (
                    <Card style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dark, borderColor: colors.dark }}>
                        <View style={{ flex: 1 }}>
                            <Txt variant="small" color="#D9C2B9">
                                Estimated cost · {chosen.length} items
                            </Txt>
                            <AnimatedNumber value={total} format={money} variant="h1" color={colors.white} duration={500} />
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            {q.data.suppliers.slice(0, 3).map((s) => (
                                <Txt key={s.supplier} variant="tiny" color={colors.gold}>
                                    {s.supplier} · {s.itemCount}
                                </Txt>
                            ))}
                        </View>
                    </Card>
                ) : null}
                {q.isLoading ? (
                    <ListSkeleton rows={4} />
                ) : items.length === 0 ? (
                    <EmptyState icon="check-decagram" title="Nothing to restock" message={`Everything lasts more than ${cover} days.`} />
                ) : (
                    items.map((i, idx) => {
                        const tone = stockStatus[i.status];
                        const on = !!sel[i.inventoryItemId];
                        return (
                            <Animated.View key={i.inventoryItemId} entering={FadeInDown.delay(Math.min(idx, 10) * 50).springify()}>
                                <Card style={{ gap: 10, opacity: on ? 1 : 0.6 }}>
                                    <PressableScale
                                        scaleTo={0.98}
                                        onPress={() => setSel((s) => ({ ...s, [i.inventoryItemId]: on ? 0 : i.suggestedQuantity }))}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                    >
                                        <Checkbox checked={on} />
                                        <View style={{ flex: 1 }}>
                                            <Txt variant="bodyMedium">{i.name}</Txt>
                                            <Txt variant="tiny">
                                                {i.reason} · uses {qty(i.averageDailyUse, i.unit)}/day
                                            </Txt>
                                        </View>
                                        <Pill label={qty(i.currentQuantity, i.unit)} fg={tone.fg} bg={tone.bg} />
                                    </PressableScale>
                                    {on ? (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                backgroundColor: colors.bg,
                                                borderRadius: radius.md,
                                                padding: 10,
                                            }}
                                        >
                                            <View>
                                                <Txt variant="tiny">Order</Txt>
                                                <Txt variant="bodyMedium">{money(sel[i.inventoryItemId] * i.unitCost)}</Txt>
                                            </View>
                                            <Stepper
                                                size="sm"
                                                value={sel[i.inventoryItemId]}
                                                step={i.unit === 'pcs' ? 10 : 0.5}
                                                min={0}
                                                max={100000}
                                                format={(v) => qty(v, i.unit)}
                                                onChange={(v) => setSel((s) => ({ ...s, [i.inventoryItemId]: v }))}
                                            />
                                        </View>
                                    ) : null}
                                </Card>
                            </Animated.View>
                        );
                    })
                )}
            </Body>
            {chosen.length ? (
                <BottomBar>
                    <Button
                        title={`Place order · ${money(total)}`}
                        icon="truck-fast-outline"
                        loading={order.isPending}
                        onPress={() => order.mutate()}
                    />
                </BottomBar>
            ) : null}
        </Screen>
    );
}
