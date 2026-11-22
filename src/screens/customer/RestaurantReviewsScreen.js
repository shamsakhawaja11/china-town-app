import React, { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { reviewsApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { ago } from '../../utils/format';
import { Avatar, Card, ChipRow, EmptyState, Header, ListSkeleton, Pill, Screen, Stars, Txt } from '../../components/ui';
import { RatingSummaryCard } from '../../components/RatingSummary';
export function RestaurantReviewsScreen() {
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('newest');
    const params = {
        rating: ['5', '4', '3'].includes(filter) ? Number(filter) : undefined,
        withComment: filter === 'comments' || undefined,
        sort: filter === 'low' ? 'lowest' : sort,
    };
    const q = useInfiniteQuery({
        queryKey: ['reviews', 'restaurant', params],
        queryFn: ({ pageParam }) => reviewsApi.restaurant({ ...params, page: pageParam, limit: 15 }),
        initialPageParam: 1,
        getNextPageParam: (l) => (l.hasNextPage ? l.page + 1 : undefined),
    });
    const items = q.data?.pages.flatMap((p) => p.items) ?? [];
    const summary = q.data?.pages[0]?.summary;
    return (
        <Screen>
            <Header title="Reviews" subtitle={summary ? `${summary.totalReviews} guest reviews` : undefined} />
            {q.isLoading ? (
                <ListSkeleton />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(r) => r.id}
                    contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
                    onEndReached={() => q.hasNextPage && q.fetchNextPage()}
                    ListHeaderComponent={
                        <View style={{ gap: 14, marginBottom: 4 }}>
                            {summary ? <RatingSummaryCard summary={summary} /> : null}
                            <View style={{ marginHorizontal: -20 }}>
                                <ChipRow
                                    small
                                    value={filter}
                                    onChange={setFilter}
                                    items={[
                                        { value: 'all', label: 'All' },
                                        { value: '5', label: '5 ★' },
                                        { value: '4', label: '4 ★' },
                                        { value: '3', label: '3 ★' },
                                        { value: 'low', label: 'Critical' },
                                        { value: 'comments', label: 'With comments', icon: 'comment-text-outline' },
                                    ]}
                                />
                            </View>
                            <View style={{ marginHorizontal: -20 }}>
                                <ChipRow
                                    small
                                    value={sort}
                                    onChange={(v) => setSort(v)}
                                    items={[
                                        { value: 'newest', label: 'Newest', icon: 'sort-calendar-descending' },
                                        { value: 'highest', label: 'Highest', icon: 'sort-numeric-descending' },
                                        { value: 'lowest', label: 'Lowest', icon: 'sort-numeric-ascending' },
                                    ]}
                                />
                            </View>
                        </View>
                    }
                    ListEmptyComponent={<EmptyState icon="comment-search-outline" title="No reviews match" />}
                    ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay((index % 15) * 50).springify()}>
                            <Card style={{ gap: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Avatar name={item.reviewer} size={40} />
                                    <View style={{ flex: 1 }}>
                                        <Txt variant="bodyMedium">{item.reviewer}</Txt>
                                        <Txt variant="tiny">
                                            {ago(item.createdAt)} · {item.orderType === 'takeaway' ? 'Takeaway' : 'Dine-in'}
                                        </Txt>
                                    </View>
                                    <Stars value={item.rating} size={14} />
                                </View>
                                {item.comment ? (
                                    <Txt variant="body">{item.comment}</Txt>
                                ) : (
                                    <Txt variant="small">Rated without a comment</Txt>
                                )}
                                {item.foodRating || item.serviceRating || item.ambienceRating ? (
                                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                        {item.foodRating ? (
                                            <Pill label={`Food ${item.foodRating}★`} fg={colors.text} bg={colors.surfaceAlt} />
                                        ) : null}
                                        {item.serviceRating ? (
                                            <Pill label={`Service ${item.serviceRating}★`} fg={colors.text} bg={colors.surfaceAlt} />
                                        ) : null}
                                        {item.ambienceRating ? (
                                            <Pill label={`Ambience ${item.ambienceRating}★`} fg={colors.text} bg={colors.surfaceAlt} />
                                        ) : null}
                                    </View>
                                ) : null}
                                {item.dishes.length ? (
                                    <Txt variant="tiny" numberOfLines={1}>
                                        Ordered: {item.dishes.join(', ')}
                                    </Txt>
                                ) : null}
                            </Card>
                        </Animated.View>
                    )}
                />
            )}
        </Screen>
    );
}
