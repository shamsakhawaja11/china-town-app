import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { adminApi, notificationsApi } from '../../api/endpoints';
import { colors, radius, shadow } from '../../theme';
import { compact, greeting, money, time, weekday } from '../../utils/format';
import { orderStatus } from '../../utils/status';
import { useAuth } from '../../store/auth';
import {
    AnimatedNumber,
    Body,
    Card,
    DishImage,
    EmptyState,
    Icon,
    IconButton,
    Pill,
    PressableScale,
    PulseDot,
    Screen,
    SectionTitle,
    Skeleton,
    Stars,
    Txt,
} from '../../components/ui';
import { BarChart } from '../../components/BarChart';
function Kpi({ icon, label, value, color, onPress, index, format }) {
    return (
        <Animated.View entering={FadeInDown.delay(150 + index * 60).springify()} style={{ width: '48%' }}>
            <PressableScale onPress={onPress} scaleTo={0.97} style={[styles.kpi, shadow(1)]}>
                <View style={[styles.kpiIcon, { backgroundColor: color + '1A' }]}>
                    <Icon name={icon} size={20} color={color} />
                </View>
                <AnimatedNumber value={value} variant="h2" format={format} />
                <Txt variant="small">{label}</Txt>
            </PressableScale>
        </Animated.View>
    );
}
export function DashboardScreen() {
    const nav = useNavigation();
    const user = useAuth((s) => s.user);
    const q = useQuery({ queryKey: ['dashboard'], queryFn: adminApi.dashboard, refetchInterval: 30000 });
    const unread = useQuery({ queryKey: ['notifications', 'unread'], queryFn: notificationsApi.unread, refetchInterval: 30000 });
    const d = q.data;
    const change = d?.revenue.changePercent;
    const up = (change ?? 0) >= 0;
    return (
        <Screen>
            <View style={styles.top}>
                <View style={{ flex: 1 }}>
                    <Txt variant="small">{greeting()},</Txt>
                    <Txt variant="h1">{user?.name.split(' ')[0]} 👋</Txt>
                </View>
                <IconButton icon="bell-outline" badge={unread.data?.unread} onPress={() => nav.navigate('Notifications')} />
            </View>
            <Body refreshing={q.isRefetching} onRefresh={() => q.refetch()} contentStyle={{ paddingTop: 4 }}>
                {q.isLoading ? (
                    <View style={{ gap: 12 }}>
                        <Skeleton height={230} r={24} />
                        <Skeleton height={110} r={20} />
                        <Skeleton height={110} r={20} />
                    </View>
                ) : !d ? (
                    <EmptyState tone="error" title="Dashboard didn't load" action="Retry" onAction={() => q.refetch()} />
                ) : (
                    <>
                        <Animated.View entering={FadeInDown.springify()}>
                            <LinearGradient
                                colors={[colors.dark, '#4A140D', colors.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.revenue}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View>
                                        <Txt variant="smallMedium" color="#E6C7BC">
                                            Today's revenue
                                        </Txt>
                                        <AnimatedNumber value={d.revenue.today} format={money} variant="h1" color={colors.white} />
                                    </View>
                                    {change !== null && change !== undefined ? (
                                        <Pill
                                            label={`${up ? '+' : ''}${change.toFixed(1)}%`}
                                            icon={up ? 'trending-up' : 'trending-down'}
                                            fg={up ? '#4ADE80' : '#FCA5A5'}
                                            bg="rgba(255,255,255,0.1)"
                                        />
                                    ) : null}
                                </View>
                                <Txt variant="tiny" color="#C9A99A">
                                    Yesterday {money(d.revenue.yesterday)}
                                </Txt>
                                <View style={{ marginTop: 14 }}>
                                    <BarChartLight
                                        data={d.revenue.last7Days.map((x, i, a) => ({
                                            label: i === a.length - 1 ? 'Today' : weekday(x.date),
                                            value: x.revenue,
                                            highlight: i === a.length - 1,
                                        }))}
                                    />
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        <View style={styles.grid}>
                            <Kpi
                                index={0}
                                icon="receipt"
                                label="Orders today"
                                value={d.orders.today}
                                color={colors.info}
                                onPress={() => nav.navigate('Tabs', { screen: 'Orders' })}
                            />
                            <Kpi
                                index={1}
                                icon="cash-multiple"
                                label="Avg. order"
                                value={d.orders.averageOrderValue}
                                color={colors.success}
                                format={(n) => `Rs ${compact(n)}`}
                            />
                            <Kpi
                                index={2}
                                icon="timer-sand"
                                label="Awaiting approval"
                                value={d.orders.pending}
                                color={colors.warning}
                                onPress={() => nav.navigate('Tabs', { screen: 'Orders', params: { status: 'pending' } })}
                            />
                            <Kpi
                                index={3}
                                icon="chef-hat"
                                label="In the kitchen"
                                value={d.orders.inKitchen}
                                color={colors.gold}
                                onPress={() => nav.navigate('Tabs', { screen: 'Kitchen' })}
                            />
                            <Kpi
                                index={4}
                                icon="calendar-account"
                                label={`Bookings · ${d.reservations.guestsToday} guests`}
                                value={d.reservations.today}
                                color={colors.primary}
                                onPress={() => nav.navigate('AdminReservations')}
                            />
                            <Kpi
                                index={5}
                                icon="account-hard-hat"
                                label={`Chefs free of ${d.kitchen.chefs}`}
                                value={d.kitchen.availableChefs}
                                color={colors.textMuted}
                            />
                        </View>

                        {d.orders.pending > 0 ? (
                            <Animated.View entering={FadeInDown.delay(500).springify()}>
                                <Card
                                    onPress={() => nav.navigate('Tabs', { screen: 'Orders', params: { status: 'pending' } })}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                        backgroundColor: colors.warningSoft,
                                        borderColor: '#F6DDB0',
                                    }}
                                >
                                    <PulseDot color={colors.warning} />
                                    <Txt variant="bodyMedium" style={{ flex: 1 }}>
                                        {d.orders.pending} new order{d.orders.pending > 1 ? 's' : ''} waiting for you
                                    </Txt>
                                    <Icon name="chevron-right" size={22} color={colors.warning} />
                                </Card>
                            </Animated.View>
                        ) : null}

                        {d.inventory.lowStockCount > 0 ? (
                            <Animated.View entering={FadeInDown.delay(550).springify()}>
                                <Card style={{ gap: 10 }}>
                                    <SectionTitle
                                        title={`Low stock · ${d.inventory.lowStockCount}`}
                                        action="Restock plan"
                                        onAction={() => nav.navigate('RestockPlan')}
                                        style={{ marginBottom: 0 }}
                                    />
                                    {d.inventory.lowStock.map((i) => (
                                        <PressableScale
                                            key={i.id}
                                            onPress={() => nav.navigate('InventoryItem', { id: i.id })}
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                                        >
                                            <Icon
                                                name={i.status === 'out_of_stock' ? 'alert-octagon' : 'alert'}
                                                size={18}
                                                color={i.status === 'out_of_stock' ? colors.danger : colors.warning}
                                            />
                                            <Txt variant="body" style={{ flex: 1 }}>
                                                {i.name}
                                            </Txt>
                                            <Txt variant="smallMedium" color={i.status === 'out_of_stock' ? colors.danger : colors.warning}>
                                                {i.currentQuantity} / {i.reorderLevel} {i.unit}
                                            </Txt>
                                        </PressableScale>
                                    ))}
                                </Card>
                            </Animated.View>
                        ) : null}

                        <Card
                            onPress={user?.role === 'admin' ? () => nav.navigate('AdminReviews') : undefined}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
                        >
                            <Txt variant="display" style={{ fontSize: 36 }}>
                                {d.rating.average.toFixed(1)}
                            </Txt>
                            <View style={{ flex: 1, gap: 3 }}>
                                <Stars value={d.rating.average} size={16} />
                                <Txt variant="small">{d.rating.totalReviews} guest reviews</Txt>
                            </View>
                            <Icon name="chevron-right" size={22} color={colors.textFaint} />
                        </Card>

                        {d.topDishes.length ? (
                            <View>
                                <SectionTitle title="Top dishes this week" />
                                <View style={{ gap: 10 }}>
                                    {d.topDishes.map((dish, i) => (
                                        <Animated.View key={dish.menuItemId} entering={FadeInRight.delay(i * 70).springify()}>
                                            <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 }}>
                                                <Txt variant="h3" color={i === 0 ? colors.gold : colors.textFaint} style={{ width: 22 }}>
                                                    #{i + 1}
                                                </Txt>
                                                <DishImage uri={dish.imageUrl} size={42} radius={12} />
                                                <View style={{ flex: 1 }}>
                                                    <Txt variant="bodyMedium" numberOfLines={1}>
                                                        {dish.name}
                                                    </Txt>
                                                    <Txt variant="tiny">{dish.quantitySold} sold</Txt>
                                                </View>
                                                <Txt variant="bodyMedium">{money(dish.sales)}</Txt>
                                            </Card>
                                        </Animated.View>
                                    ))}
                                </View>
                            </View>
                        ) : null}

                        <View>
                            <SectionTitle
                                title="Recent orders"
                                action="All orders"
                                onAction={() => nav.navigate('Tabs', { screen: 'Orders' })}
                            />
                            <View style={{ gap: 10 }}>
                                {d.recentOrders.map((o) => {
                                    const tone = orderStatus[o.status];
                                    return (
                                        <Card
                                            key={o.id}
                                            onPress={() => nav.navigate('AdminOrder', { id: o.id })}
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}
                                        >
                                            <View style={[styles.kpiIcon, { backgroundColor: tone.bg }]}>
                                                <Icon name={tone.icon} size={20} color={tone.fg} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Txt variant="bodyMedium">
                                                    #{o.orderNumber} · {o.customer}
                                                </Txt>
                                                <Txt variant="tiny">
                                                    {time(o.placedAt)} · {o.items} items ·{' '}
                                                    {o.orderType === 'takeaway' ? 'Takeaway' : 'Dine-in'}
                                                </Txt>
                                            </View>
                                            <View style={{ alignItems: 'flex-end', gap: 3 }}>
                                                <Txt variant="bodyMedium">{money(o.total)}</Txt>
                                                <Pill label={tone.label} fg={tone.fg} bg={tone.bg} />
                                            </View>
                                        </Card>
                                    );
                                })}
                            </View>
                        </View>
                    </>
                )}
            </Body>
        </Screen>
    );
}
function BarChartLight({ data }) {
    return (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 10 }}>
            <BarChart dark data={data} height={110} format={(v) => `Rs ${compact(v)}`} />
        </View>
    );
}
const styles = StyleSheet.create({
    top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    revenue: { borderRadius: radius.xxl, padding: 18, gap: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    kpi: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 14, gap: 4, borderWidth: 1, borderColor: colors.border },
    kpiIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
