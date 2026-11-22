import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Defs, Ellipse, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../../theme';
import { Icon, PulseDot, Txt } from '../../components/ui';
function Lantern({ size = 60, string = 80 }) {
    const w = size;
    const h = size * 1.15;
    return (
        <Svg width={w} height={string + h + 26} viewBox={`0 0 ${w} ${string + h + 26}`}>
            <Defs>
                <RadialGradient id="glow" cx="50%" cy="50%" r="60%">
                    <Stop offset="0" stopColor="#FF7A4D" />
                    <Stop offset="0.7" stopColor="#D7372B" />
                    <Stop offset="1" stopColor="#8E1810" />
                </RadialGradient>
            </Defs>
            <Line x1={w / 2} y1={0} x2={w / 2} y2={string} stroke="#C9A25A" strokeWidth={1.5} />
            <Rect x={w * 0.3} y={string - 2} width={w * 0.4} height={7} rx={2} fill={colors.gold} />
            <Ellipse cx={w / 2} cy={string + 5 + h / 2} rx={w / 2 - 1} ry={h / 2} fill="url(#glow)" />
            {[0.28, 0.5, 0.72].map((x) => (
                <Path
                    key={x}
                    d={`M ${w * x} ${string + 8} Q ${w * (x < 0.5 ? x - 0.12 : x > 0.5 ? x + 0.12 : x)} ${string + 5 + h / 2} ${w * x} ${string + h + 2}`}
                    stroke="#9E2016"
                    strokeWidth={1.2}
                    fill="none"
                    opacity={0.6}
                />
            ))}
            <Rect x={w * 0.3} y={string + h} width={w * 0.4} height={7} rx={2} fill={colors.gold} />
            <Line x1={w / 2} y1={string + h + 7} x2={w / 2} y2={string + h + 26} stroke={colors.gold} strokeWidth={3} />
        </Svg>
    );
}
function SwingingLantern({ left, size, string, delay }) {
    const r = useSharedValue(0);
    const drop = useSharedValue(-220);
    useEffect(() => {
        drop.value = withDelay(delay, withSpring(0, { damping: 9, stiffness: 60 }));
        r.value = withDelay(
            delay + 400,
            withRepeat(
                withSequence(
                    withTiming(6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
                    withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
                ),
                -1,
                true,
            ),
        );
    }, [r, drop, delay]);
    const style = useAnimatedStyle(() => ({
        transform: [
            { translateY: drop.value },
            { translateY: -(string + size) / 2 },
            { rotate: `${r.value}deg` },
            { translateY: (string + size) / 2 },
        ],
    }));
    return (
        <Animated.View style={[{ position: 'absolute', top: 0, left }, style]}>
            <Lantern size={size} string={string} />
        </Animated.View>
    );
}
function Ember({ x, delay, height }) {
    const y = useSharedValue(0);
    useEffect(() => {
        y.value = withDelay(delay, withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1, false));
    }, [y, delay]);
    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: -y.value * height * 0.7 }, { translateX: Math.sin(y.value * 6) * 12 }],
        opacity: y.value < 0.1 ? y.value * 10 : 1 - y.value,
    }));
    return (
        <Animated.View
            style={[
                { position: 'absolute', bottom: 40, left: x, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold },
                style,
            ]}
        />
    );
}
export function SplashScreen({ status }) {
    const { width, height } = useWindowDimensions();
    const logo = useSharedValue(0);
    const shine = useSharedValue(-1);
    useEffect(() => {
        logo.value = withDelay(500, withSpring(1, { damping: 8, stiffness: 90 }));
        shine.value = withDelay(1300, withRepeat(withTiming(1, { duration: 2200 }), -1, false));
    }, [logo, shine]);
    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logo.value }, { rotate: `${(1 - logo.value) * -25}deg` }],
        opacity: logo.value,
    }));
    const shineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shine.value * 120 }, { rotate: '20deg' }] }));
    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#2A0B07', '#4A120C', '#1A0B09']} style={StyleSheet.absoluteFill} />
            <SwingingLantern left={width * 0.08} size={54} string={70} delay={100} />
            <SwingingLantern left={width * 0.78} size={60} string={110} delay={300} />
            <SwingingLantern left={width * 0.6} size={36} string={40} delay={500} />
            <SwingingLantern left={width * 0.26} size={32} string={130} delay={700} />
            {Array.from({ length: 10 }).map((_, i) => (
                <Ember key={i} x={(width / 10) * i + 10} delay={i * 450} height={height} />
            ))}

            <View style={styles.center}>
                <Animated.View style={[styles.logo, logoStyle]}>
                    <LinearGradient colors={['#E8503F', colors.primaryDark]} style={StyleSheet.absoluteFill} />
                    <Animated.View style={[styles.shine, shineStyle]} />
                    <Icon name="noodles" size={46} color={colors.white} />
                </Animated.View>
                <Animated.Text entering={FadeInDown.delay(900).springify()} allowFontScaling={false} style={styles.brand}>
                    Chinatown
                </Animated.Text>
                <Animated.View entering={FadeIn.delay(1300)}>
                    <Txt variant="smallMedium" color="#E9C9B8" center style={{ letterSpacing: 3 }}>
                        AUTHENTIC CHINESE KITCHEN
                    </Txt>
                </Animated.View>
            </View>

            <Animated.View entering={FadeIn.delay(1600)} style={styles.footer}>
                <PulseDot color={colors.gold} size={8} />
                <Txt variant="small" color="#C9A99A">
                    {status ?? 'Warming up the woks…'}
                </Txt>
            </Animated.View>
        </View>
    );
}
const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
    logo: { width: 96, height: 96, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    shine: { position: 'absolute', left: -60, top: -40, width: 30, height: 200, backgroundColor: 'rgba(255,255,255,0.25)' },
    brand: { fontFamily: fonts.display, fontWeight: '700', fontSize: 44, color: '#FFF4EC', letterSpacing: 1 },
    footer: { position: 'absolute', bottom: 48, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8 },
});
