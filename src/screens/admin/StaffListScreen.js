import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { adminApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { toast } from '../../store/toast';
import { Avatar, Card, ChipRow, EmptyState, Fab, Header, ListSkeleton, Pill, Screen, Toggle, Txt } from '../../components/ui';
const TYPE_ICON = { chef: 'chef-hat', waiter: 'room-service-outline', manager: 'briefcase-outline' };
export function StaffListScreen({ navigation }) {
    const qc = useQueryClient();
    const [type, setType] = useState('all');
    const q = useQuery({ queryKey: ['admin', 'staff'], queryFn: adminApi.staff });
    const toggle = useMutation({
        mutationFn: (v) => adminApi.updateStaff(v.id, { isActive: v.isActive }),
        onSuccess: (s) => {
            toast.success(
                s.isActive ? `${s.name} re-activated` : `${s.name} deactivated`,
                s.isActive ? undefined : 'Their login was signed out.',
            );
            qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
        },
        onError: (e) => toast.error('Update failed', errorMessage(e)),
    });
    const list = (q.data ?? []).filter((s) => type === 'all' || s.staffType === type);
    return (
        <Screen>
            <Header title="Staff" subtitle={q.data ? `${q.data.filter((s) => s.isActive).length} active` : undefined} />
            <ChipRow
                small
                value={type}
                onChange={setType}
                items={[
                    { value: 'all', label: 'Everyone' },
                    { value: 'chef', label: 'Chefs', icon: 'chef-hat' },
                    { value: 'waiter', label: 'Waiters', icon: 'room-service-outline' },
                    { value: 'manager', label: 'Managers', icon: 'briefcase-outline' },
                ]}
            />
            {q.isLoading ? (
                <ListSkeleton />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(s) => s.id}
                    contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 110 }}
                    refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                    ListEmptyComponent={<EmptyState icon="account-group-outline" title="No staff yet" />}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                            <Card style={{ gap: 10, opacity: item.isActive ? 1 : 0.6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Avatar
                                        name={item.name}
                                        color={item.isAvailable && item.isActive ? colors.success : colors.textMuted}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Txt variant="h3">{item.name}</Txt>
                                        <Txt variant="small">
                                            {item.position ?? item.staffType} · {item.email ?? item.phone}
                                        </Txt>
                                    </View>
                                    <Toggle value={item.isActive} onChange={(isActive) => toggle.mutate({ id: item.id, isActive })} />
                                </View>
                                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                    <Pill
                                        label={item.staffType}
                                        icon={TYPE_ICON[item.staffType]}
                                        fg={colors.primary}
                                        bg={colors.primaryLight}
                                    />
                                    {item.staffType === 'chef' ? (
                                        <Pill
                                            label={item.isAvailable ? 'On shift' : 'Break'}
                                            fg={item.isAvailable ? colors.success : colors.textMuted}
                                            bg={item.isAvailable ? colors.successSoft : colors.surfaceAlt}
                                        />
                                    ) : null}
                                    {item.specializations.map((sp) => (
                                        <Pill key={sp.id} label={sp.name} fg={colors.textMuted} bg={colors.surfaceAlt} />
                                    ))}
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                />
            )}
            <Fab icon="account-plus" label="Add staff" onPress={() => navigation.navigate('AddStaff')} />
        </Screen>
    );
}
