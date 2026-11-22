import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../../theme';
import { useToast } from '../../store/toast';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Text';
export function ToastHost() {
    const { toasts, dismiss } = useToast();
    const insets = useSafeAreaInsets();
    return (
        <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8, alignItems: 'center' }]}>
            {toasts.map((t) => {
                const tone = t.kind === 'success' ? colors.success : t.kind === 'error' ? colors.danger : colors.info;
                const icon = t.kind === 'success' ? 'check-circle' : t.kind === 'error' ? 'alert-circle' : 'information';
                return (
                    <Animated.View
                        key={t.id}
                        entering={FadeInUp.springify().damping(15)}
                        exiting={FadeOutUp.duration(200)}
                        layout={LinearTransition.springify()}
                        style={{ width: '92%', marginBottom: 8 }}
                    >
                        <PressableScale onPress={() => dismiss(t.id)} style={[styles.toast, shadow(3)]}>
                            <View style={[styles.icon, { backgroundColor: tone + '1F' }]}>
                                <Icon name={icon} size={22} color={tone} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Txt variant="bodyMedium">{t.title}</Txt>
                                {t.message ? (
                                    <Txt variant="small" numberOfLines={3}>
                                        {t.message}
                                    </Txt>
                                ) : null}
                            </View>
                        </PressableScale>
                    </Animated.View>
                );
            })}
        </View>
    );
}
const styles = StyleSheet.create({
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
