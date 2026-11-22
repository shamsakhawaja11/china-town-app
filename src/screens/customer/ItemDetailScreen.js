import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    Extrapolation,
    FadeIn,
    FadeInDown,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { menuApi, reviewsApi } from '../../api/endpoints';
import { colors, radius } from '../../theme';
import { ago, money, num, qty as fmtQty, titleCase } from '../../utils/format';
import { spiceLabel } from '../../utils/status';
import { useCart } from '../../hooks/useCart';
import {
    BottomBar,
    Button,
    Card,
    DishImage,
    EmptyState,
    Icon,
    IconButton,
    Input,
    Pill,
    Segmented,
    Skeleton,
    Stars,
    Stepper,
    Txt,
} from '../../components/ui';
import { Chillies, VegBadge } from '../../components/MenuItemCard';
import { RatingSummaryCard } from '../../components/RatingSummary';
const HERO = 340;
export function ItemDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const insets = useSafeAreaInsets();
    const { add, qtyOf } = useCart();
    const [tab, setTab] = useState('about');
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState('');
    const item = useQuery({ queryKey: ['menu', 'item', id], queryFn: () => menuApi.item(id) });
    const reviews = useQuery({
        queryKey: ['reviews', 'dish', id],
        queryFn: () => reviewsApi.dish(id, { limit: 20 }),
        enabled: tab === 'reviews',
    });
    const y = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((e) => {
        y.value = e.contentOffset.y;
    });
    const hero = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(y.value, [-120, 0, HERO], [-60, 0, HERO * 0.5], Extrapolation.CLAMP) },
            { scale: interpolate(y.value, [-150, 0], [1.4, 1], Extrapolation.CLAMP) },
        ],
    }));
    const bar = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [HERO - 140, HERO - 80], [0, 1], Extrapolation.CLAMP) }));
    const d = item.data;
    const inCart = qtyOf(id);
    if (item.isError) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 60 }}>
                <EmptyState
                    tone="error"
                    title="Dish not found"
                    message="It may have been removed from the menu."
                    action="Go back"
                    onAction={() => navigation.goBack()}
                />
            </View>
        );
    }
    const grouped = d
        ? d.ingredients.reduce((acc, ing) => {
              (acc[ing.component] = acc[ing.component] ?? []).push(ing);
              return acc;
          }, {})
        : {};
    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 160 }}
            >
                <Animated.View style={[{ height: HERO }, hero]}>
                    {d ? (
                        <DishImage uri={d.image_url} category={d.category.name} size="100%" radius={0} iconScale={0.5} />
                    ) : (
                        <Skeleton height={HERO} r={0} />
                    )}
                </Animated.View>

                <View style={styles.sheet}>
                    {!d ? (
                        <View style={{ gap: 12 }}>
                            <Skeleton width="70%" height={26} />
                            <Skeleton width="40%" />
                            <Skeleton height={80} />
                        </View>
                    ) : (
                        <Animated.View entering={FadeInDown.springify()} style={{ gap: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <Txt variant="small">{d.category.name}</Txt>
                                    <Txt variant="h1">{d.name}</Txt>
                                </View>
                                <Txt variant="h2" color={colors.primary}>
                                    {money(d.price)}
                                </Txt>
                            </View>

                            <View style={styles.stats}>
                                {[
                                    {
                                        icon: 'star',
                                        c: colors.gold,
                                        v: d.review_count ? num(d.avg_rating).toFixed(1) : 'New',
                                        l: `${d.review_count} reviews`,
                                    },
                                    {
                                        icon: 'clock-outline',
                                        c: colors.info,
                                        v: d.preparation_time_minutes ? `${d.preparation_time_minutes}m` : '–',
                                        l: 'Prep time',
                                    },
                                    {
                                        icon: 'account-group-outline',
                                        c: colors.success,
                                        v: String(d.serves_count),
                                        l: d.serves_count > 1 ? 'Serves' : 'Serving',
                                    },
                                    {
                                        icon: 'chili-mild',
                                        c: colors.primary,
                                        v: spiceLabel[d.spice_level]?.split(' ')[0] ?? '',
                                        l: 'Spice',
                                    },
                                ].map((s) => (
                                    <View key={s.l} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                                        <Icon name={s.icon} size={20} color={s.c} />
                                        <Txt variant="bodyMedium">{s.v}</Txt>
                                        <Txt variant="tiny">{s.l}</Txt>
                                    </View>
                                ))}
                            </View>

                            <Segmented
                                value={tab}
                                onChange={setTab}
                                items={[
                                    { value: 'about', label: 'Details' },
                                    { value: 'ingredients', label: 'Ingredients' },
                                    { value: 'reviews', label: 'Reviews' },
                                ]}
                            />

                            {tab === 'about' ? (
                                <Animated.View key="about" entering={FadeIn} style={{ gap: 14 }}>
                                    <Txt variant="body" color={colors.textMuted}>
                                        {d.description}
                                    </Txt>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                        <VegBadge veg={d.isVegetarian} vegan={d.isVegan} />
                                        <Chillies level={d.spice_level} />
                                        {d.specializations.map((s) => (
                                            <Pill key={s.id} label={s.name} fg={colors.textMuted} bg={colors.surfaceAlt} icon="chef-hat" />
                                        ))}
                                    </View>
                                    {d.allergens.length ? (
                                        <Card
                                            flat
                                            style={{
                                                backgroundColor: colors.warningSoft,
                                                borderColor: '#F6DDB0',
                                                flexDirection: 'row',
                                                gap: 10,
                                            }}
                                        >
                                            <Icon name="alert-outline" size={22} color={colors.warning} />
                                            <View style={{ flex: 1 }}>
                                                <Txt variant="bodyMedium">Contains allergens</Txt>
                                                <Txt variant="small">{d.allergens.join(' · ')}</Txt>
                                            </View>
                                        </Card>
                                    ) : null}
                                    {d.latestReviews.length ? (
                                        <View style={{ gap: 10 }}>
                                            <Txt variant="h3">Latest reviews</Txt>
                                            {d.latestReviews.map((r) => (
                                                <Card key={r.id} flat style={{ gap: 4 }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <Txt variant="bodyMedium">{r.reviewer}</Txt>
                                                        <Stars value={r.rating} size={13} />
                                                    </View>
                                                    {r.comment ? (
                                                        <Txt variant="small" color={colors.text}>
                                                            {r.comment}
                                                        </Txt>
                                                    ) : null}
                                                    <Txt variant="tiny">{ago(r.createdAt)}</Txt>
                                                </Card>
                                            ))}
                                        </View>
                                    ) : null}
                                    <Input
                                        label="Special instructions"
                                        icon="note-edit-outline"
                                        placeholder="e.g. less spicy, no spring onion"
                                        value={note}
                                        onChangeText={setNote}
                                        maxLength={300}
                                    />
                                </Animated.View>
                            ) : null}

                            {tab === 'ingredients' ? (
                                <Animated.View key="ing" entering={FadeIn} style={{ gap: 12 }}>
                                    {Object.entries(grouped).map(([component, ings]) => (
                                        <Card key={component} flat style={{ gap: 8 }}>
                                            <Txt variant="smallMedium" color={colors.primary}>
                                                {titleCase(component)}
                                            </Txt>
                                            {ings.map((ing) => (
                                                <View key={ing.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <View style={styles.dot} />
                                                    <Txt variant="body" style={{ flex: 1 }}>
                                                        {ing.name}
                                                    </Txt>
                                                    {ing.quantityRequired ? (
                                                        <Txt variant="small">{fmtQty(ing.quantityRequired, ing.unit)}</Txt>
                                                    ) : null}
                                                </View>
                                            ))}
                                        </Card>
                                    ))}
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        {[
                                            { ok: d.isVegetarian, l: 'Vegetarian' },
                                            { ok: d.isVegan, l: 'Vegan' },
                                            { ok: d.allergens.length === 0, l: 'Allergen free' },
                                        ].map((x) => (
                                            <View
                                                key={x.l}
                                                style={[styles.diet, { backgroundColor: x.ok ? colors.successSoft : colors.surfaceAlt }]}
                                            >
                                                <Icon
                                                    name={x.ok ? 'check-circle' : 'close-circle-outline'}
                                                    size={18}
                                                    color={x.ok ? colors.success : colors.textFaint}
                                                />
                                                <Txt variant="tiny" color={x.ok ? colors.success : colors.textMuted}>
                                                    {x.l}
                                                </Txt>
                                            </View>
                                        ))}
                                    </View>
                                </Animated.View>
                            ) : null}

                            {tab === 'reviews' ? (
                                <Animated.View key="rev" entering={FadeIn} style={{ gap: 12 }}>
                                    {reviews.data ? (
                                        <>
                                            <RatingSummaryCard summary={reviews.data.summary} />
                                            {reviews.data.items.length === 0 ? (
                                                <EmptyState
                                                    icon="comment-outline"
                                                    title="No reviews yet"
                                                    message="Order it and be the first to rate it."
                                                />
                                            ) : null}
                                            {reviews.data.items.map((r) => (
                                                <Card key={r.id} flat style={{ gap: 4 }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <Txt variant="bodyMedium">{r.reviewer}</Txt>
                                                        <Txt variant="tiny">{ago(r.createdAt)}</Txt>
                                                    </View>
                                                    <Stars value={r.rating} size={13} />
                                                    {r.comment ? (
                                                        <Txt variant="small" color={colors.text}>
                                                            {r.comment}
                                                        </Txt>
                                                    ) : null}
                                                </Card>
                                            ))}
                                        </>
                                    ) : (
                                        <Skeleton height={140} />
                                    )}
                                </Animated.View>
                            ) : null}
                        </Animated.View>
                    )}
                </View>
            </Animated.ScrollView>

            <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, bar]} />
                <IconButton icon="chevron-left" onPress={() => navigation.goBack()} />
                <Animated.View style={[{ flex: 1, alignItems: 'center' }, bar]}>
                    <Txt variant="h3" numberOfLines={1}>
                        {d?.name}
                    </Txt>
                </Animated.View>
                <IconButton icon="shopping-outline" badge={inCart || undefined} onPress={() => navigation.navigate('Cart')} />
            </View>

            {d ? (
                <BottomBar style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Stepper value={qty} onChange={setQty} min={1} max={20} size="md" />
                    <Button
                        style={{ flex: 1 }}
                        title={d.is_available ? `Add · ${money(num(d.price) * qty)}` : 'Not available'}
                        icon="cart-plus"
                        disabled={!d.is_available}
                        loading={add.isPending}
                        onPress={() =>
                            add.mutate(
                                { menuItemId: d.id, quantity: qty, specialInstructions: note.trim() || undefined, name: d.name },
                                { onSuccess: () => navigation.goBack() },
                            )
                        }
                    />
                </BottomBar>
            ) : null}
        </View>
    );
}
const styles = StyleSheet.create({
    sheet: { marginTop: -30, backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, minHeight: 500 },
    stats: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    top: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        gap: 10,
    },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
    diet: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: radius.lg },
});
