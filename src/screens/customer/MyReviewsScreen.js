import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { reviewsApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { ago } from '../../utils/format';
import { Body, Card, DishImage, EmptyState, Header, ListSkeleton, Screen, Stars, Txt } from '../../components/ui';
export function MyReviewsScreen() {
    const q = useQuery({ queryKey: ['reviews', 'mine'], queryFn: reviewsApi.mine });
    const d = q.data;
    return (
        <Screen>
            <Header title="My reviews" />
            {q.isLoading ? (
                <ListSkeleton />
            ) : !d || (d.restaurantReviews.length === 0 && d.dishReviews.length === 0) ? (
                <EmptyState icon="star-outline" title="No reviews yet" message="After your order is completed you can rate it." />
            ) : (
                <Body refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
                    {d.restaurantReviews.length ? <Txt variant="h3">Visits</Txt> : null}
                    {d.restaurantReviews.map((r, i) => (
                        <Animated.View key={r.id} entering={FadeInDown.delay(i * 50).springify()}>
                            <Card style={{ gap: 6 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Stars value={r.rating} size={15} />
                                    <Txt variant="tiny">{ago(r.createdAt)}</Txt>
                                </View>
                                {r.comment ? <Txt variant="body">{r.comment}</Txt> : null}
                                <Txt variant="tiny" numberOfLines={1}>
                                    {r.dishes.join(', ')}
                                </Txt>
                            </Card>
                        </Animated.View>
                    ))}
                    {d.dishReviews.length ? <Txt variant="h3">Dishes</Txt> : null}
                    {d.dishReviews.map((r, i) => (
                        <Animated.View key={r.id} entering={FadeInDown.delay(i * 50).springify()}>
                            <Card style={{ flexDirection: 'row', gap: 12 }}>
                                <DishImage uri={r.menuItem.image_url} size={52} radius={12} />
                                <View style={{ flex: 1, gap: 3 }}>
                                    <Txt variant="bodyMedium">{r.menuItem.name}</Txt>
                                    <Stars value={r.rating} size={13} />
                                    {r.comment ? (
                                        <Txt variant="small" color={colors.text}>
                                            {r.comment}
                                        </Txt>
                                    ) : null}
                                </View>
                            </Card>
                        </Animated.View>
                    ))}
                </Body>
            )}
        </Screen>
    );
}
