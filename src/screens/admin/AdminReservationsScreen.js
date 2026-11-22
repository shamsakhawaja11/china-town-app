import React, { useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { reservationsApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors, radius } from '../../theme';
import { isoDay, money, time } from '../../utils/format';
import { reservationStatus } from '../../utils/status';
import { toast } from '../../store/toast';
import { Avatar, Button, Card, EmptyState, Header, IconButton, ListSkeleton, Pill, PressableScale, Screen, Txt } from '../../components/ui';
import { ReasonSheet } from '../../components/ReasonSheet';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function AdminReservationsScreen({ embedded }) {
    const qc = useQueryClient();
    const days = useMemo(() => Array.from({ length: 10 }, (_, i) => new Date(Date.now() + (i - 1) * 86400000)), []);
    const [day, setDay] = useState(1);
    const [cancelling, setCancelling] = useState(null);
    const date = isoDay(days[day]);
    const q = useQuery({
        queryKey: ['admin', 'reservations', date],
        queryFn: () => reservationsApi.adminList({ date }),
        refetchInterval: 30000,
    });
    const set = useMutation({
        mutationFn: (v) => reservationsApi.setStatus(v.id, v.status, v.reason),
        onSuccess: (r) => {
            setCancelling(null);
            toast.success(
                `Booking ${reservationStatus[r.status]?.label.toLowerCase()}`,
                r.deposit?.refunded ? `Deposit ${money(r.deposit.refunded)} returned to wallet` : undefined,
            );
            qc.invalidateQueries({ queryKey: ['admin', 'reservations'] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (e) => toast.error('Update failed', errorMessage(e)),
    });
    const items = q.data?.items ?? [];
    const guests = items.filter((r) => !['cancelled', 'no_show'].includes(r.status)).reduce((s, r) => s + r.partySize, 0);
    const actions = (r) => {
        const btn = (title, status, variant = 'primary', icon) => (
            <Button
                key={status}
                title={title}
                size="sm"
                variant={variant}
                icon={icon}
                style={{ flex: 1 }}
                loading={set.isPending && set.variables?.id === r.id && set.variables.status === status}
                onPress={() => set.mutate({ id: r.id, status })}
            />
        );
        switch (r.status) {
            case 'pending':
                return [
                    btn('Confirm', 'confirmed', 'success', 'check'),
                    <Button key="c" title="Decline" size="sm" variant="outline" style={{ flex: 1 }} onPress={() => setCancelling(r)} />,
                ];
            case 'confirmed':
                return [btn('Seat guests', 'seated', 'primary', 'seat'), btn('No-show', 'no_show', 'outline')];
            case 'seated':
                return [btn('Complete', 'completed', 'success', 'check-all')];
            default:
                return [];
        }
    };
    return (
        <Screen edges={embedded ? ['top'] : ['top']}>
            {embedded ? (
                <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                    <Txt variant="h1">Reservations</Txt>
                </View>
            ) : (
                <Header title="Reservations" />
            )}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 12 }}
            >
                {days.map((d, i) => {
                    const active = i === day;
                    return (
                        <PressableScale key={i} haptic onPress={() => setDay(i)} style={[styles.day, active && styles.dayOn]}>
                            <Txt variant="tiny" color={active ? '#FFD9D2' : colors.textMuted}>
                                {i === 1 ? 'Today' : DAYS[d.getDay()]}
                            </Txt>
                            <Txt variant="h3" color={active ? colors.white : colors.text}>
                                {d.getDate()}
                            </Txt>
                        </PressableScale>
                    );
                })}
            </ScrollView>
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10 }}>
                <Pill label={`${items.length} bookings`} icon="calendar" fg={colors.text} bg={colors.surfaceAlt} />
                <Pill label={`${guests} guests`} icon="account-group" fg={colors.text} bg={colors.surfaceAlt} />
            </View>
            {q.isLoading ? (
                <ListSkeleton rows={3} />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(r) => r.id}
                    contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                    ListEmptyComponent={<EmptyState icon="calendar-blank-outline" title="No bookings this day" />}
                    renderItem={({ item, index }) => {
                        const tone = reservationStatus[item.status];
                        const acts = actions(item);
                        return (
                            <Animated.View entering={FadeInDown.delay(index * 50).springify()} layout={LinearTransition.springify()}>
                                <Card style={{ gap: 10 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={{ alignItems: 'center', width: 56 }}>
                                            <Txt variant="h3" color={colors.primary}>
                                                {time(item.reservationTime).replace(' ', '\n')}
                                            </Txt>
                                        </View>
                                        <View style={{ flex: 1, gap: 2 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Avatar name={item.customer?.name} size={26} />
                                                <Txt variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                                                    {item.customer?.name}
                                                </Txt>
                                            </View>
                                            <Txt variant="small">
                                                {item.partySize} guests · {item.tables.map((t) => t.tableNumber).join(', ')} ·{' '}
                                                {item.durationMinutes} min
                                            </Txt>
                                        </View>
                                        {item.customer?.phone ? (
                                            <IconButton
                                                icon="phone"
                                                size={36}
                                                color={colors.success}
                                                onPress={() => Linking.openURL(`tel:${item.customer.phone}`)}
                                            />
                                        ) : null}
                                    </View>
                                    {item.specialRequests ? (
                                        <Txt variant="small" color={colors.gold}>
                                            “{item.specialRequests}”
                                        </Txt>
                                    ) : null}
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        <Pill label={tone.label} icon={tone.icon} fg={tone.fg} bg={tone.bg} />
                                        <Pill label={`#${item.bookingCode}`} fg={colors.textMuted} bg={colors.surfaceAlt} />
                                    </View>
                                    {acts.length ? <View style={{ flexDirection: 'row', gap: 8 }}>{acts}</View> : null}
                                </Card>
                            </Animated.View>
                        );
                    }}
                />
            )}
            <ReasonSheet
                visible={!!cancelling}
                title="Decline booking"
                message="The guest is notified and any deposit is returned to their wallet."
                presets={['Fully booked', 'Private event', 'Kitchen closed', 'Guest asked to cancel']}
                confirmLabel="Decline"
                loading={set.isPending}
                onClose={() => setCancelling(null)}
                onConfirm={(reason) => cancelling && set.mutate({ id: cancelling.id, status: 'cancelled', reason })}
            />
        </Screen>
    );
}
const styles = StyleSheet.create({
    day: {
        width: 56,
        height: 62,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
