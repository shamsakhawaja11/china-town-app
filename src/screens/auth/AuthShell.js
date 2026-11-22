import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { restaurantApi } from '../../api/endpoints';
import { assetUri } from '../../api/client';
import { Body, Icon, Txt } from '../../components/ui';
export function AuthShell({ title, subtitle, children }) {
    const insets = useSafeAreaInsets();
    const restaurant = useQuery({ queryKey: ['restaurant'], queryFn: restaurantApi.get, retry: false, staleTime: 300000 });
    const photo = assetUri(restaurant.data?.image_url);
    const bob = useSharedValue(0);
    useEffect(() => {
        bob.value = withRepeat(withSequence(withTiming(-6, { duration: 1600 }), withTiming(0, { duration: 1600 })), -1, true);
    }, [bob]);
    const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#4A120C', colors.primaryDark, colors.primary]} style={[styles.hero, { paddingTop: insets.top + 24 }]}>
                {photo ? (
                    <Animated.View entering={FadeIn.duration(500)} style={StyleSheet.absoluteFill}>
                        <Animated.Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <LinearGradient
                            colors={['rgba(26,11,9,0.55)', 'rgba(74,18,12,0.45)', 'rgba(168,35,26,0.85)']}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                ) : (
                    <>
                        <View style={styles.circle1} />
                        <View style={styles.circle2} />
                    </>
                )}
                <Animated.View style={[styles.logo, bobStyle]}>
                    <Icon name="noodles" size={34} color={colors.primary} />
                </Animated.View>
                <Txt style={{ fontFamily: fonts.display, fontWeight: '700', fontSize: 26, color: colors.white }}>Chinatown</Txt>
            </LinearGradient>
            <View style={styles.sheet}>
                <Body contentStyle={{ paddingTop: 28 }}>
                    <Animated.View entering={FadeInDown.springify()}>
                        <Txt variant="h1">{title}</Txt>
                        <Txt variant="body" color={colors.textMuted}>
                            {subtitle}
                        </Txt>
                    </Animated.View>
                    {children}
                </Body>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    hero: { height: 250, alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
    circle1: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(255,255,255,0.06)',
        top: -90,
        right: -80,
    },
    circle2: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(230,169,58,0.12)',
        bottom: -60,
        left: -50,
    },
    logo: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    sheet: { flex: 1, marginTop: -28, backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
});