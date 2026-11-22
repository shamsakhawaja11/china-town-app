import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { menuApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { useCart } from '../../hooks/useCart';
import {
    Button,
    CheckboxGroup,
    ChipRow,
    EmptyState,
    IconButton,
    Input,
    ListSkeleton,
    RadioGroup,
    Screen,
    Sheet,
    Txt,
} from '../../components/ui';
import { MenuItemCard } from '../../components/MenuItemCard';
import { CartBar } from '../../components/CartBar';
const DEFAULT = { diet: [], spice: 'any', sort: 'name', allergens: [] };
const sortParams = (s) =>
    ({
        name: { sortBy: 'name', order: 'asc' },
        price_asc: { sortBy: 'price', order: 'asc' },
        price_desc: { sortBy: 'price', order: 'desc' },
        rating: { sortBy: 'rating', order: 'desc' },
        fast: { sortBy: 'preparationTimeMinutes', order: 'asc' },
    })[s];
function useDebounced(value, ms = 350) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}
export function MenuScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const searchRef = useRef(null);
    const { cart, add, setQty, qtyOf, lineOf, remove } = useCart();
    const [categoryId, setCategoryId] = useState('all');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState(DEFAULT);
    const [draft, setDraft] = useState(DEFAULT);
    const [sheet, setSheet] = useState(false);
    const q = useDebounced(search.trim());
    useEffect(() => {
        if (route.params?.categoryId) setCategoryId(route.params.categoryId);
        if (route.params?.focusSearch) setTimeout(() => searchRef.current?.focus(), 350);
    }, [route.params]);
    const categories = useQuery({ queryKey: ['categories'], queryFn: menuApi.categories });
    const allergens = useQuery({ queryKey: ['allergens'], queryFn: menuApi.allergens });
    const params = useMemo(
        () => ({
            categoryId: categoryId === 'all' ? undefined : categoryId,
            search: q || undefined,
            isVegetarian: filters.diet.includes('veg') || undefined,
            isVegan: filters.diet.includes('vegan') || undefined,
            spiceLevel: filters.spice === 'any' ? undefined : filters.spice,
            excludeAllergenIds: filters.allergens,
            ...sortParams(filters.sort),
        }),
        [categoryId, q, filters],
    );
    const items = useInfiniteQuery({
        queryKey: ['menu', params],
        queryFn: ({ pageParam }) => menuApi.items({ ...params, page: pageParam, limit: 20 }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    });
    const list = items.data?.pages.flatMap((p) => p.items) ?? [];
    const total = items.data?.pages[0]?.total ?? 0;
    const activeFilters =
        filters.diet.length + (filters.spice !== 'any' ? 1 : 0) + filters.allergens.length + (filters.sort !== 'name' ? 1 : 0);
    const changeQty = (menuItemId, qty) => {
        const line = lineOf(menuItemId);
        if (!line) return;
        if (qty <= 0) remove.mutate(line.id);
        else setQty.mutate({ lineId: line.id, quantity: qty });
    };
    return (
        <Screen>
            <View style={{ paddingHorizontal: 20, paddingTop: 6, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <Txt variant="small">Chinatown</Txt>
                        <Txt variant="h1">Our menu</Txt>
                    </View>
                    <IconButton icon="shopping-outline" badge={cart?.itemCount} onPress={() => nav.navigate('Cart')} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    <Input
                        ref={searchRef}
                        containerStyle={{ flex: 1 }}
                        icon="magnify"
                        placeholder="Search dumplings, noodles…"
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                        right={search ? <IconButton icon="close" size={26} bg="transparent" onPress={() => setSearch('')} /> : null}
                    />
                    <View>
                        <IconButton
                            icon="tune-variant"
                            size={52}
                            bg={activeFilters ? colors.primary : colors.surface}
                            color={activeFilters ? colors.white : colors.text}
                            badge={activeFilters || undefined}
                            onPress={() => {
                                setDraft(filters);
                                setSheet(true);
                            }}
                        />
                    </View>
                </View>
            </View>

            <View style={{ marginTop: 14 }}>
                <ChipRow
                    value={categoryId}
                    onChange={setCategoryId}
                    items={[
                        { value: 'all', label: 'All', icon: 'silverware-variant' },
                        ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
                    ]}
                />
            </View>

            {items.isLoading ? (
                <ListSkeleton rows={5} height={116} />
            ) : items.isError ? (
                <EmptyState
                    tone="error"
                    title="Couldn't load the menu"
                    message="Check your connection and try again."
                    action="Retry"
                    onAction={() => items.refetch()}
                />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => items.hasNextPage && !items.isFetchingNextPage && items.fetchNextPage()}
                    refreshControl={
                        <RefreshControl
                            refreshing={items.isRefetching && !items.isFetchingNextPage}
                            onRefresh={() => items.refetch()}
                            tintColor={colors.primary}
                        />
                    }
                    ListHeaderComponent={
                        <Txt variant="small">
                            {total} dishes{q ? ` for “${q}”` : ''}
                        </Txt>
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="food-off-outline"
                            title="No dishes found"
                            message="Try another search or clear the filters."
                            action={activeFilters ? 'Clear filters' : undefined}
                            onAction={() => setFilters(DEFAULT)}
                        />
                    }
                    ListFooterComponent={
                        items.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ margin: 16 }} /> : null
                    }
                    renderItem={({ item, index }) => (
                        <Animated.View
                            entering={FadeInDown.delay((index % 20) * 40)
                                .springify()
                                .damping(16)}
                            layout={LinearTransition}
                        >
                            <MenuItemCard
                                item={item}
                                qty={qtyOf(item.id)}
                                onPress={() => nav.navigate('ItemDetail', { id: item.id })}
                                onAdd={() => add.mutate({ menuItemId: item.id, quantity: 1, name: item.name })}
                                onChangeQty={(qty) => changeQty(item.id, qty)}
                            />
                        </Animated.View>
                    )}
                />
            )}

            <CartBar count={cart?.itemCount ?? 0} total={cart?.total ?? 0} onPress={() => nav.navigate('Cart')} />

            <Sheet
                visible={sheet}
                onClose={() => setSheet(false)}
                title="Filters"
                footer={
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Button title="Reset" variant="outline" style={{ flex: 1 }} onPress={() => setDraft(DEFAULT)} />
                        <Button
                            title="Show dishes"
                            style={{ flex: 2 }}
                            onPress={() => {
                                setFilters(draft);
                                setSheet(false);
                            }}
                        />
                    </View>
                }
            >
                <Txt variant="h3">Dietary</Txt>
                <CheckboxGroup
                    columns={2}
                    values={draft.diet}
                    onChange={(diet) => setDraft((d) => ({ ...d, diet }))}
                    options={[
                        { value: 'veg', label: 'Vegetarian' },
                        { value: 'vegan', label: 'Vegan' },
                    ]}
                />
                <Txt variant="h3">Sort by</Txt>
                <RadioGroup
                    card={false}
                    value={draft.sort}
                    onChange={(sort) => setDraft((d) => ({ ...d, sort }))}
                    options={[
                        { value: 'name', label: 'Name (A–Z)' },
                        { value: 'rating', label: 'Top rated' },
                        { value: 'price_asc', label: 'Price: low to high' },
                        { value: 'price_desc', label: 'Price: high to low' },
                        { value: 'fast', label: 'Quickest to prepare' },
                    ]}
                />
                <Txt variant="h3">Spice level</Txt>
                <RadioGroup
                    card={false}
                    value={draft.spice}
                    onChange={(spice) => setDraft((d) => ({ ...d, spice }))}
                    options={[
                        { value: 'any', label: 'Any' },
                        { value: 'none', label: 'Not spicy' },
                        { value: 'mild', label: '🌶 Mild' },
                        { value: 'medium', label: '🌶🌶 Medium' },
                        { value: 'hot', label: '🌶🌶🌶 Hot' },
                        { value: 'extra_hot', label: '🔥 Extra hot' },
                    ]}
                />
                <Txt variant="h3">Hide dishes containing</Txt>
                <CheckboxGroup
                    columns={2}
                    values={draft.allergens}
                    onChange={(allergens) => setDraft((d) => ({ ...d, allergens }))}
                    options={(allergens.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
                />
            </Sheet>
        </Screen>
    );
}
