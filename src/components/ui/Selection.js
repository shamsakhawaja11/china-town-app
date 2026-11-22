import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { colors, radius } from '../../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Text';
function usePop(active) {
    const s = useSharedValue(1);
    useEffect(() => {
        if (active) s.value = withSequence(withSpring(1.25, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 10 }));
    }, [active, s]);
    return useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
}
export function RadioButton({ selected, size = 22, color = colors.primary }) {
    const pop = usePop(selected);
    return (
        <Animated.View style={pop}>
            <Icon name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={size} color={selected ? color : colors.textFaint} />
        </Animated.View>
    );
}
export function Checkbox({ checked, size = 22, color = colors.primary }) {
    const pop = usePop(checked);
    return (
        <Animated.View style={pop}>
            <Icon name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'} size={size} color={checked ? color : colors.textFaint} />
        </Animated.View>
    );
}
export function RadioGroup({ options, value, onChange, card = true, style }) {
    return (
        <View style={[{ gap: card ? 10 : 0 }, style]}>
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <PressableScale
                        key={String(o.value)}
                        haptic
                        disabled={o.disabled}
                        onPress={() => onChange(o.value)}
                        scaleTo={0.98}
                        style={[styles.row, card && styles.card, card && active && styles.cardActive, o.disabled && { opacity: 0.45 }]}
                    >
                        {o.icon ? (
                            <View style={[styles.iconWrap, active && { backgroundColor: colors.primaryLight }]}>
                                <Icon name={o.icon} size={20} color={active ? colors.primary : colors.textMuted} />
                            </View>
                        ) : null}
                        <View style={{ flex: 1 }}>
                            <Txt variant="bodyMedium">{o.label}</Txt>
                            {o.description ? <Txt variant="small">{o.description}</Txt> : null}
                        </View>
                        {o.right}
                        <RadioButton selected={active} />
                    </PressableScale>
                );
            })}
        </View>
    );
}
export function CheckboxGroup({ options, values, onChange, columns = 1 }) {
    return (
        <View style={{ flexDirection: columns === 2 ? 'row' : 'column', flexWrap: 'wrap' }}>
            {options.map((o) => {
                const checked = values.includes(o.value);
                return (
                    <PressableScale
                        key={o.value}
                        haptic
                        scaleTo={0.97}
                        onPress={() => onChange(checked ? values.filter((v) => v !== o.value) : [...values, o.value])}
                        style={[styles.row, { width: columns === 2 ? '50%' : '100%', paddingVertical: 9 }]}
                    >
                        <Checkbox checked={checked} />
                        <View style={{ flex: 1 }}>
                            <Txt variant="body">{o.label}</Txt>
                            {o.description ? <Txt variant="small">{o.description}</Txt> : null}
                        </View>
                    </PressableScale>
                );
            })}
        </View>
    );
}
export function CheckRow({ checked, onChange, label, children }) {
    return (
        <PressableScale haptic scaleTo={0.98} onPress={() => onChange(!checked)} style={[styles.row, { paddingVertical: 6 }]}>
            <Checkbox checked={checked} />
            {label ? (
                <Txt variant="body" style={{ flex: 1 }}>
                    {label}
                </Txt>
            ) : (
                <View style={{ flex: 1 }}>{children}</View>
            )}
        </PressableScale>
    );
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 14, borderWidth: 1.5, borderColor: colors.border },
    cardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
