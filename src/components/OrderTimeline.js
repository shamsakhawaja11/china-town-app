import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInLeft, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';
import { time } from '../utils/format';
import { Icon, Txt } from './ui';
const ICONS = {
    pending: 'receipt',
    accepted: 'check-circle-outline',
    preparing: 'chef-hat',
    ready: 'bell-ring-outline',
    served: 'silverware-fork-knife',
    completed: 'check-all',
    rejected: 'close-circle-outline',
    cancelled: 'cancel',
};
function Current({ children }) {
    const s = useSharedValue(1);
    useEffect(() => {
        s.value = withRepeat(withTiming(1.6, { duration: 1100 }), -1, false);
    }, [s]);
    const halo = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: (1.6 - s.value) / 0.6 }));
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
                style={[{ position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary }, halo]}
            />
            {children}
        </View>
    );
}
export function OrderTimeline({ steps }) {
    const lastDone = steps.reduce((acc, s, i) => (s.done ? i : acc), -1);
    return (
        <View>
            {steps.map((s, i) => {
                const done = s.done;
                const current = i === lastDone && !['completed', 'cancelled', 'rejected'].includes(s.status);
                const bad = s.status === 'rejected' || s.status === 'cancelled';
                const dot = (
                    <View
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: bad ? colors.danger : done ? colors.primary : colors.surfaceAlt,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon name={ICONS[s.status] ?? 'circle-small'} size={18} color={done ? colors.white : colors.textFaint} />
                    </View>
                );
                return (
                    <Animated.View key={s.status} entering={FadeInLeft.delay(i * 90).springify()} style={{ flexDirection: 'row', gap: 14 }}>
                        <View style={{ alignItems: 'center' }}>
                            {current ? <Current>{dot}</Current> : dot}
                            {i < steps.length - 1 ? (
                                <View
                                    style={{
                                        width: 3,
                                        flex: 1,
                                        minHeight: 22,
                                        marginVertical: 3,
                                        borderRadius: 2,
                                        backgroundColor: steps[i + 1].done ? colors.primary : colors.border,
                                    }}
                                />
                            ) : null}
                        </View>
                        <View style={{ flex: 1, paddingTop: 6, paddingBottom: 16 }}>
                            <Txt variant={current ? 'h3' : 'bodyMedium'} color={done ? colors.text : colors.textFaint}>
                                {s.label}
                            </Txt>
                            <Txt variant="small">{s.at ? time(s.at) : current ? 'In progress…' : 'Waiting'}</Txt>
                        </View>
                    </Animated.View>
                );
            })}
        </View>
    );
}
