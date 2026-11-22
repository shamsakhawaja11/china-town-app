import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../store/auth';
import { colors } from '../theme';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { CustomerNavigator } from './CustomerNavigator';
import { StaffNavigator } from './StaffNavigator';
const Auth = createNativeStackNavigator();
function AuthNavigator() {
    return (
        <Auth.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom', contentStyle: { backgroundColor: colors.bg } }}>
            <Auth.Screen name="Login" component={LoginScreen} />
            <Auth.Screen name="Register" component={RegisterScreen} />
        </Auth.Navigator>
    );
}
export function RootNavigator() {
    const { status, user, bootstrap } = useAuth();
    const qc = useQueryClient();
    const [minTimePassed, setMinTimePassed] = useState(false);
    useEffect(() => {
        bootstrap();
        const t = setTimeout(() => setMinTimePassed(true), 2400);
        return () => clearTimeout(t);
    }, [bootstrap]);
    useEffect(() => {
        if (status === 'signedOut') qc.clear();
    }, [status, qc]);
    if (status === 'booting' || !minTimePassed) {
        return <SplashScreen status={status === 'booting' ? 'Warming up the woks…' : 'Ready!'} />;
    }
    const content =
        status === 'signedOut' || !user ? <AuthNavigator /> : user.role === 'customer' ? <CustomerNavigator /> : <StaffNavigator />;
    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Animated.View key={`${status}-${user?.id ?? 'guest'}`} entering={FadeIn.duration(450)} style={{ flex: 1 }}>
                {content}
            </Animated.View>
        </View>
    );
}
