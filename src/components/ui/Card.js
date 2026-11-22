import React from 'react';
import { View } from 'react-native';
import { colors, radius, shadow } from '../../theme';
import { PressableScale } from './PressableScale';
export function Card({ children, style, onPress, flat, padded = true, ...rest }) {
    const base = {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: padded ? 16 : 0,
        borderWidth: 1,
        borderColor: colors.border,
        ...(flat ? {} : shadow(1)),
    };
    if (onPress) {
        return (
            <PressableScale scaleTo={0.98} onPress={onPress} style={[base, style]}>
                {children}
            </PressableScale>
        );
    }
    return (
        <View {...rest} style={[base, style]}>
            {children}
        </View>
    );
}
