import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { colors, radius, shadow } from '../theme';
import { money, num } from '../utils/format';
import { spiceLevel } from '../utils/status';
import { Card, DishImage, Icon, PressableScale, Stepper, Txt } from './ui';
export function VegBadge({ vegan, veg }) {
    if (!vegan && !veg) return null;
    return (
        <View style={[styles.veg, { borderColor: colors.success }]}>
            <Icon name="leaf" size={11} color={colors.success} />
            <Txt variant="tiny" color={colors.success}>
                {vegan ? 'Vegan' : 'Veg'}
            </Txt>
        </View>
    );
}
export function Chillies({ level }) {
    const n = spiceLevel[level] ?? 0;
    if (!n) return null;
    return (
        <View style={{ flexDirection: 'row' }}>
            {Array.from({ length: n }).map((_, i) => (
                <Icon key={i} name="chili-mild" size={13} color={colors.primary} />
            ))}
        </View>
    );
}
export function AddControl({ qty, onAdd, onChange, disabled }) {
    if (qty > 0) {
        return (
            <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut}>
                <Stepper value={qty} onChange={onChange} size="sm" dark />
            </Animated.View>
        );
    }
    return (
        <Animated.View entering={ZoomIn.springify()}>
            <PressableScale
                haptic
                disabled={disabled}
                onPress={onAdd}
                style={[styles.add, disabled && { backgroundColor: colors.textFaint }]}
            >
                <Icon name="plus" size={20} color={colors.white} />
            </PressableScale>
        </Animated.View>
    );
}
export function MenuItemCard({ item, qty, onPress, onAdd, onChangeQty }) {
    const rating = num(item.avg_rating);
    return (
        <Card onPress={onPress} style={{ flexDirection: 'row', gap: 12, padding: 12, opacity: item.is_available ? 1 : 0.55 }}>
            <View>
                <DishImage uri={item.image_url} category={item.category.name} size={92} radius={18} />
                {!item.is_available ? (
                    <View style={styles.soldOut}>
                        <Txt variant="tiny" color={colors.white}>
                            Sold out
                        </Txt>
                    </View>
                ) : null}
            </View>
            <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Txt variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                        {item.name}
                    </Txt>
                    <Chillies level={item.spice_level} />
                </View>
                <Txt variant="small" numberOfLines={2}>
                    {item.description}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    {item.review_count > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Icon name="star" size={13} color={colors.gold} />
                            <Txt variant="tiny" color={colors.text}>
                                {rating.toFixed(1)}
                            </Txt>
                            <Txt variant="tiny">({item.review_count})</Txt>
                        </View>
                    ) : null}
                    {item.preparation_time_minutes ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Icon name="clock-outline" size={12} color={colors.textMuted} />
                            <Txt variant="tiny">{item.preparation_time_minutes} min</Txt>
                        </View>
                    ) : null}
                    <VegBadge veg={item.isVegetarian} vegan={item.isVegan} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <Txt variant="price">{money(item.price)}</Txt>
                    <AddControl qty={qty} disabled={!item.is_available} onAdd={onAdd} onChange={onChangeQty} />
                </View>
            </View>
        </Card>
    );
}
export function DishTile({ item, onPress, onAdd }) {
    return (
        <PressableScale onPress={onPress} scaleTo={0.97} style={[styles.tile, shadow(1)]}>
            <DishImage uri={item.image_url} category={item.category.name} size={150} radius={18} style={{ width: '100%' }} />
            {num(item.avg_rating) > 0 ? (
                <View style={styles.ratingFloat}>
                    <Icon name="star" size={12} color={colors.gold} />
                    <Txt variant="tiny" color={colors.text}>
                        {num(item.avg_rating).toFixed(1)}
                    </Txt>
                </View>
            ) : null}
            <View style={{ padding: 10, gap: 2 }}>
                <Txt variant="bodyMedium" numberOfLines={1}>
                    {item.name}
                </Txt>
                <Txt variant="tiny" numberOfLines={1}>
                    {item.category.name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Txt variant="price" style={{ fontSize: 14 }}>
                        {money(item.price)}
                    </Txt>
                    <PressableScale haptic onPress={onAdd} style={[styles.add, { width: 30, height: 30 }]}>
                        <Icon name="plus" size={18} color={colors.white} />
                    </PressableScale>
                </View>
            </View>
        </PressableScale>
    );
}
const styles = StyleSheet.create({
    veg: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
    add: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    soldOut: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        right: 6,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 8,
        paddingVertical: 2,
    },
    tile: {
        width: 160,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    ratingFloat: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: colors.white,
        borderRadius: 999,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
});
