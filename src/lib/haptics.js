import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
const options = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };
const fire = (type) => {
    try {
        ReactNativeHapticFeedback.trigger(type, options);
    } catch {}
};
export const haptics = {
    light: () => fire('impactLight'),
    selection: () => fire('selection'),
    success: () => fire('notificationSuccess'),
    warning: () => fire('notificationWarning'),
};
