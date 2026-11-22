import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptics } from '../../lib/haptics';
const APressable = Animated.createAnimatedComponent(Pressable);
export function PressableScale({ children, style, scaleTo = 0.96, haptic = false, onPress, disabled, ...rest }) {
    const scale = useSharedValue(1);
    const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
        <APressable
            {...rest}
            disabled={disabled}
            onPressIn={(e) => {
                scale.value = withSpring(scaleTo, { damping: 15, stiffness: 400 });
                rest.onPressIn?.(e);
            }}
            onPressOut={(e) => {
                scale.value = withSpring(1, { damping: 12, stiffness: 300 });
                rest.onPressOut?.(e);
            }}
            onPress={(e) => {
                if (haptic) haptics.light();
                onPress?.(e);
            }}
            style={[style, animated]}
        >
            {children}
        </APressable>
    );
}
