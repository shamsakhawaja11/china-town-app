import React, { useEffect } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    Easing,
    SlideInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { restaurantApi } from '../../api/endpoints';
import { colors, radius, shadow } from '../../theme';
import { openState } from '../../utils/format';
import { Button, Icon, IconButton, PulseDot, Txt } from '../../components/ui';

const MAP = {
    land: '#F3ECE4',
    block: '#E9DFD5',
    park: '#CFE6C8',
    parkDark: '#B7D8AE',
    water: '#BFDDEB',
    road: '#FFFFFF',
    roadEdge: '#E2D4C8',
    major: '#FCE3B4',
    majorEdge: '#EBC88A',
    label: '#8B7D75',
};

function CityMap() {
    return (
        <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
            <Rect x="0" y="0" width="400" height="800" fill={MAP.land} />
            <G fill={MAP.block}>
                <Rect x="20" y="40" width="120" height="110" rx="10" />
                <Rect x="170" y="40" width="90" height="110" rx="10" />
                <Rect x="290" y="40" width="100" height="110" rx="10" />
                <Rect x="20" y="210" width="120" height="120" rx="10" />
                <Rect x="290" y="210" width="100" height="120" rx="10" />
                <Rect x="20" y="430" width="120" height="110" rx="10" />
                <Rect x="170" y="430" width="90" height="110" rx="10" />
                <Rect x="290" y="430" width="100" height="110" rx="10" />
                <Rect x="20" y="600" width="120" height="180" rx="10" />
                <Rect x="290" y="600" width="100" height="180" rx="10" />
            </G>
            <Rect x="170" y="210" width="90" height="120" rx="14" fill={MAP.park} />
            <Circle cx="195" cy="245" r="12" fill={MAP.parkDark} />
            <Circle cx="232" cy="290" r="16" fill={MAP.parkDark} />
            <Circle cx="205" cy="305" r="9" fill={MAP.parkDark} />
            <Path d="M170 600 Q215 640 200 700 T230 800 L260 800 Q240 720 255 670 T260 600 Z" fill={MAP.water} />
            <G stroke={MAP.roadEdge} strokeWidth="22" strokeLinecap="round">
                <Path d="M155 0 V800" />
                <Path d="M275 0 V800" />
                <Path d="M0 180 H400" />
                <Path d="M0 570 H400" />
            </G>
            <G stroke={MAP.road} strokeWidth="18" strokeLinecap="round">
                <Path d="M155 0 V800" />
                <Path d="M275 0 V800" />
                <Path d="M0 180 H400" />
                <Path d="M0 570 H400" />
            </G>
            <Path d="M0 380 H400" stroke={MAP.majorEdge} strokeWidth="34" />
            <Path d="M0 380 H400" stroke={MAP.major} strokeWidth="30" />
            <Path d="M0 380 H400" stroke={MAP.road} strokeWidth="1.5" strokeDasharray="10 10" />
            <Circle cx="215" cy="380" r="30" fill={MAP.majorEdge} />
            <Circle cx="215" cy="380" r="27" fill={MAP.major} />
            <Circle cx="215" cy="380" r="14" fill={MAP.park} />
            <SvgText x="24" y="372" fontSize="11" fontWeight="600" fill={MAP.label}>
                JINNAH AVENUE
            </SvgText>
            <SvgText x="300" y="372" fontSize="11" fontWeight="600" fill={MAP.label}>
                D CHOWK
            </SvgText>
            <SvgText x="24" y="174" fontSize="10" fill={MAP.label}>
                Constitution Ave
            </SvgText>
            <SvgText x="24" y="564" fontSize="10" fill={MAP.label}>
                Blue Area
            </SvgText>
            <SvgText x="182" y="226" fontSize="9" fill="#6E9A63">
                Park
            </SvgText>
            <SvgText x="208" y="760" fontSize="9" fill="#5E93AD" rotation="-70" origin="208,760">
                Nullah
            </SvgText>
        </Svg>
    );
}

function DropPin() {
    const drop = useSharedValue(-220);
    const bob = useSharedValue(0);
    const halo = useSharedValue(0);
    useEffect(() => {
        drop.value = withDelay(250, withSpring(0, { damping: 9, stiffness: 120 }));
        bob.value = withDelay(
            1200,
            withRepeat(
                withSequence(
                    withTiming(-6, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                false,
            ),
        );
        halo.value = withDelay(900, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false));
    }, [drop, bob, halo]);
    const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drop.value + bob.value }] }));
    const haloStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 0.4 + halo.value * 1.6 }],
        opacity: 0.55 * (1 - halo.value),
    }));
    const shadowStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 + bob.value / 20 }], opacity: 0.25 + bob.value / 40 }));
    return (
        <View style={styles.pinWrap} pointerEvents="none">
            <Animated.View style={[styles.halo, haloStyle]} />
            <Animated.View style={[styles.pinShadow, shadowStyle]} />
            <Animated.View style={[styles.pinColumn, pinStyle]}>
                <View style={[styles.pin, shadow(3)]}>
                    <Icon name="noodles" size={24} color={colors.white} />
                </View>
                <View style={styles.pinTip} />
            </Animated.View>
        </View>
    );
}

export function MapScreen() {
    const nav = useNavigation();
    const insets = useSafeAreaInsets();
    const { data: r } = useQuery({ queryKey: ['restaurant'], queryFn: restaurantApi.get });
    const lat = r?.latitude ?? 33.7294;
    const lng = r?.longitude ?? 73.0931;
    const open = openState(r?.opening_time, r?.closing_time);
    const directions = () => {
        const url = Platform.select({
            ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
            default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        });
        Linking.openURL(url).catch(() => undefined);
    };
    return (
        <View style={{ flex: 1, backgroundColor: MAP.land }}>
            <View style={StyleSheet.absoluteFill}>
                <CityMap />
            </View>
            <DropPin />
            <View style={[styles.back, { top: insets.top + 8 }]}>
                <IconButton icon="chevron-left" onPress={() => nav.goBack()} />
            </View>
            <View style={[styles.coords, shadow(1), { top: insets.top + 12 }]}>
                <Icon name="crosshairs-gps" size={14} color={colors.primary} />
                <Txt variant="tiny" color={colors.text}>
                    {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                </Txt>
            </View>
            <Animated.View
                entering={SlideInDown.springify().damping(16)}
                style={[styles.card, shadow(3), { paddingBottom: Math.max(insets.bottom, 16) }]}
            >
                <Txt variant="h2">{r?.name ?? 'Chinatown'}</Txt>
                <Txt variant="small">{r?.address}</Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <PulseDot color={open.open ? colors.success : colors.danger} size={8} />
                    <Txt variant="smallMedium" color={open.open ? colors.success : colors.danger}>
                        {open.label}
                    </Txt>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                    {r?.phone ? (
                        <Button
                            title="Call"
                            variant="outline"
                            icon="phone"
                            style={{ flex: 1 }}
                            onPress={() => Linking.openURL(`tel:${r.phone}`)}
                        />
                    ) : null}
                    <Button title="Directions" icon="directions" style={{ flex: 2 }} onPress={directions} />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    pinWrap: {
        position: 'absolute',
        top: '38%',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 90,
    },
    halo: {
        position: 'absolute',
        bottom: -30,
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.primary,
    },
    pinShadow: {
        position: 'absolute',
        bottom: -4,
        width: 22,
        height: 8,
        borderRadius: 11,
        backgroundColor: colors.black,
    },
    pinColumn: { alignItems: 'center' },
    pin: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.white,
    },
    pinTip: {
        width: 0,
        height: 0,
        marginTop: -2,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.primary,
    },
    back: { position: 'absolute', left: 16 },
    coords: {
        position: 'absolute',
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radius.pill,
    },
    card: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl,
        padding: 20,
        gap: 6,
    },
});