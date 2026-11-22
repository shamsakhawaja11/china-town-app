import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/endpoints';
import { colors } from '../theme';
import { makeTabBar } from './TabBar';
import { HomeScreen } from '../screens/customer/HomeScreen';
import { MenuScreen } from '../screens/customer/MenuScreen';
import { BookingsScreen } from '../screens/customer/BookingsScreen';
import { OrdersScreen } from '../screens/customer/OrdersScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { MapScreen } from '../screens/customer/MapScreen';
import { ItemDetailScreen } from '../screens/customer/ItemDetailScreen';
import { RestaurantReviewsScreen } from '../screens/customer/RestaurantReviewsScreen';
import { CartScreen } from '../screens/customer/CartScreen';
import { TablePickerScreen } from '../screens/customer/TablePickerScreen';
import { BookingDetailScreen } from '../screens/customer/BookingDetailScreen';
import { OrderTrackingScreen } from '../screens/customer/OrderTrackingScreen';
import { BillScreen } from '../screens/customer/BillScreen';
import { PaymentSuccessScreen } from '../screens/customer/PaymentSuccessScreen';
import { RateOrderScreen } from '../screens/customer/RateOrderScreen';
import { WalletScreen } from '../screens/customer/WalletScreen';
import { MyReviewsScreen } from '../screens/customer/MyReviewsScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/shared/ChangePasswordScreen';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
function useCustomerTabMeta() {
    const active = useQuery({ queryKey: ['orders', 'active'], queryFn: () => ordersApi.mine('active'), refetchInterval: 20000 });
    return {
        Home: { icon: 'home-outline', iconActive: 'home', label: 'Home' },
        Menu: { icon: 'silverware-fork-knife', iconActive: 'silverware-fork-knife', label: 'Menu' },
        Bookings: { icon: 'calendar-blank-outline', iconActive: 'calendar-check', label: 'Book' },
        Orders: { icon: 'receipt-text-outline', iconActive: 'receipt-text', label: 'Orders', badge: active.data?.total },
        Profile: { icon: 'account-outline', iconActive: 'account', label: 'Profile' },
    };
}
const CustomerTabBar = makeTabBar(useCustomerTabMeta);
function CustomerTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={(p) => <CustomerTabBar {...p} />}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Menu" component={MenuScreen} />
            <Tab.Screen name="Bookings" component={BookingsScreen} />
            <Tab.Screen name="Orders" component={OrdersScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
export function CustomerNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}
        >
            <Stack.Screen name="Tabs" component={CustomerTabs} />
            <Stack.Screen name="Map" component={MapScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="RestaurantReviews" component={RestaurantReviewsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="TablePicker" component={TablePickerScreen} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="Bill" component={BillScreen} />
            <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="RateOrder" component={RateOrderScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Navigator>
    );
}
