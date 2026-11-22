import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { haptics } from '../../lib/haptics';
import { adminApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors, radius } from '../../theme';
import { greeting, minutesSince, time } from '../../utils/format';
import { useAuth } from '../../store/auth';
import { toast } from '../../store/toast';
import {
    AnimatedNumber,
    Body,
    Button,
    Card,
    DishImage,
    EmptyState,
    Icon,
    Pill,
    ProgressBar,
    Screen,
    Skeleton,
    Toggle,
    Txt,
} from '../../components/ui';
export function ChefTasksScreen() {
    const qc = useQueryClient();
    const user = useAuth((s) => s.user);
    const [, tick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => tick((x) => x + 1), 15000);
        return () => clearInterval(t);
    }, []);
    const q = useQuery({ queryKey: ['kitchen', 'mine'], queryFn: adminApi.myTasks, refetchInterval: 10000 });
    const availability = useMutation({
        mutationFn: (v) => adminApi.setAvailability(v),
        onSuccess: (r) => {
            toast.success(
                r.isAvailable ? "You're on shift" : "You're on a break",
                r.isAvailable ? 'New dishes can be assigned to you.' : 'No new dishes will be assigned.',
            );
            qc.invalidateQueries({ queryKey: ['kitchen'] });
        },
        onError: (e) => toast.error('Update failed', errorMessage(e)),
    });
    const act = useMutation({
        mutationFn: (v) => (v.kind === 'start' ? adminApi.startTask(v.id) : adminApi.doneTask(v.id)),
        onSuccess: (t, v) => {
            haptics.success();
            toast.success(
                v.kind === 'start' ? `Cooking ${t.dish}` : `${t.dish} is done`,
                v.kind === 'start' ? 'Ingredients were taken from stock.' : undefined,
            );
            qc.invalidateQueries({ queryKey: ['kitchen'] });
        },
        onError: (e) => toast.error('Update failed', errorMessage(e)),
    });
    const d = q.data;
    const task = (t, i) => {
        const elapsed = minutesSince(t.startedAt);
        const prep = t.preparationTimeMinutes ?? 15;
        const over = t.status === 'in_progress' && elapsed > prep;
        return (
            <Animated.View
                key={t.id}
                entering={FadeInDown.delay(i * 60).springify()}
                exiting={FadeOut}
                layout={LinearTransition.springify()}
            >
                <Card style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <DishImage uri={t.imageUrl} size={56} radius={14} />
                        <View style={{ flex: 1 }}>
                            <Txt variant="h3">
                                {t.quantity}× {t.dish}
                            </Txt>
                            <Txt variant="small">
                                #{t.orderNumber} · {t.orderType === 'takeaway' ? 'Takeaway' : `Table ${t.tableNumber ?? '–'}`}
                            </Txt>
                        </View>
                        {t.status === 'done' ? (
                            <Pill label={time(t.completedAt)} icon="check" fg={colors.success} bg={colors.successSoft} />
                        ) : null}
                    </View>
                    {t.specialInstructions ? (
                        <View
                            style={{ flexDirection: 'row', gap: 6, backgroundColor: colors.goldSoft, padding: 8, borderRadius: radius.md }}
                        >
                            <Icon name="alert-circle-outline" size={16} color={colors.gold} />
                            <Txt variant="small" color={colors.text}>
                                {t.specialInstructions}
                            </Txt>
                        </View>
                    ) : null}
                    {t.status === 'in_progress' ? (
                        <View style={{ gap: 4 }}>
                            <ProgressBar value={elapsed / prep} color={over ? colors.danger : colors.gold} />
                            <Txt variant="tiny" color={over ? colors.danger : colors.textMuted}>
                                {elapsed} of ~{prep} min{over ? ' · running late' : ''}
                            </Txt>
                        </View>
                    ) : null}
                    {t.status === 'assigned' ? (
                        <Button
                            title="Start cooking"
                            icon="fire"
                            size="md"
                            loading={act.isPending && act.variables?.id === t.id}
                            onPress={() => act.mutate({ id: t.id, kind: 'start' })}
                        />
                    ) : t.status === 'in_progress' ? (
                        <Button
                            title="Mark as done"
                            icon="check-bold"
                            variant="success"
                            size="md"
                            loading={act.isPending && act.variables?.id === t.id}
                            onPress={() => act.mutate({ id: t.id, kind: 'done' })}
                        />
                    ) : null}
                </Card>
            </Animated.View>
        );
    };
    return (
        <Screen>
            <Body refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
                <View>
                    <Txt variant="small">{greeting()}, chef</Txt>
                    <Txt variant="h1">{user?.name}</Txt>
                </View>
                {!d ? (
                    q.isError ? (
                        <EmptyState tone="error" title="Couldn't load tasks" action="Retry" onAction={() => q.refetch()} />
                    ) : (
                        <Skeleton height={160} r={24} />
                    )
                ) : (
                    <>
                        <Animated.View entering={FadeInDown.springify()}>
                            <LinearGradient
                                colors={d.isAvailable ? [colors.dark, '#2F4A2B'] : [colors.dark, '#4A2A20']}
                                style={styles.hero}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <Txt variant="h3" color={colors.white}>
                                            {d.isAvailable ? 'On shift' : 'On a break'}
                                        </Txt>
                                        <Txt variant="small" color="#D9C2B9">
                                            {d.isAvailable ? 'Managers can assign you dishes' : 'You won’t get new dishes'}
                                        </Txt>
                                    </View>
                                    <Toggle
                                        value={d.isAvailable}
                                        onChange={(v) => availability.mutate(v)}
                                        disabled={availability.isPending}
                                    />
                                </View>
                                <View style={{ flexDirection: 'row', marginTop: 16 }}>
                                    {[
                                        { l: 'Queued', v: d.counts.queued, c: '#9CC4FF' },
                                        { l: 'Cooking', v: d.counts.cooking, c: colors.gold },
                                        { l: 'Done today', v: d.counts.doneToday, c: '#86EFAC' },
                                    ].map((s) => (
                                        <View key={s.l} style={{ flex: 1, alignItems: 'center' }}>
                                            <AnimatedNumber value={s.v} variant="h1" color={s.c} />
                                            <Txt variant="tiny" color="#D9C2B9">
                                                {s.l}
                                            </Txt>
                                        </View>
                                    ))}
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        {d.cooking.length ? <Txt variant="h3">🔥 Cooking now</Txt> : null}
                        {d.cooking.map(task)}
                        {d.queued.length ? <Txt variant="h3">Up next</Txt> : null}
                        {d.queued.map(task)}
                        {!d.cooking.length && !d.queued.length ? (
                            <EmptyState
                                icon="chef-hat"
                                title="No dishes assigned"
                                message="Take a breather — new tasks will pop up here."
                            />
                        ) : null}
                        {d.doneToday.length ? <Txt variant="h3">Done today</Txt> : null}
                        {d.doneToday.slice(0, 10).map(task)}
                    </>
                )}
            </Body>
        </Screen>
    );
}
const styles = StyleSheet.create({
    hero: { borderRadius: radius.xxl, padding: 18 },
});
