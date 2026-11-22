import React, { useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    Extrapolation,
    FadeIn,
    FadeInDown,
    FadeInRight,
    ZoomIn,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { menuApi, notificationsApi, ordersApi, restaurantApi, reviewsApi } from '../../api/endpoints';
import { assetUri } from '../../api/client';
import { colors, fonts, radius, shadow } from '../../theme';
import { ago, compact, money, openState } from '../../utils/format';
import { dishVisual } from '../../utils/dishVisual';
import { orderStatus } from '../../utils/status';
import { useCart } from '../../hooks/useCart';
import {
    Appear,
    Card,
    DishImage,
    EmptyState,
    Icon,
    IconButton,
    Pill,
    PressableScale,
    PulseDot,
    SectionTitle,
    Skeleton,
    Stars,
    Txt,
} from '../../components/ui';
import { CartBar } from '../../components/CartBar';

const HERO = 270;
const GRID_GAP = 10;

function fmtClock(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function InfoTile({ title, sub, color, index, onPress }) {
    return (
        <Animated.View entering={FadeInDown.delay(220 + index * 70).springify().damping(15)} style={{ flex: 1 }}>
            <PressableScale haptic onPress={onPress} disabled={!onPress} style={[styles.infoTile, shadow(1)]}>
                <Txt variant="bodyMedium" color={color ?? colors.text} style={{ fontWeight: '700' }} numberOfLines={1}>
                    {title}
                </Txt>
                <Txt variant="tiny" numberOfLines={1}>
                    {sub}
                </Txt>
            </PressableScale>
        </Animated.View>
    );
}

function QuickTile({ item, index }) {
    const [failed, setFailed] = useState(false);
    const photo = assetUri(item.photo);
    return (
        <Animated.View entering={FadeInDown.delay(260 + index * 70).springify().damping(15)} style={{ flex: 1 }}>
            <PressableScale haptic onPress={item.onPress} scaleTo={0.95} style={[styles.quick, shadow(2)]}>
                {photo && !failed ? (
                    <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />
                ) : (
                    <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
                        <Icon name={item.icon} size={64} color="rgba(255,255,255,0.18)" style={styles.quickWatermark} />
                    </LinearGradient>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(20,6,4,0.35)', 'rgba(20,6,4,0.88)']}
                    locations={[0.25, 0.55, 1]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.quickBadge}>
                    <Icon name={item.icon} size={15} color={colors.primary} />
                </View>
                <View style={{ gap: 1 }}>
                    <Txt variant="bodyMedium" color={colors.white} style={{ fontWeight: '700' }} numberOfLines={1}>
                        {item.label}
                    </Txt>
                    <Txt variant="tiny" color="#F1D9D0" numberOfLines={1}>
                        {item.sub}
                    </Txt>
                </View>
            </PressableScale>
        </Animated.View>
    );
}

const categorySlug = (name) =>
    String(name ?? '')
        .toLowerCase()
        .replace(/&/g, ' ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

function CategoryTile({ item, index, onPress }) {
    const [failed, setFailed] = useState(false);
    const v = dishVisual(item.name);
    const photo = assetUri(`/uploads/category-${categorySlug(item.name)}.jpg`);
    return (
        <Animated.View entering={FadeInRight.delay(index * 60).springify()}>
            <PressableScale haptic onPress={onPress} scaleTo={0.94} style={styles.cat}>
                <View style={[styles.catPhoto, shadow(1)]}>
                    {!failed ? (
                        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />
                    ) : (
                        <LinearGradient colors={v.colors} style={[StyleSheet.absoluteFill, styles.catCenter]}>
                            <Icon name={v.icon} size={30} color={colors.white} />
                        </LinearGradient>
                    )}
                </View>
                <Txt variant="smallMedium" color={colors.text} center numberOfLines={1} style={{ fontWeight: '700' }}>
                    {item.name}
                </Txt>
            </PressableScale>
        </Animated.View>
    );
}

function PopularDish({ item, size, index, onPress }) {
    return (
        <Animated.View entering={FadeInDown.delay(80 + index * 60).springify().damping(15)} style={{ width: size }}>
            <PressableScale onPress={onPress} scaleTo={0.95} style={{ gap: 6 }}>
                <View style={[styles.dishImg, shadow(1)]}>
                    <DishImage uri={item.image_url} category={item.category?.name} size={size} radius={16} />
                    {Number(item.avg_rating) > 0 ? (
                        <View style={styles.dishRating}>
                            <Icon name="star" size={10} color={colors.gold} />
                            <Txt variant="tiny" color={colors.white}>
                                {Number(item.avg_rating).toFixed(1)}
                            </Txt>
                        </View>
                    ) : null}
                </View>
                <Txt variant="smallMedium" color={colors.text} style={{ fontWeight: '700' }} numberOfLines={1}>
                    {item.name}
                </Txt>
                <Txt variant="smallMedium" color={colors.primary} style={{ fontWeight: '700', marginTop: -4 }}>
                    {money(item.price)}
                </Txt>
            </PressableScale>
        </Animated.View>
    );
}

export function HomeScreen() {
    const nav = useNavigation();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { cart } = useCart();
    const restaurant = useQuery({ queryKey: ['restaurant'], queryFn: restaurantApi.get });
    const tables = useQuery({ queryKey: ['tables', 'live'], queryFn: restaurantApi.liveTables, refetchInterval: 30000 });
    const categories = useQuery({ queryKey: ['categories'], queryFn: menuApi.categories });
    const popular = useQuery({
        queryKey: ['menu', 'popular'],
        queryFn: () => menuApi.items({ sortBy: 'rating', order: 'desc', limit: 10 }),
    });
    const reviews = useQuery({
        queryKey: ['reviews', 'restaurant', 'home'],
        queryFn: () => reviewsApi.restaurant({ limit: 5, withComment: true }),
    });
    const active = useQuery({ queryKey: ['orders', 'active'], queryFn: () => ordersApi.mine('active'), refetchInterval: 20000 });
    const pending = useQuery({ queryKey: ['reviews', 'pending'], queryFn: reviewsApi.pending });
    const unread = useQuery({ queryKey: ['notifications', 'unread'], queryFn: notificationsApi.unread, refetchInterval: 30000 });

    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((e) => {
        scrollY.value = e.contentOffset.y;
    });
    const heroStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(scrollY.value, [-100, 0, HERO], [-50, 0, HERO * 0.45], Extrapolation.CLAMP) },
            { scale: interpolate(scrollY.value, [-150, 0], [1.35, 1], Extrapolation.CLAMP) },
        ],
    }));
    const barStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [HERO - 120, HERO - 60], [0, 1], Extrapolation.CLAMP),
    }));
    const glassStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [HERO - 120, HERO - 60], [1, 0], Extrapolation.CLAMP),
    }));

    const r = restaurant.data;
    const open = openState(r?.opening_time, r?.closing_time);
    const tableList = tables.data?.tables ?? [];
    const freeTables = tableList.filter((t) => t.isAvailable).length;
    const cartCount = cart?.itemCount ?? 0;
    const tileSize = (width - 40 - GRID_GAP * 2) / 3;
    const dishes = (popular.data?.items ?? []).slice(0, 6);

    const refreshing = restaurant.isRefetching || popular.isRefetching;
    const refresh = () => {
        restaurant.refetch();
        tables.refetch();
        categories.refetch();
        popular.refetch();
        reviews.refetch();
        active.refetch();
        pending.refetch();
    };
    const activeOrder = active.data?.items[0];
    const toReview = pending.data?.[0];
    const quick = [
        {
            icon: 'silverware-fork-knife',
            label: 'Dine in',
            sub: 'Pick your table',
            photo: '/uploads/dine-in.jpg',
            colors: ['#E8503F', colors.primaryDark],
            onPress: () => nav.navigate('TablePicker', { mode: 'walkin' }),
        },
        {
            icon: 'shopping-outline',
            label: 'Takeaway',
            sub: 'Order & pick up',
            photo: '/uploads/takeaway.jpg',
            colors: ['#F0B44C', '#C9771B'],
            onPress: () => nav.navigate('Tabs', { screen: 'Menu' }),
        },
        {
            icon: 'calendar-star',
            label: 'Book table',
            sub: 'Reserve ahead',
            photo: '/uploads/book-table.jpg',
            colors: ['#5A140D', '#2A0B07'],
            onPress: () => nav.navigate('TablePicker', { mode: 'booking' }),
        },
    ];

    const fabBottom = useSharedValue(16);
    React.useEffect(() => {
        fabBottom.value = withSpring(cartCount > 0 ? 16 + 58 + 12 : 16, { damping: 16, stiffness: 160 });
    }, [cartCount, fabBottom]);
    const fabStyle = useAnimatedStyle(() => ({ bottom: fabBottom.value }));

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: cartCount > 0 ? 180 : 110 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={colors.white}
                        progressViewOffset={insets.top + 40}
                    />
                }
            >
                <Animated.View style={[{ height: HERO }, heroStyle]}>
                    {r?.image_url ? (
                        <Animated.Image
                            entering={FadeIn.duration(500)}
                            source={{ uri: assetUri(r.image_url) }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={['#5A140D', colors.primaryDark, '#E0583F']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        >
                            {['noodles', 'food-variant', 'bowl-mix', 'pot-steam', 'cup', 'food-drumstick'].map((ic, i) => (
                                <Icon
                                    key={ic}
                                    name={ic}
                                    size={70 + (i % 3) * 18}
                                    color="rgba(255,255,255,0.08)"
                                    style={{ position: 'absolute', left: (i * 73) % 330, top: 40 + ((i * 97) % 200) }}
                                />
                            ))}
                        </LinearGradient>
                    )}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.35)', 'transparent', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <View style={styles.content}>
                    {restaurant.isLoading ? (
                        <View style={{ gap: 12 }}>
                            <Skeleton height={56} r={16} />
                            <Skeleton height={20} width="70%" />
                            <Skeleton height={60} r={16} />
                        </View>
                    ) : r ? (
                        <View style={{ gap: 14 }}>
                            <View style={styles.titleRow}>
                                <Animated.View entering={ZoomIn.delay(80).springify().damping(12)}>
                                    <LinearGradient colors={['#E8503F', colors.primaryDark]} style={[styles.logo, shadow(2)]}>
                                        <Icon name="noodles" size={28} color={colors.white} />
                                    </LinearGradient>
                                </Animated.View>
                                <Animated.View entering={FadeInRight.delay(120).springify()} style={{ flex: 1 }}>
                                    <Txt
                                        numberOfLines={1}
                                        style={{ fontFamily: fonts.display, fontWeight: '700', fontSize: 30, lineHeight: 38, color: colors.text }}
                                    >
                                        {r.name ?? 'Chinatown'}
                                    </Txt>
                                </Animated.View>
                                <Animated.View entering={ZoomIn.delay(200).springify()}>
                                    <PressableScale haptic onPress={() => nav.navigate('RestaurantReviews')} style={[styles.ratingPill, shadow(1)]}>
                                        <Icon name="star" size={16} color={colors.gold} />
                                        <Txt variant="bodyMedium" style={{ fontWeight: '700' }}>
                                            {Number(r.rating ?? 0).toFixed(1)}
                                        </Txt>
                                        <Txt variant="small">({compact(r.review_count ?? 0)})</Txt>
                                    </PressableScale>
                                </Animated.View>
                            </View>

                            <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.addressRow}>
                                <Icon name="map-marker-outline" size={18} color={colors.textMuted} />
                                <Txt variant="body" color={colors.textMuted} style={{ flex: 1 }} numberOfLines={1}>
                                    {r.address}
                                </Txt>
                                <PressableScale haptic onPress={() => nav.navigate('Map')} hitSlop={8} style={styles.mapLink}>
                                    <Icon name="navigation-variant-outline" size={16} color={colors.primary} />
                                    <Txt variant="bodyMedium" color={colors.primary} style={{ fontWeight: '700' }}>
                                        View map
                                    </Txt>
                                </PressableScale>
                            </Animated.View>

                            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 12 }}>
                                <InfoTile
                                    index={0}
                                    title={open.open ? 'Open now' : 'Closed'}
                                    sub={open.open ? `Until ${fmtClock(r.closing_time)}` : `Opens ${fmtClock(r.opening_time)}`}
                                    color={open.open ? colors.success : colors.danger}
                                />
                                <InfoTile
                                    index={1}
                                    title={`${tableList.length || '–'} tables`}
                                    sub={tables.data ? `${freeTables} free now · Indoor seating` : 'Indoor seating'}
                                    onPress={() => nav.navigate('TablePicker', { mode: 'walkin' })}
                                />
                            </View>
                        </View>
                    ) : null}

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {quick.map((q, i) => (
                            <QuickTile key={q.label} item={q} index={i} />
                        ))}
                    </View>

                    {r?.description ? (
                        <Animated.View entering={FadeInDown.delay(300).springify()} style={{ gap: 6 }}>
                            <Txt variant="h3">About</Txt>
                            <Txt variant="body" color={colors.textMuted}>
                                {r.description}
                            </Txt>
                        </Animated.View>
                    ) : null}

                    <View>
                        <SectionTitle title="Popular dishes" action="Full menu" onAction={() => nav.navigate('Tabs', { screen: 'Menu' })} />
                        {popular.isLoading ? (
                            <View style={styles.grid}>
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} width={tileSize} height={tileSize + 40} r={16} />
                                ))}
                            </View>
                        ) : popular.isError ? (
                            <EmptyState tone="error" title="Menu didn't load" action="Retry" onAction={() => popular.refetch()} />
                        ) : (
                            <View style={styles.grid}>
                                {dishes.map((item, i) => (
                                    <PopularDish
                                        key={item.id}
                                        item={item}
                                        index={i}
                                        size={tileSize}
                                        onPress={() => nav.navigate('ItemDetail', { id: item.id })}
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    {activeOrder ? (
                        <Appear index={1}>
                            <PressableScale
                                onPress={() => nav.navigate('OrderTracking', { id: activeOrder.id })}
                                style={[styles.liveOrder, shadow(2)]}
                            >
                                <LinearGradient colors={[colors.dark, '#3B1712']} style={StyleSheet.absoluteFill} />
                                <View style={styles.liveIcon}>
                                    <Icon name={orderStatus[activeOrder.status]?.icon ?? 'receipt'} size={24} color={colors.gold} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <PulseDot color={colors.gold} size={7} />
                                        <Txt variant="tiny" color={colors.gold}>
                                            LIVE ORDER #{activeOrder.orderNumber}
                                        </Txt>
                                    </View>
                                    <Txt variant="h3" color={colors.white}>
                                        {orderStatus[activeOrder.status]?.label}
                                    </Txt>
                                    <Txt variant="small" color="#CBB5AC">
                                        {activeOrder.itemCount} items · {money(activeOrder.total)}
                                    </Txt>
                                </View>
                                <Icon name="chevron-right" size={24} color={colors.white} />
                            </PressableScale>
                        </Appear>
                    ) : null}

                    {toReview ? (
                        <Appear index={2}>
                            <Card
                                onPress={() => nav.navigate('RateOrder', { orderId: toReview.orderId })}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                    backgroundColor: colors.goldSoft,
                                    borderColor: '#F3DDB0',
                                }}
                            >
                                <Icon name="star-face" size={32} color={colors.gold} />
                                <View style={{ flex: 1 }}>
                                    <Txt variant="bodyMedium">How was order #{toReview.orderNumber}?</Txt>
                                    <Txt variant="small">Rate the food & service, it takes 20 seconds.</Txt>
                                </View>
                                <Icon name="chevron-right" size={22} color={colors.gold} />
                            </Card>
                        </Appear>
                    ) : null}

                    <View>
                        <SectionTitle title="Explore the menu" action="See all" onAction={() => nav.navigate('Tabs', { screen: 'Menu' })} />
                        {categories.isLoading ? (
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {[0, 1, 2, 3].map((i) => (
                                    <Skeleton key={i} width={92} height={116} r={20} />
                                ))}
                            </View>
                        ) : (
                            <FlatList
                                horizontal
                                data={categories.data ?? []}
                                keyExtractor={(c) => c.id}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 10 }}
                                renderItem={({ item, index }) => (
                                    <CategoryTile
                                        item={item}
                                        index={index}
                                        onPress={() => nav.navigate('Tabs', { screen: 'Menu', params: { categoryId: item.id } })}
                                    />
                                )}
                            />
                        )}
                    </View>

                    <View>
                        <SectionTitle title="What guests say" action="All reviews" onAction={() => nav.navigate('RestaurantReviews')} />
                        <FlatList
                            horizontal
                            data={reviews.data?.items ?? []}
                            keyExtractor={(i) => i.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 12, paddingBottom: 6 }}
                            renderItem={({ item, index }) => (
                                <Animated.View entering={FadeInRight.delay(index * 70).springify()}>
                                    <Card style={{ width: 260, gap: 6 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Txt variant="bodyMedium">{item.reviewer}</Txt>
                                            <Txt variant="tiny">{ago(item.createdAt)}</Txt>
                                        </View>
                                        <Stars value={item.rating} size={14} />
                                        <Txt variant="small" color={colors.text} numberOfLines={3}>
                                            {item.comment}
                                        </Txt>
                                        <Pill
                                            label={item.orderType === 'takeaway' ? 'Takeaway' : 'Dine-in'}
                                            fg={colors.textMuted}
                                            bg={colors.surfaceAlt}
                                        />
                                    </Card>
                                </Animated.View>
                            )}
                        />
                    </View>
                </View>
            </Animated.ScrollView>

            <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, shadow(1), barStyle]} />
                <Animated.View style={[{ flex: 1 }, barStyle]}>
                    <Txt variant="h3">{r?.name ?? 'Chinatown'}</Txt>
                </Animated.View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View>
                        <Animated.View style={[StyleSheet.absoluteFill, styles.glassBtn, glassStyle]} />
                        <IconButton
                            icon="magnify"
                            bg="transparent"
                            onPress={() => nav.navigate('Tabs', { screen: 'Menu', params: { focusSearch: true } })}
                        />
                    </View>
                    <View>
                        <Animated.View style={[StyleSheet.absoluteFill, styles.glassBtn, glassStyle]} />
                        <IconButton
                            icon="bell-outline"
                            bg="transparent"
                            badge={unread.data?.unread}
                            onPress={() => nav.navigate('Notifications')}
                        />
                    </View>
                </View>
            </View>

            {r ? (
                <Animated.View entering={ZoomIn.delay(500).springify().damping(13)} style={[styles.fabWrap, fabStyle]}>
                    <PressableScale haptic onPress={() => nav.navigate('RestaurantReviews')} style={[styles.fab, shadow(3)]}>
                        <View style={styles.fabIcon}>
                            <Icon name="message-star-outline" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Txt variant="bodyMedium" style={{ fontWeight: '700' }}>
                                See reviews
                            </Txt>
                            <Txt variant="tiny">
                                {Number(r.review_count ?? 0).toLocaleString()} {Number(r.review_count) === 1 ? 'review' : 'reviews'}
                            </Txt>
                        </View>
                    </PressableScale>
                </Animated.View>
            ) : null}

            <CartBar count={cartCount} total={cart?.total ?? 0} onPress={() => nav.navigate('Cart')} />
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        marginTop: -26,
        backgroundColor: colors.bg,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        paddingTop: 22,
        gap: 22,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logo: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surface,
        paddingHorizontal: 12,
        height: 36,
        borderRadius: radius.pill,
    },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    mapLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoTile: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        gap: 2,
    },
    quick: {
        height: 128,
        borderRadius: radius.xl,
        overflow: 'hidden',
        padding: 10,
        justifyContent: 'space-between',
        backgroundColor: colors.surfaceAlt,
    },
    quickBadge: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickWatermark: { position: 'absolute', right: -8, top: 18 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_GAP, rowGap: 16 },
    dishImg: { borderRadius: 16, backgroundColor: colors.surface },
    dishRating: {
        position: 'absolute',
        top: 6,
        left: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: radius.pill,
    },
    cat: { width: 92, alignItems: 'center', gap: 8 },
    catPhoto: { width: 92, height: 92, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
    catCenter: { alignItems: 'center', justifyContent: 'center' },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    glassBtn: { borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)' },
    liveOrder: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.xl, overflow: 'hidden' },
    liveIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(230,169,58,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabWrap: { position: 'absolute', right: 16 },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.surface,
        paddingLeft: 8,
        paddingRight: 18,
        height: 56,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    fabIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
});