import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { haptics } from '../../lib/haptics';
import { colors, fonts } from '../../theme';
import { money } from '../../utils/format';
import { AnimatedNumber, Button, SuccessBurst, Txt } from '../../components/ui';
const CONFETTI = [colors.gold, '#FFFFFF', '#FFB4A8', '#FFD27A', '#F7E3D9'];
function Confetti({ i, width, height }) {
    const t = useSharedValue(0);
    const x0 = (i * 53) % width;
    const drift = ((i % 5) - 2) * 30;
    useEffect(() => {
        t.value = withDelay((i % 12) * 90, withTiming(1, { duration: 2600 + (i % 7) * 250, easing: Easing.out(Easing.quad) }));
    }, [t, i]);
    const style = useAnimatedStyle(() => ({
        opacity: 1 - t.value * 0.9,
        transform: [
            { translateY: -40 + t.value * height * 0.9 },
            { translateX: drift * t.value },
            { rotate: `${t.value * 720 * (i % 2 ? 1 : -1)}deg` },
        ],
    }));
    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    top: 0,
                    left: x0,
                    width: 8,
                    height: i % 3 ? 14 : 8,
                    borderRadius: 2,
                    backgroundColor: CONFETTI[i % CONFETTI.length],
                },
                style,
            ]}
        />
    );
}
export function PaymentSuccessScreen({ route, navigation }) {
    const { amount, orderId, method, title } = route.params;
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    useEffect(() => {
        haptics.success();
    }, []);
    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#E2483A', colors.primary, colors.primaryDark]} style={StyleSheet.absoluteFill} />
            {Array.from({ length: 36 }).map((_, i) => (
                <Confetti key={i} i={i} width={width} height={height} />
            ))}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 8 }}>
                <SuccessBurst size={100} color={colors.white} bg="rgba(255,255,255,0.25)" />
                <Animated.View entering={FadeInDown.delay(400).springify()} style={{ alignItems: 'center', gap: 6 }}>
                    <Txt variant="smallMedium" color="#FFD9D2" style={{ letterSpacing: 2 }}>
                        {(title ?? 'PAYMENT SUCCESSFUL').toUpperCase()}
                    </Txt>
                    <AnimatedNumber value={amount} format={money} variant="display" color={colors.white} duration={1100} />
                    <Txt variant="body" color="#FFE5DE" center>
                        Paid with {method}. Thank you for dining at Chinatown!
                    </Txt>
                </Animated.View>
                <Animated.View entering={FadeInUp.delay(700)} style={styles.receipt}>
                    <Txt style={{ fontFamily: fonts.display, fontWeight: '700', fontSize: 18, color: colors.white }}>谢谢 · Xièxie</Txt>
                </Animated.View>
            </View>
            <Animated.View
                entering={FadeInUp.delay(800).springify()}
                style={{ padding: 20, paddingBottom: Math.max(insets.bottom, 20), gap: 10 }}
            >
                {orderId ? (
                    <Button
                        title="Track order"
                        variant="outline"
                        icon="receipt"
                        onPress={() => navigation.replace('OrderTracking', { id: orderId })}
                    />
                ) : null}
                <Button title="Back to home" variant="dark" onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} />
            </Animated.View>
        </View>
    );
}
const styles = StyleSheet.create({
    receipt: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)' },
});
