import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { colors, radius } from '../../theme';
import { Icon } from './Icon';
import { Txt } from './Text';
import { Button } from './Button';
export function Skeleton({ width = '100%', height = 16, r = 10, style }) {
    const x = useSharedValue(-1);
    useEffect(() => {
        x.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, false);
    }, [x]);
    const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 300 }] }));
    return (
        <View style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }, style]}>
            <Animated.View style={[StyleSheet.absoluteFill, anim]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width: 160, height: '100%' }}
                />
            </Animated.View>
        </View>
    );
}
export function ListSkeleton({ rows = 4, height = 86 }) {
    return (
        <View style={{ gap: 12, padding: 20 }}>
            {Array.from({ length: rows }).map((_, i) => (
                <View
                    key={i}
                    style={{
                        flexDirection: 'row',
                        gap: 12,
                        alignItems: 'center',
                        backgroundColor: colors.surface,
                        padding: 12,
                        borderRadius: radius.xl,
                    }}
                >
                    <Skeleton width={height - 24} height={height - 24} r={14} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <Skeleton width="70%" />
                        <Skeleton width="45%" height={12} />
                        <Skeleton width="30%" height={12} />
                    </View>
                </View>
            ))}
        </View>
    );
}
export function EmptyState({ icon = 'food-off-outline', title, message, action, onAction, tone = 'neutral' }) {
    const y = useSharedValue(0);
    useEffect(() => {
        y.value = withRepeat(withSequence(withTiming(-8, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1, true);
    }, [y]);
    const float = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
    return (
        <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', padding: 32, gap: 10 }}>
            <Animated.View style={[styles.emptyIcon, tone === 'error' && { backgroundColor: colors.dangerSoft }, float]}>
                <Icon name={tone === 'error' ? 'wifi-off' : icon} size={40} color={colors.primary} />
            </Animated.View>
            <Txt variant="h3" center>
                {title}
            </Txt>
            {message ? (
                <Txt variant="small" center style={{ maxWidth: 280 }}>
                    {message}
                </Txt>
            ) : null}
            {action && onAction ? <Button title={action} onPress={onAction} size="md" full={false} style={{ marginTop: 8 }} /> : null}
        </Animated.View>
    );
}
export function ProgressBar({ value, color = colors.primary, height = 8, track = colors.surfaceAlt, delay = 0 }) {
    const w = useSharedValue(0);
    useEffect(() => {
        w.value = withDelay(delay, withTiming(Math.max(0, Math.min(1, value)), { duration: 900, easing: Easing.out(Easing.cubic) }));
    }, [value, delay, w]);
    const anim = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
    return (
        <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
            <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, anim]} />
        </View>
    );
}
export function AnimatedNumber({ value, format = (n) => String(Math.round(n)), duration = 900, variant = 'h1', color }) {
    const [shown, setShown] = useState(0);
    useEffect(() => {
        let frame;
        const start = Date.now();
        const from = shown;
        const tick = () => {
            const t = Math.min(1, (Date.now() - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setShown(from + (value - from) * eased);
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value]);
    return (
        <Txt variant={variant} color={color}>
            {format(shown)}
        </Txt>
    );
}
export function PulseDot({ color = colors.success, size = 10 }) {
    const s = useSharedValue(1);
    useEffect(() => {
        s.value = withRepeat(withTiming(2.4, { duration: 1300, easing: Easing.out(Easing.ease) }), -1, false);
    }, [s]);
    const ring = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 2.4 - s.value > 0 ? (2.4 - s.value) / 1.4 : 0 }));
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
                style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color }, ring]}
            />
            <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
        </View>
    );
}
export function SuccessBurst({ size = 110, color = colors.success, bg = colors.successSoft }) {
    const s = useSharedValue(0);
    const ring = useSharedValue(0.6);
    useEffect(() => {
        s.value = withDelay(150, withSpring(1, { damping: 7, stiffness: 140 }));
        ring.value = withRepeat(withTiming(1.5, { duration: 1600 }), -1, false);
    }, [s, ring]);
    const pop = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
    const halo = useAnimatedStyle(() => ({ transform: [{ scale: ring.value }], opacity: 1.5 - ring.value }));
    return (
        <View style={{ width: size * 1.6, height: size * 1.6, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: bg }, halo]} />
            <Animated.View
                style={[
                    {
                        width: size,
                        height: size,
                        borderRadius: size,
                        backgroundColor: color,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    pop,
                ]}
            >
                <Icon name="check-bold" size={size * 0.5} color={colors.white} />
            </Animated.View>
        </View>
    );
}
const styles = StyleSheet.create({
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
});
