import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { adminApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { toast } from '../../store/toast';
import {
    Avatar,
    Body,
    BottomBar,
    Button,
    Card,
    EmptyState,
    Header,
    Icon,
    ListSkeleton,
    Pill,
    RadioGroup,
    Screen,
    Txt,
} from '../../components/ui';
export function AssignChefsScreen({ route, navigation }) {
    const { orderId } = route.params;
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['admin', 'suggestions', orderId], queryFn: () => adminApi.suggestions(orderId) });
    const [pick, setPick] = useState({});
    const [open, setOpen] = useState(null);
    useEffect(() => {
        if (!q.data) return;
        const init = {};
        for (const it of q.data.items) {
            const id = it.assignedStaffIds[0] ?? it.suggested?.staffId;
            if (id) init[it.orderItemId] = id;
        }
        setPick(init);
        setOpen(q.data.items.find((i) => !i.assignedStaffIds.length)?.orderItemId ?? null);
    }, [q.data]);
    const after = (msg) => {
        toast.success(msg, 'Chefs were notified.');
        qc.invalidateQueries({ queryKey: ['admin'] });
        qc.invalidateQueries({ queryKey: ['kitchen'] });
        navigation.goBack();
    };
    const save = useMutation({
        mutationFn: () =>
            adminApi.assign(
                orderId,
                Object.entries(pick).map(([orderItemId, staffId]) => ({ orderItemId, staffId })),
                true,
            ),
        onSuccess: () => after('Chefs assigned'),
        onError: (e) => toast.error("Couldn't assign", errorMessage(e)),
    });
    const auto = useMutation({
        mutationFn: () => adminApi.autoAssign(orderId),
        onSuccess: () => after('Auto-assigned'),
        onError: (e) => toast.error("Couldn't auto-assign", errorMessage(e)),
    });
    const d = q.data;
    return (
        <Screen>
            <Header title="Assign chefs" subtitle={d ? `${d.items.length} dishes` : undefined} />
            {q.isLoading ? (
                <ListSkeleton rows={3} />
            ) : !d ? (
                <EmptyState tone="error" title="Couldn't load" action="Retry" onAction={() => q.refetch()} />
            ) : (
                <Body>
                    <Card flat style={{ gap: 10 }}>
                        <Txt variant="smallMedium">Chefs on shift</Txt>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {d.chefs.map((c) => (
                                <View
                                    key={c.id}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: c.isAvailable ? 1 : 0.45 }}
                                >
                                    <Avatar name={c.name} size={30} color={c.isAvailable ? colors.success : colors.textMuted} />
                                    <View>
                                        <Txt variant="tiny" color={colors.text}>
                                            {c.name.split(' ')[0]}
                                        </Txt>
                                        <Txt variant="tiny">{c.isAvailable ? `${c.activeTasks} tasks` : 'Off'}</Txt>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Card>
                    {d.items.map((it, i) => {
                        const chosen = d.chefs.find((c) => c.id === pick[it.orderItemId]);
                        const expanded = open === it.orderItemId;
                        const options = [
                            ...it.candidates,
                            ...d.chefs
                                .filter((c) => c.isAvailable && !it.candidates.some((x) => x.staffId === c.id))
                                .map((c) => ({ staffId: c.id, name: c.name, matches: [], activeTasks: c.activeTasks })),
                        ];
                        return (
                            <Animated.View key={it.orderItemId} entering={FadeInDown.delay(i * 70).springify()}>
                                <Card style={{ gap: 10 }} onPress={() => setOpen(expanded ? null : it.orderItemId)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 12,
                                                backgroundColor: colors.primaryLight,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Txt variant="h3" color={colors.primary}>
                                                {it.quantity}×
                                            </Txt>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Txt variant="bodyMedium">{it.name}</Txt>
                                            <Txt variant="tiny">{it.requiredSpecializations.join(' · ') || 'Any chef'}</Txt>
                                        </View>
                                        {chosen ? (
                                            <Pill
                                                label={chosen.name.split(' ')[0]}
                                                icon="chef-hat"
                                                fg={colors.success}
                                                bg={colors.successSoft}
                                            />
                                        ) : (
                                            <Pill label="Pick chef" fg={colors.warning} bg={colors.warningSoft} />
                                        )}
                                        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
                                    </View>
                                    {expanded ? (
                                        <Animated.View entering={FadeInDown.springify()}>
                                            {options.length === 0 ? (
                                                <Txt variant="small" color={colors.danger}>
                                                    No chef is available right now.
                                                </Txt>
                                            ) : (
                                                <RadioGroup
                                                    value={pick[it.orderItemId]}
                                                    onChange={(staffId) => {
                                                        setPick((p) => ({ ...p, [it.orderItemId]: staffId }));
                                                        setOpen(
                                                            d.items.find((x) => x.orderItemId !== it.orderItemId && !pick[x.orderItemId])
                                                                ?.orderItemId ?? null,
                                                        );
                                                    }}
                                                    options={options.map((c, idx) => ({
                                                        value: c.staffId,
                                                        label: c.name,
                                                        description: `${c.activeTasks} active task${c.activeTasks === 1 ? '' : 's'}${c.matches.length ? ` · ${c.matches.join(', ')}` : ''}`,
                                                        icon: 'chef-hat',
                                                        right:
                                                            idx === 0 && it.suggested?.staffId === c.staffId ? (
                                                                <Pill
                                                                    label="Best match"
                                                                    icon="star"
                                                                    fg={colors.gold}
                                                                    bg={colors.goldSoft}
                                                                />
                                                            ) : null,
                                                    }))}
                                                />
                                            )}
                                        </Animated.View>
                                    ) : null}
                                </Card>
                            </Animated.View>
                        );
                    })}
                </Body>
            )}
            {d ? (
                <BottomBar style={{ flexDirection: 'row' }}>
                    <Button
                        title="Auto"
                        variant="secondary"
                        icon="auto-fix"
                        style={{ flex: 1 }}
                        loading={auto.isPending}
                        onPress={() => auto.mutate()}
                    />
                    <Button
                        title="Save"
                        icon="check"
                        style={{ flex: 2 }}
                        disabled={Object.keys(pick).length === 0}
                        loading={save.isPending}
                        onPress={() => save.mutate()}
                    />
                </BottomBar>
            ) : null}
        </Screen>
    );
}
