import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    interpolateColor,
    LinearTransition,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    ZoomIn,
    ZoomOut,
} from 'react-native-reanimated';
import { colors, radius, shadow } from '../../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Text';
export function Stepper({ value, onChange, min = 0, max = 50, size = 'md', dark, step = 1, format }) {
    const d = size === 'lg' ? 44 : size === 'md' ? 34 : 28;
    const btn = (icon, disabled, next) => (
        <PressableScale
            haptic
            disabled={disabled}
            onPress={() => onChange(Math.round(next * 1000) / 1000)}
            style={{
                width: d,
                height: d,
                borderRadius: d / 2,
                backgroundColor: dark ? colors.primary : colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled ? 0.4 : 1,
            }}
        >
            <Icon name={icon} size={d * 0.5} color={dark ? colors.white : colors.primary} />
        </PressableScale>
    );
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: size === 'lg' ? 18 : 10 }}>
            {btn('minus', value <= min, Math.max(min, value - step))}
            <View style={{ minWidth: size === 'lg' ? 44 : 22, alignItems: 'center', overflow: 'hidden' }}>
                <Animated.View key={value} entering={ZoomIn.springify().damping(14)} exiting={ZoomOut.duration(120)}>
                    <Txt variant={size === 'lg' ? 'h1' : 'h3'}>{format ? format(value) : value}</Txt>
                </Animated.View>
            </View>
            {btn('plus', value >= max, Math.min(max, value + step))}
        </View>
    );
}
export function Stars({ value, onChange, size = 16, gap = 2, color = colors.gold }) {
    return (
        <View style={{ flexDirection: 'row', gap }}>
            {[1, 2, 3, 4, 5].map((i) => {
                const icon = value >= i ? 'star' : value >= i - 0.5 ? 'star-half-full' : 'star-outline';
                const star = <Icon name={icon} size={size} color={value >= i - 0.5 ? color : colors.textFaint} />;
                if (!onChange) return <View key={i}>{star}</View>;
                return (
                    <PressableScale key={i} haptic scaleTo={0.8} onPress={() => onChange(i)}>
                        <BounceOnActive active={value >= i} delay={(i - 1) * 40}>
                            {star}
                        </BounceOnActive>
                    </PressableScale>
                );
            })}
        </View>
    );
}
function BounceOnActive({ active, children, delay }) {
    const s = useSharedValue(1);
    useEffect(() => {
        if (active) {
            const t = setTimeout(() => {
                s.value = withSequence(withSpring(1.35, { damping: 5, stiffness: 400 }), withSpring(1, { damping: 9 }));
            }, delay);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [active, delay, s]);
    const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
    return <Animated.View style={style}>{children}</Animated.View>;
}
export function Toggle({ value, onChange, disabled }) {
    const p = useSharedValue(value ? 1 : 0);
    useEffect(() => {
        p.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 220 });
    }, [value, p]);
    const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], ['#E4D7D0', colors.success]) }));
    const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 20 }] }));
    return (
        <PressableScale haptic disabled={disabled} onPress={() => onChange(!value)} style={{ opacity: disabled ? 0.5 : 1 }}>
            <Animated.View style={[styles.track, track]}>
                <Animated.View style={[styles.knob, knob]} />
            </Animated.View>
        </PressableScale>
    );
}
export function Segmented({ items, value, onChange, style }) {
    const index = Math.max(
        0,
        items.findIndex((i) => i.value === value),
    );
    const [w, setW] = React.useState(0);
    const x = useSharedValue(0);
    useEffect(() => {
        x.value = withSpring((w / items.length) * index, { damping: 18, stiffness: 180 });
    }, [index, w, items.length, x]);
    const ind = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
    return (
        <View style={[styles.seg, style]} onLayout={(e) => setW(e.nativeEvent.layout.width - 8)}>
            {w > 0 ? <Animated.View style={[styles.segInd, { width: w / items.length }, ind]} /> : null}
            {items.map((i) => {
                const active = i.value === value;
                return (
                    <PressableScale key={i.value} haptic scaleTo={0.95} onPress={() => onChange(i.value)} style={styles.segItem}>
                        <Txt variant="smallMedium" color={active ? colors.white : colors.textMuted} numberOfLines={1}>
                            {i.label}
                            {i.count !== undefined ? ` ${i.count}` : ''}
                        </Txt>
                    </PressableScale>
                );
            })}
        </View>
    );
}
export function Avatar({ name, size = 44, color = colors.primary }) {
    const initials = (name ?? '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('');
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color + '22',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Txt variant={size > 56 ? 'h1' : 'h3'} color={color}>
                {initials}
            </Txt>
        </View>
    );
}
export function Fab({ icon = 'plus', onPress, label }) {
    return (
        <Animated.View entering={ZoomIn.springify().delay(300)} exiting={FadeOut} layout={LinearTransition} style={styles.fabWrap}>
            <PressableScale
                haptic
                onPress={onPress}
                style={[styles.fab, shadow(3), label ? { paddingHorizontal: 20, width: undefined } : null]}
            >
                <Icon name={icon} size={24} color={colors.white} />
                {label ? (
                    <Txt variant="button" color={colors.white}>
                        {label}
                    </Txt>
                ) : null}
            </PressableScale>
        </Animated.View>
    );
}
export function Divider({ dashed, style }) {
    return (
        <View
            style={[
                { height: 0, borderTopWidth: 1, borderColor: colors.border, borderStyle: dashed ? 'dashed' : 'solid', marginVertical: 12 },
                style,
            ]}
        />
    );
}
export function KV({ label, value, bold, color, big }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
            <Txt variant={bold ? 'bodyMedium' : 'body'} color={bold ? colors.text : colors.textMuted}>
                {label}
            </Txt>
            <Txt variant={big ? 'h2' : bold ? 'h3' : 'bodyMedium'} color={color}>
                {value}
            </Txt>
        </View>
    );
}
export function SectionTitle({ title, action, onAction, style }) {
    return (
        <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, style]}>
            <Txt variant="h3">{title}</Txt>
            {action ? (
                <PressableScale onPress={onAction} hitSlop={8}>
                    <Txt variant="smallMedium" color={colors.primary}>
                        {action}
                    </Txt>
                </PressableScale>
            ) : null}
        </View>
    );
}
export function ListRow({ icon, title, subtitle, onPress, right, danger, tint }) {
    const c = danger ? colors.danger : (tint ?? colors.primary);
    return (
        <PressableScale scaleTo={0.98} onPress={onPress} style={styles.listRow}>
            <View style={[styles.listIcon, { backgroundColor: c + '18' }]}>
                <Icon name={icon} size={20} color={c} />
            </View>
            <View style={{ flex: 1 }}>
                <Txt variant="bodyMedium" color={danger ? colors.danger : colors.text}>
                    {title}
                </Txt>
                {subtitle ? <Txt variant="small">{subtitle}</Txt> : null}
            </View>
            {right ?? <Icon name="chevron-right" size={22} color={colors.textFaint} />}
        </PressableScale>
    );
}
export const FadeInSoft = FadeIn.duration(250);
const styles = StyleSheet.create({
    track: { width: 50, height: 30, borderRadius: 15, padding: 3 },
    knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white, ...shadow(1) },
    seg: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4, height: 44 },
    segInd: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: radius.pill, backgroundColor: colors.primary },
    segItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    fabWrap: { position: 'absolute', right: 20, bottom: 24 },
    fab: {
        height: 58,
        minWidth: 58,
        borderRadius: 29,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
    listIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
