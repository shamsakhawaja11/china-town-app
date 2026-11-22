import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { colors, radius, shadow } from '../theme';
import { money } from '../utils/format';
import { Icon, PressableScale, Txt } from './ui';
export function CartBar({ count, total, onPress, bottom = 16 }) {
    const bump = useSharedValue(1);
    useEffect(() => {
        bump.value = withSequence(withSpring(1.06, { damping: 6, stiffness: 400 }), withSpring(1));
    }, [count, total, bump]);
    const style = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
    if (count <= 0) return null;
    return (
        <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} style={[styles.wrap, { bottom }]}>
            <Animated.View style={style}>
                <PressableScale haptic onPress={onPress} style={[styles.bar, shadow(3)]}>
                    <View style={styles.count}>
                        <Icon name="shopping-outline" size={18} color={colors.primary} />
                        <Txt variant="smallMedium" color={colors.primary}>
                            {count}
                        </Txt>
                    </View>
                    <Txt variant="button" color={colors.white} style={{ flex: 1 }}>
                        View cart
                    </Txt>
                    <Txt variant="button" color={colors.white}>
                        {money(total)}
                    </Txt>
                    <Icon name="chevron-right" size={22} color={colors.white} />
                </PressableScale>
            </Animated.View>
        </Animated.View>
    );
}
const styles = StyleSheet.create({
    wrap: { position: 'absolute', left: 16, right: 16 },
    bar: {
        height: 58,
        borderRadius: radius.xl,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 10,
    },
    count: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.white,
        borderRadius: 14,
        paddingHorizontal: 10,
        height: 38,
    },
});
