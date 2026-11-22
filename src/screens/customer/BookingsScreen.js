import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { reservationsApi } from '../../api/endpoints';
import { colors, radius } from '../../theme';
import { date, time } from '../../utils/format';
import { reservationStatus } from '../../utils/status';
import { Button, Card, EmptyState, Icon, ListSkeleton, Pill, Screen, Segmented, Txt } from '../../components/ui';
export function BookingsScreen() {
    const nav = useNavigation();
    const [scope, setScope] = useState('upcoming');
    const q = useQuery({ queryKey: ['reservations', 'mine', scope], queryFn: () => reservationsApi.mine(scope) });
    return (
        <Screen>
            <View style={{ padding: 20, paddingBottom: 8, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Txt variant="h1">Bookings</Txt>
                    <Button
                        title="Book"
                        icon="plus"
                        size="sm"
                        full={false}
                        onPress={() => nav.navigate('TablePicker', { mode: 'booking' })}
                    />
                </View>
                <Segmented
                    value={scope}
                    onChange={setScope}
                    items={[
                        { value: 'upcoming', label: 'Upcoming' },
                        { value: 'past', label: 'Past' },
                    ]}
                />
            </View>
            {q.isLoading ? (
                <ListSkeleton rows={3} />
            ) : (
                <FlatList
                    data={q.data?.items ?? []}
                    keyExtractor={(r) => r.id}
                    contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        q.isError ? (
                            <EmptyState tone="error" title="Couldn't load bookings" action="Retry" onAction={() => q.refetch()} />
                        ) : (
                            <EmptyState
                                icon="calendar-blank-outline"
                                title={scope === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
                                message="Reserve a table and skip the wait."
                                action="Book a table"
                                onAction={() => nav.navigate('TablePicker', { mode: 'booking' })}
                            />
                        )
                    }
                    renderItem={({ item, index }) => {
                        const tone = reservationStatus[item.status];
                        const d = new Date(item.reservationTime);
                        return (
                            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
                                <Card
                                    onPress={() => nav.navigate('BookingDetail', { id: item.id })}
                                    style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}
                                >
                                    <View
                                        style={{
                                            width: 62,
                                            height: 70,
                                            borderRadius: radius.lg,
                                            backgroundColor: colors.primaryLight,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Txt variant="tiny" color={colors.primary}>
                                            {date(d).split(',')[0]}
                                        </Txt>
                                        <Txt variant="h1" color={colors.primary} style={{ lineHeight: 30 }}>
                                            {d.getDate()}
                                        </Txt>
                                    </View>
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <Txt variant="h3">
                                            {time(d)} · {item.partySize} guests
                                        </Txt>
                                        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                                            <Icon name="table-chair" size={14} color={colors.textMuted} />
                                            <Txt variant="small">Table {item.tables.map((t) => t.tableNumber).join(', ') || '–'}</Txt>
                                        </View>
                                        <Pill label={tone.label} icon={tone.icon} fg={tone.fg} bg={tone.bg} />
                                    </View>
                                    <Icon name="chevron-right" size={22} color={colors.textFaint} />
                                </Card>
                            </Animated.View>
                        );
                    }}
                />
            )}
        </Screen>
    );
}
