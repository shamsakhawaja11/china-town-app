import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { inventoryApi } from '../../api/endpoints';
import { colors, radius } from '../../theme';
import { dateTime, money, qty, shortDate, titleCase, weekday } from '../../utils/format';
import { ingredientIcon } from '../../utils/dishVisual';
import { stockStatus } from '../../utils/status';
import { appRoleOf, useAuth } from '../../store/auth';
import {
    Body,
    BottomBar,
    Button,
    Card,
    Chip,
    EmptyState,
    Header,
    Icon,
    ListSkeleton,
    Pill,
    ProgressBar,
    SectionTitle,
    Txt,
} from '../../components/ui';
import { BarChart } from '../../components/BarChart';
import { Screen } from '../../components/ui';
const TXN = {
    purchase: { icon: 'truck-delivery-outline', color: colors.success, label: 'Purchase' },
    usage: { icon: 'chef-hat', color: colors.info, label: 'Used' },
    waste: { icon: 'delete-outline', color: colors.danger, label: 'Waste' },
    adjustment: { icon: 'clipboard-check-outline', color: colors.gold, label: 'Stock count' },
};
export function InventoryItemScreen({ route, navigation }) {
    const { id } = route.params;
    const role = appRoleOf(useAuth((s) => s.user));
    const [days, setDays] = useState(14);
    const item = useQuery({ queryKey: ['inventory', 'item', id], queryFn: () => inventoryApi.get(id) });
    const usage = useQuery({ queryKey: ['inventory', 'usage', id, days], queryFn: () => inventoryApi.usage(id, days) });
    const it = item.data;
    const u = usage.data;
    if (item.isLoading) {
        return (
            <Screen>
                <Header title="Item" />
                <ListSkeleton rows={3} />
            </Screen>
        );
    }
    if (!it) {
        return (
            <Screen>
                <Header title="Item" />
                <EmptyState tone="error" title="Item not found" />
            </Screen>
        );
    }
    const tone = stockStatus[it.status];
    const chart = u
        ? [
              ...u.history.slice(-7).map((h) => ({ label: weekday(h.date).slice(0, 2), value: h.used })),
              ...u.forecast.slice(0, 3).map((f) => ({ label: weekday(f.date).slice(0, 2) + '*', value: f.expectedUse, ghost: true })),
          ]
        : [];
    return (
        <Screen>
            <Header title={it.name} subtitle={titleCase(it.category)} />
            <Body
                refreshing={item.isRefetching}
                onRefresh={() => {
                    item.refetch();
                    usage.refetch();
                }}
            >
                <Animated.View entering={FadeInDown.springify()}>
                    <Card style={{ gap: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: radius.lg,
                                    backgroundColor: tone.bg,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon name={ingredientIcon(it.category)} size={26} color={tone.fg} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Txt variant="small">In stock</Txt>
                                <Txt variant="h1" color={tone.fg}>
                                    {qty(it.currentQuantity, it.unit)}
                                </Txt>
                            </View>
                            <Pill label={tone.label} icon={tone.icon} fg={tone.fg} bg={tone.bg} />
                        </View>
                        <ProgressBar value={(it.fillPercent ?? 0) / 100} color={tone.fg} />
                        <View style={{ flexDirection: 'row' }}>
                            {[
                                { l: 'Reorder at', v: qty(it.reorderLevel, it.unit) },
                                { l: 'Target', v: qty(it.parLevel, it.unit) },
                                { l: 'Unit cost', v: money(it.unitCost) },
                                { l: 'Value', v: money(it.stockValue) },
                            ].map((x) => (
                                <View key={x.l} style={{ flex: 1 }}>
                                    <Txt variant="tiny">{x.l}</Txt>
                                    <Txt variant="smallMedium" color={colors.text}>
                                        {x.v}
                                    </Txt>
                                </View>
                            ))}
                        </View>
                    </Card>
                </Animated.View>

                <Card style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Txt variant="h3">Usage & forecast</Txt>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {[7, 14, 30].map((d) => (
                                <Chip key={d} small label={`${d}d`} active={days === d} onPress={() => setDays(d)} />
                            ))}
                        </View>
                    </View>
                    {u ? (
                        <>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                                <Txt variant="display" style={{ fontSize: 32 }}>
                                    {qty(u.stats.averageDailyUse)}
                                </Txt>
                                <Txt variant="small" style={{ marginBottom: 8 }}>
                                    {it.unit} / day expected
                                </Txt>
                            </View>
                            <BarChart data={chart} height={120} format={(v) => qty(v, it.unit)} />
                            <Txt variant="tiny">Last 7 days · * forecast for the next 3 days</Txt>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {[
                                    {
                                        icon: 'calendar-clock',
                                        c: (u.stats.daysOfStockLeft ?? 99) < 3 ? colors.danger : colors.success,
                                        l: 'Stock lasts',
                                        v: u.stats.daysOfStockLeft === null ? 'No use yet' : `${u.stats.daysOfStockLeft} days`,
                                    },
                                    {
                                        icon: 'calendar-alert',
                                        c: colors.warning,
                                        l: 'Runs out',
                                        v: u.stats.expectedStockoutDate ? shortDate(u.stats.expectedStockoutDate) : '–',
                                    },
                                    {
                                        icon: 'chart-bell-curve-cumulative',
                                        c: colors.info,
                                        l: `Used (${days}d)`,
                                        v: qty(u.stats.totalUsed, it.unit),
                                    },
                                ].map((x) => (
                                    <View
                                        key={x.l}
                                        style={{ flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, padding: 10, gap: 2 }}
                                    >
                                        <Icon name={x.icon} size={18} color={x.c} />
                                        <Txt variant="tiny">{x.l}</Txt>
                                        <Txt variant="smallMedium" color={colors.text}>
                                            {x.v}
                                        </Txt>
                                    </View>
                                ))}
                            </View>
                        </>
                    ) : (
                        <ListSkeleton rows={1} height={120} />
                    )}
                </Card>

                <View>
                    <SectionTitle title="Recent movements" />
                    <View style={{ gap: 8 }}>
                        {it.recentTransactions.map((t, i) => {
                            const m = TXN[t.type];
                            const plus = t.quantity > 0;
                            return (
                                <Animated.View key={t.id} entering={FadeInDown.delay(Math.min(i, 10) * 40)}>
                                    <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
                                        <View
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 12,
                                                backgroundColor: m.color + '1A',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Icon name={m.icon} size={18} color={m.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Txt variant="bodyMedium" numberOfLines={1}>
                                                {t.reason ?? m.label}
                                            </Txt>
                                            <Txt variant="tiny">
                                                {dateTime(t.createdAt)}
                                                {t.performedBy ? ` · ${t.performedBy}` : ''}
                                            </Txt>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Txt variant="bodyMedium" color={plus ? colors.success : colors.text}>
                                                {plus ? '+' : ''}
                                                {qty(t.quantity)}
                                            </Txt>
                                            <Txt variant="tiny">→ {qty(t.quantityAfter)}</Txt>
                                        </View>
                                    </Card>
                                </Animated.View>
                            );
                        })}
                    </View>
                </View>
            </Body>
            <BottomBar>
                <Button
                    title="Update stock"
                    icon="swap-vertical"
                    onPress={() => navigation.navigate('UpdateStock', { id, name: it.name, unit: it.unit, current: it.currentQuantity })}
                />
                {role === 'chef' ? (
                    <Txt variant="tiny" center>
                        Chefs can log usage and waste.
                    </Txt>
                ) : null}
            </BottomBar>
        </Screen>
    );
}
