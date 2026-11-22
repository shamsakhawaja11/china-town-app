import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme';
export function Icon({ name, size = 20, color = colors.text, style }) {
    return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
}
