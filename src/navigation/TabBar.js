import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '../theme';
import { Icon, PressableScale, Txt } from '../components/ui';
function TabItem({ focused, meta, onPress }) {
    const p = useSharedValue(focused ? 1 : 0);
    useEffect(() => {
        p.value = withSpring(focused ? 1 : 0, { damping: 14, stiffness: 180 });
    }, [focused, p]);
    const pill = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.6 + p.value * 0.4 }] }));
    const lift = useAnimatedStyle(() => ({ transform: [{ translateY: -p.value * 2 }] }));
    return (
        <PressableScale haptic scaleTo={0.88} onPress={onPress} style={styles.item}>
            <Animated.View style={[styles.iconWrap, lift]}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.pill, pill]} />
                <Icon name={focused ? meta.iconActive : meta.icon} size={23} color={focused ? colors.primary : colors.textMuted} />
                {meta.badge ? (
                    <View style={styles.badge}>
                        <Txt variant="tiny" color={colors.white} style={{ fontSize: 9.5 }}>
                            {meta.badge > 9 ? '9+' : meta.badge}
                        </Txt>
                    </View>
                ) : null}
            </Animated.View>
            <Txt variant="tiny" color={focused ? colors.primary : colors.textMuted} style={{ fontSize: 10.5 }}>
                {meta.label}
            </Txt>
        </PressableScale>
    );
}
export function makeTabBar(meta) {
    return function TabBar({ state, navigation }) {
        const insets = useSafeAreaInsets();
        const m = meta();
        return (
            <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                {state.routes.map((route, index) => {
                    const focused = state.index === index;
                    const info = m[route.name] ?? { icon: 'circle', iconActive: 'circle', label: route.name };
                    return (
                        <TabItem
                            key={route.key}
                            focused={focused}
                            meta={info}
                            onPress={() => {
                                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                            }}
                        />
                    );
                })}
            </View>
        );
    };
}
const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        paddingTop: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...shadow(3),
    },
    item: { flex: 1, alignItems: 'center', gap: 2 },
    iconWrap: { width: 52, height: 32, alignItems: 'center', justifyContent: 'center' },
    pill: { borderRadius: 16, backgroundColor: colors.primaryLight },
    badge: {
        position: 'absolute',
        top: -2,
        right: 6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.white,
    },
});
