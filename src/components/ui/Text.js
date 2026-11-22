import React from 'react';
import { Text as RNText } from 'react-native';
import { colors, type as typo } from '../../theme';
export function Txt({ variant = 'body', color, center, style, ...rest }) {
    return (
        <RNText
            {...rest}
            allowFontScaling={false}
            style={[typo[variant], color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
        />
    );
}
export const muted = colors.textMuted;
