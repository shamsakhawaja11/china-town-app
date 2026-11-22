import React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, shadow } from '../../theme';
import { IconButton } from './Button';
import { Txt } from './Text';
export function Screen({ children, style, edges = ['top'] }) {
    const insets = useSafeAreaInsets();
    return (
        <View
            style={[
                {
                    flex: 1,
                    backgroundColor: colors.bg,
                    paddingTop: edges.includes('top') ? insets.top : 0,
                    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}
export function Header({ title, subtitle, back = true, right, onBack, transparent }) {
    const nav = useNavigation();
    return (
        <View style={[styles.header, transparent && { backgroundColor: 'transparent' }]}>
            <View style={{ width: 42 }}>{back ? <IconButton icon="chevron-left" onPress={onBack ?? (() => nav.goBack())} /> : null}</View>
            <View style={{ flex: 1, alignItems: 'center' }}>
                {title ? (
                    <Txt variant="h3" numberOfLines={1}>
                        {title}
                    </Txt>
                ) : null}
                {subtitle ? (
                    <Txt variant="small" numberOfLines={1}>
                        {subtitle}
                    </Txt>
                ) : null}
            </View>
            <View style={{ minWidth: 42, alignItems: 'flex-end' }}>{right}</View>
        </View>
    );
}
export function Body({ children, refreshing, onRefresh, contentStyle, padded = true, ...rest }) {
    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                {...rest}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[padded && { padding: 20, paddingBottom: 40 }, { gap: 16 }, contentStyle]}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={!!refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    ) : undefined
                }
            >
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
export function BottomBar({ children, style }) {
    const insets = useSafeAreaInsets();
    return (
        <Animated.View
            entering={FadeInDown.springify().damping(16)}
            style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 14) }, style]}
        >
            {children}
        </Animated.View>
    );
}
export function Appear({ index = 0, children, style }) {
    return (
        <Animated.View
            entering={FadeInDown.delay(Math.min(index, 10) * 60)
                .springify()
                .damping(16)}
            style={style}
        >
            {children}
        </Animated.View>
    );
}
const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    bottom: {
        backgroundColor: colors.surface,
        paddingHorizontal: 20,
        paddingTop: 14,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        gap: 12,
        ...shadow(3),
    },
});
