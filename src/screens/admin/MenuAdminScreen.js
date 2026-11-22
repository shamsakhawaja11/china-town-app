import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { menuApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { money, num } from '../../utils/format';
import { toast } from '../../store/toast';
import { Card, ChipRow, DishImage, EmptyState, Header, Icon, Input, ListSkeleton, Screen, Toggle, Txt } from '../../components/ui';
export function MenuAdminScreen({ navigation }) {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['admin', 'menu'], queryFn: menuApi.adminItems });
    const [cat, setCat] = useState('all');
    const [search, setSearch] = useState('');
    const toggle = useMutation({
        mutationFn: (v) => menuApi.updateItem(v.id, { isAvailable: v.isAvailable }),
        onSuccess: (it) => {
            toast.success(it.is_available ? `${it.name} is back on the menu` : `${it.name} marked sold out`);
            qc.invalidateQueries({ queryKey: ['admin', 'menu'] });
            qc.invalidateQueries({ queryKey: ['menu'] });
        },
        onError: (e) => toast.error('Update failed', errorMessage(e)),
    });
    const cats = [...new Map((q.data ?? []).map((i) => [i.category.id, i.category.name])).entries()];
    const list = (q.data ?? []).filter(
        (i) => (cat === 'all' || i.category.id === cat) && i.name.toLowerCase().includes(search.trim().toLowerCase()),
    );
    return (
        <Screen>
            <Header
                title="Menu"
                subtitle={q.data ? `${q.data.filter((i) => i.is_available).length}/${q.data.length} available` : undefined}
            />
            <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                <Input icon="magnify" placeholder="Search dishes" value={search} onChangeText={setSearch} />
            </View>
            <ChipRow
                small
                value={cat}
                onChange={setCat}
                items={[{ value: 'all', label: 'All' }, ...cats.map(([value, label]) => ({ value, label }))]}
            />
            {q.isLoading ? (
                <ListSkeleton />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ padding: 20, gap: 10 }}
                    refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
                    ListEmptyComponent={<EmptyState icon="food-off-outline" title="No dishes" />}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40).springify()}>
                            <Card
                                onPress={() => navigation.navigate('MenuItemEdit', { id: item.id })}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}
                            >
                                <DishImage uri={item.image_url} category={item.category.name} size={56} radius={14} />
                                <View style={{ flex: 1 }}>
                                    <Txt variant="bodyMedium" numberOfLines={1}>
                                        {item.name}
                                    </Txt>
                                    <Txt variant="tiny">{item.category.name}</Txt>
                                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 2 }}>
                                        <Txt variant="smallMedium" color={colors.primary}>
                                            {money(item.price)}
                                        </Txt>
                                        {item.review_count ? (
                                            <>
                                                <Icon name="star" size={12} color={colors.gold} />
                                                <Txt variant="tiny">{num(item.avg_rating).toFixed(1)}</Txt>
                                            </>
                                        ) : null}
                                    </View>
                                </View>
                                <View style={{ alignItems: 'center', gap: 2 }}>
                                    <Toggle
                                        value={item.is_available}
                                        onChange={(isAvailable) => toggle.mutate({ id: item.id, isAvailable })}
                                    />
                                    <Txt variant="tiny">{item.is_available ? 'On' : 'Sold out'}</Txt>
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                />
            )}
        </Screen>
    );
}
