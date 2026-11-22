import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Text';
export function Chip({ label, active, onPress, icon, count, style, small }) {
    return (
        <PressableScale
            haptic
            onPress={onPress}
            style={[styles.chip, small && { height: 30, paddingHorizontal: 11 }, active ? styles.active : styles.inactive, style]}
        >
            {icon ? <Icon name={icon} size={small ? 14 : 16} color={active ? colors.white : colors.textMuted} /> : null}
            <Txt variant="smallMedium" color={active ? colors.white : colors.text} style={small ? { fontSize: 11.5 } : null}>
                {label}
            </Txt>
            {count !== undefined ? (
                <View style={[styles.count, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.primaryLight }]}>
                    <Txt variant="tiny" color={active ? colors.white : colors.primary}>
                        {count}
                    </Txt>
                </View>
            ) : null}
        </PressableScale>
    );
}
export function ChipRow({ items, value, onChange, style, small }) {
    const isActive = (v) => (Array.isArray(value) ? value.includes(v) : value === v);
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[{ gap: 8, paddingHorizontal: 20 }, style]}>
            {items.map((i) => (
                <Chip
                    key={i.value}
                    small={small}
                    label={i.label}
                    icon={i.icon}
                    count={i.count}
                    active={isActive(i.value)}
                    onPress={() => onChange(i.value)}
                />
            ))}
        </ScrollView>
    );
}
export function Pill({ label, fg, bg, icon, style }) {
    return (
        <View style={[styles.pill, { backgroundColor: bg }, style]}>
            {icon ? <Icon name={icon} size={12} color={fg} /> : null}
            <Txt variant="tiny" color={fg} style={{ fontSize: 11 }}>
                {label}
            </Txt>
        </View>
    );
}
export function Tag({ label, icon, color = colors.textMuted }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {icon ? <Icon name={icon} size={14} color={color} /> : null}
            <Txt variant="small" color={color}>
                {label}
            </Txt>
        </View>
    );
}
const styles = StyleSheet.create({
    chip: { height: 38, paddingHorizontal: 15, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6 },
    active: { backgroundColor: colors.primary },
    inactive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    count: { minWidth: 20, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 3.5,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
    },
});
