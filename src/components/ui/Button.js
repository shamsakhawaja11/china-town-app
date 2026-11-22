import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, radius, shadow } from '../../theme';
import { PressableScale } from './PressableScale';
import { Txt } from './Text';
import { Icon } from './Icon';
export function Button({ title, onPress, variant = 'primary', icon, iconRight, loading, disabled, size = 'lg', style, full = true }) {
    const height = size === 'lg' ? 54 : size === 'md' ? 44 : 34;
    const fg =
        variant === 'primary' || variant === 'danger' || variant === 'success' || variant === 'dark'
            ? colors.white
            : variant === 'secondary'
              ? colors.primary
              : variant === 'outline'
                ? colors.text
                : colors.primary;
    const gradient =
        variant === 'primary'
            ? ['#E2483A', colors.primaryDark]
            : variant === 'danger'
              ? ['#E2483A', '#B3261E']
              : variant === 'success'
                ? ['#37B36A', '#23824A']
                : variant === 'dark'
                  ? ['#3A2A25', '#1E1714']
                  : null;
    const isDisabled = disabled || loading;
    const content = (
        <View style={styles.row}>
            {loading ? (
                <ActivityIndicator color={fg} />
            ) : (
                <>
                    {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={fg} /> : null}
                    <Txt variant="button" color={fg} style={size === 'sm' ? { fontSize: 13 } : null} numberOfLines={1}>
                        {title}
                    </Txt>
                    {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 20} color={fg} /> : null}
                </>
            )}
        </View>
    );
    return (
        <PressableScale
            haptic
            onPress={onPress}
            disabled={isDisabled}
            style={[
                {
                    height,
                    borderRadius: size === 'sm' ? radius.md : radius.lg,
                    alignSelf: full ? 'stretch' : 'flex-start',
                    opacity: isDisabled && !loading ? 0.5 : 1,
                },
                gradient ? shadow(2) : null,
                style,
            ]}
        >
            {gradient ? (
                <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.fill,
                        { borderRadius: size === 'sm' ? radius.md : radius.lg, paddingHorizontal: size === 'sm' ? 12 : 20 },
                    ]}
                >
                    {content}
                </LinearGradient>
            ) : (
                <View
                    style={[
                        styles.fill,
                        {
                            borderRadius: size === 'sm' ? radius.md : radius.lg,
                            paddingHorizontal: size === 'sm' ? 12 : 20,
                            backgroundColor:
                                variant === 'secondary' ? colors.primaryLight : variant === 'outline' ? colors.surface : 'transparent',
                            borderWidth: variant === 'outline' ? 1.5 : 0,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    {content}
                </View>
            )}
        </PressableScale>
    );
}
export function IconButton({ icon, onPress, color = colors.text, bg = colors.surface, size = 42, badge, style }) {
    return (
        <PressableScale
            haptic
            onPress={onPress}
            style={[
                { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
                bg !== 'transparent' ? shadow(1) : null,
                style,
            ]}
        >
            <Icon name={icon} size={size * 0.5} color={color} />
            {badge ? (
                <View style={styles.badge}>
                    <Txt variant="tiny" color={colors.white} style={{ fontSize: 10 }}>
                        {badge > 99 ? '99+' : badge}
                    </Txt>
                </View>
            ) : null}
        </PressableScale>
    );
}
const styles = StyleSheet.create({
    fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: {
        position: 'absolute',
        top: -3,
        right: -3,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.white,
    },
});
