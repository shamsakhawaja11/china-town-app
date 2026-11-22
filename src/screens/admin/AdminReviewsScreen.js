import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { reviewsApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { ago } from '../../utils/format';
import {
    Avatar,
    Card,
    ChipRow,
    DishImage,
    EmptyState,
    Header,
    ListSkeleton,
    Pill,
    Screen,
    Segmented,
    Stars,
    Txt,
} from '../../components/ui';
import { RatingSummaryCard } from '../../components/RatingSummary';
export function AdminReviewsScreen() {
    const [tab, setTab] = useState('restaurant');
    const [rating, setRating] = useState('all');
    const summary = useQuery({ queryKey: ['reviews', 'admin', 'summary'], queryFn: reviewsApi.adminSummary });
    const r = rating === 'all' ? undefined : Number(rating);
    const rest = useQuery({
        queryKey: ['reviews', 'admin', 'rest', r],
        queryFn: () => reviewsApi.adminRestaurant({ rating: r }),
        enabled: tab === 'restaurant',
    });
    const dish = useQuery({
        queryKey: ['reviews', 'admin', 'dish', r],
        queryFn: () => reviewsApi.adminDishes({ rating: r }),
        enabled: tab === 'dishes',
    });
    const s = summary.data;
    const header = (
        <View style={{ gap: 14, marginBottom: 4 }}>
            {s ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                        { l: 'Restaurant', v: s.restaurant.averageRating, n: s.restaurant.totalReviews },
                        { l: 'Dishes', v: s.dishes.averageRating, n: s.dishes.totalReviews },
                    ].map((x, i) => (
                        <Animated.View key={x.l} entering={FadeInDown.delay(i * 80).springify()} style={{ flex: 1 }}>
                            <Card style={{ alignItems: 'center', gap: 2 }}>
                                <Txt variant="display" style={{ fontSize: 34 }}>
                                    {x.v.toFixed(1)}
                                </Txt>
                                <Stars value={x.v} size={13} />
                                <Txt variant="tiny">
                                    {x.l} · {x.n} reviews
                                </Txt>
                            </Card>
                        </Animated.View>
                    ))}
                </View>
            ) : null}
            <Segmented
                value={tab}
                onChange={setTab}
                items={[
                    { value: 'restaurant', label: 'Visits' },
                    { value: 'dishes', label: 'Dishes' },
                ]}
            />
            {tab === 'restaurant' && s ? <RatingSummaryCard summary={s.restaurant} /> : null}
            {tab === 'dishes' && s ? (
                <Card style={{ gap: 10 }}>
                    <Txt variant="h3">Top rated</Txt>
                    {s.topRatedDishes.slice(0, 3).map((d) => (
                        <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <DishImage uri={d.imageUrl} size={36} radius={10} />
                            <Txt variant="body" style={{ flex: 1 }}>
                                {d.name}
                            </Txt>
                            <Pill label={`${d.averageRating.toFixed(1)} ★`} fg={colors.success} bg={colors.successSoft} />
                        </View>
                    ))}
                    <Txt variant="h3" style={{ marginTop: 6 }}>
                        Needs attention
                    </Txt>
                    {s.lowestRatedDishes.slice(0, 3).map((d) => (
                        <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <DishImage uri={d.imageUrl} size={36} radius={10} />
                            <Txt variant="body" style={{ flex: 1 }}>
                                {d.name}
                            </Txt>
                            <Pill label={`${d.averageRating.toFixed(1)} ★`} fg={colors.danger} bg={colors.dangerSoft} />
                        </View>
                    ))}
                </Card>
            ) : null}
            <View style={{ marginHorizontal: -20 }}>
                <ChipRow
                    small
                    value={rating}
                    onChange={setRating}
                    items={[
                        { value: 'all', label: 'All ratings' },
                        ...['5', '4', '3', '2', '1'].map((x) => ({ value: x, label: `${x} ★` })),
                    ]}
                />
            </View>
        </View>
    );
    const loading = tab === 'restaurant' ? rest.isLoading : dish.isLoading;
    return (
        <Screen>
            <Header title="Reviews" />
            {summary.isLoading ? (
                <ListSkeleton />
            ) : tab === 'restaurant' ? (
                <FlatList
                    data={rest.data?.items ?? []}
                    keyExtractor={(x) => x.id}
                    contentContainerStyle={{ padding: 20, gap: 12 }}
                    ListHeaderComponent={header}
                    ListEmptyComponent={loading ? <ListSkeleton rows={2} /> : <EmptyState icon="comment-outline" title="No reviews" />}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40)}>
                            <Card style={{ gap: 6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Avatar name={item.reviewer} size={34} />
                                    <View style={{ flex: 1 }}>
                                        <Txt variant="bodyMedium">{item.reviewer}</Txt>
                                        <Txt variant="tiny">{ago(item.createdAt)}</Txt>
                                    </View>
                                    <Stars value={item.rating} size={13} />
                                </View>
                                {item.comment ? <Txt variant="body">{item.comment}</Txt> : null}
                                <Txt variant="tiny" numberOfLines={1}>
                                    {item.dishes.join(', ')}
                                </Txt>
                            </Card>
                        </Animated.View>
                    )}
                />
            ) : (
                <FlatList
                    data={dish.data?.items ?? []}
                    keyExtractor={(x) => x.id}
                    contentContainerStyle={{ padding: 20, gap: 12 }}
                    ListHeaderComponent={header}
                    ListEmptyComponent={loading ? <ListSkeleton rows={2} /> : <EmptyState icon="comment-outline" title="No reviews" />}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40)}>
                            <Card style={{ flexDirection: 'row', gap: 12 }}>
                                <DishImage uri={item.menuItem.image_url} size={48} radius={12} />
                                <View style={{ flex: 1, gap: 3 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Txt variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                                            {item.menuItem.name}
                                        </Txt>
                                        <Stars value={item.rating} size={12} />
                                    </View>
                                    {item.comment ? (
                                        <Txt variant="small" color={colors.text}>
                                            {item.comment}
                                        </Txt>
                                    ) : null}
                                    <Txt variant="tiny">
                                        {item.reviewer} · {ago(item.createdAt)}
                                    </Txt>
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                />
            )}
        </Screen>
    );
}
