import React from 'react';
import { LogBox, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ToastHost } from './src/components/ui';
LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate`']);
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 20_000,
            retry: (count, err) => {
                const status = err?.response?.status;
                if (status && status >= 400 && status < 500) return false;
                return count < 2;
            },
        },
    },
});
const navTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: colors.bg,
        primary: colors.primary,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
    },
};
export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <NavigationContainer theme={navTheme}>
                        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
                        <RootNavigator />
                    </NavigationContainer>
                    <ToastHost />
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
