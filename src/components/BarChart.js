import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';
import { PressableScale, Txt } from './ui';
function AnimatedBar({ ratio, delay, color, height }) {
    const h = useSharedValue(0);
    useEffect(() => {
        h.value = withDelay(delay, withTiming(ratio, { duration: 800, easing: Easing.out(Easing.back(1.2)) }));
    }, [ratio, delay, h]);
    const style = useAnimatedStyle(() => ({ height: Math.max(4, h.value * height) }));
    return <Animated.View style={[{ width: '100%', borderRadius: 8, backgroundColor: color }, style]} />;
}
export function BarChart({ data, height = 150, format = (v) => String(v), dark }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    const [active, setActive] = useState(data.findIndex((d) => d.highlight));
    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: height + 22, gap: 8 }}>
                {data.map((d, i) => {
                    const isActive = active === i;
                    const on = dark ? colors.gold : colors.primary;
                    const color = d.ghost
                        ? dark
                            ? 'rgba(255,255,255,0.12)'
                            : colors.primaryLight
                        : isActive || d.highlight
                          ? on
                          : dark
                            ? 'rgba(255,255,255,0.28)'
                            : '#F2B8AE';
                    return (
                        <PressableScale
                            key={`${d.label}-${i}`}
                            scaleTo={0.92}
                            onPress={() => setActive(i)}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: height + 22 }}
                        >
                            {isActive ? (
                                <Txt
                                    variant="tiny"
                                    color={dark ? colors.gold : colors.primary}
                                    style={{ marginBottom: 4 }}
                                    numberOfLines={1}
                                >
                                    {format(d.value)}
                                </Txt>
                            ) : null}
                            <AnimatedBar ratio={d.value / max} delay={i * 70} color={color} height={height} />
                        </PressableScale>
                    );
                })}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                {data.map((d, i) => (
                    <Txt
                        key={i}
                        variant="tiny"
                        center
                        style={{ flex: 1 }}
                        color={active === i ? (dark ? colors.gold : colors.primary) : dark ? '#C9A99A' : colors.textMuted}
                        numberOfLines={1}
                    >
                        {d.label}
                    </Txt>
                ))}
            </View>
        </View>
    );
}
