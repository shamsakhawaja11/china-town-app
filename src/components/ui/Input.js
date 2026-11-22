import React, { forwardRef, useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts, radius } from '../../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Text';
export const Input = forwardRef(function Input(
    { label, icon, error, hint, password, right, containerStyle, multiline, onFocus, onBlur, ...rest },
    ref,
) {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);
    const state = useSharedValue(0);
    useEffect(() => {
        state.value = withTiming(error ? 2 : focused ? 1 : 0, { duration: 180 });
    }, [error, focused, state]);
    const border = useAnimatedStyle(() => ({
        borderColor: interpolateColor(state.value, [0, 1, 2], [colors.border, colors.primary, colors.danger]),
    }));
    return (
        <View style={[{ gap: 6 }, containerStyle]}>
            {label ? (
                <Txt variant="smallMedium" color={colors.text}>
                    {label}
                </Txt>
            ) : null}
            <Animated.View style={[styles.box, multiline && { minHeight: 96, alignItems: 'flex-start', paddingTop: 12 }, border]}>
                {icon ? <Icon name={icon} size={20} color={focused ? colors.primary : colors.textMuted} /> : null}
                <TextInput
                    ref={ref}
                    {...rest}
                    multiline={multiline}
                    allowFontScaling={false}
                    placeholderTextColor={colors.textFaint}
                    secureTextEntry={password ? hidden : rest.secureTextEntry}
                    onFocus={(e) => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    style={[styles.input, multiline && { textAlignVertical: 'top', minHeight: 72 }]}
                />
                {password ? (
                    <PressableScale onPress={() => setHidden((h) => !h)} hitSlop={10}>
                        <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
                    </PressableScale>
                ) : null}
                {right}
            </Animated.View>
            {error ? (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    <Icon name="alert-circle-outline" size={14} color={colors.danger} />
                    <Txt variant="small" color={colors.danger}>
                        {error}
                    </Txt>
                </Animated.View>
            ) : hint ? (
                <Txt variant="small">{hint}</Txt>
            ) : null}
        </View>
    );
});
const styles = StyleSheet.create({
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
    },
    input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 10 },
});
