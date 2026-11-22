import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { Txt } from './Text';
import { IconButton } from './Button';
export function Sheet({ visible, onClose, title, children, footer }) {
    const insets = useSafeAreaInsets();
    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
            {visible ? (
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
                    >
                        <Pressable style={{ flex: 1 }} onPress={onClose} />
                    </Animated.View>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
                        <Animated.View
                            entering={SlideInDown.springify().damping(18).stiffness(160)}
                            exiting={SlideOutDown.duration(220)}
                            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
                        >
                            <View style={styles.grabber} />
                            {title ? (
                                <View style={styles.titleRow}>
                                    <Txt variant="h2" style={{ flex: 1 }}>
                                        {title}
                                    </Txt>
                                    <IconButton icon="close" size={36} bg={colors.surfaceAlt} onPress={onClose} />
                                </View>
                            ) : null}
                            <ScrollView
                                style={{ maxHeight: 520 }}
                                contentContainerStyle={{ gap: 14, paddingBottom: 8 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {children}
                            </ScrollView>
                            {footer ? <View style={{ paddingTop: 12 }}>{footer}</View> : null}
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            ) : null}
        </Modal>
    );
}
const styles = StyleSheet.create({
    sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10 },
    grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
});
