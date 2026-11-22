import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/endpoints';
import { colors } from '../theme';
import { appRoleOf, useAuth } from '../store/auth';
import { makeTabBar } from './TabBar';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { AdminOrdersScreen } from '../screens/admin/AdminOrdersScreen';
import { KitchenBoardScreen } from '../screens/admin/KitchenBoardScreen';
import { InventoryScreen } from '../screens/admin/InventoryScreen';
import { MoreScreen } from '../screens/admin/MoreScreen';
import { ChefTasksScreen } from '../screens/staff/ChefTasksScreen';
import { AdminReservationsScreen } from '../screens/admin/AdminReservationsScreen';
import { AdminOrderScreen } from '../screens/admin/AdminOrderScreen';
import { AssignChefsScreen } from '../screens/admin/AssignChefsScreen';
import { InventoryItemScreen } from '../screens/admin/InventoryItemScreen';
import { UpdateStockScreen } from '../screens/admin/UpdateStockScreen';
import { AddInventoryItemScreen } from '../screens/admin/AddInventoryItemScreen';
import { RestockPlanScreen } from '../screens/admin/RestockPlanScreen';
import { PurchaseOrdersScreen } from '../screens/admin/PurchaseOrdersScreen';
import { PurchaseOrderScreen } from '../screens/admin/PurchaseOrderScreen';
import { AdminReviewsScreen } from '../screens/admin/AdminReviewsScreen';
import { StaffListScreen } from '../screens/admin/StaffListScreen';
import { AddStaffScreen } from '../screens/admin/AddStaffScreen';
import { MenuAdminScreen } from '../screens/admin/MenuAdminScreen';
import { MenuItemEditScreen } from '../screens/admin/MenuItemEditScreen';
import { RestaurantSettingsScreen } from '../screens/admin/RestaurantSettingsScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/shared/ChangePasswordScreen';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
function useStaffTabMeta() {
    const role = appRoleOf(useAuth((s) => s.user));
    const board = useQuery({ queryKey: ['kitchen', 'board'], queryFn: adminApi.board, refetchInterval: 15000 });
    const pending = useQuery({
        queryKey: ['admin', 'orders', 'badge'],
        queryFn: () => adminApi.orders({ status: ['pending'], limit: 1 }),
        refetchInterval: 15000,
        enabled: role !== 'chef',
    });
    const mine = useQuery({ queryKey: ['kitchen', 'mine'], queryFn: adminApi.myTasks, refetchInterval: 15000, enabled: role === 'chef' });
    return {
        Dashboard: { icon: 'view-dashboard-outline', iconActive: 'view-dashboard', label: 'Dashboard' },
        Orders: {
            icon: 'receipt-text-outline',
            iconActive: 'receipt-text',
            label: 'Orders',
            badge: role === 'waiter' ? board.data?.counts.ready : pending.data?.total,
        },
        Kitchen: {
            icon: 'pot-steam-outline',
            iconActive: 'pot-steam',
            label: 'Kitchen',
            badge: role === 'chef' ? undefined : board.data?.counts.new,
        },
        Inventory: { icon: 'package-variant', iconActive: 'package-variant-closed', label: 'Stock' },
        Tasks: {
            icon: 'clipboard-text-outline',
            iconActive: 'clipboard-text',
            label: 'My tasks',
            badge: mine.data ? mine.data.counts.queued + mine.data.counts.cooking : undefined,
        },
        Reservations: { icon: 'calendar-blank-outline', iconActive: 'calendar-check', label: 'Bookings' },
        More: { icon: 'dots-horizontal-circle-outline', iconActive: 'dots-horizontal-circle', label: 'More' },
    };
}
const StaffTabBar = makeTabBar(useStaffTabMeta);
function WaiterReservations() {
    return <AdminReservationsScreen embedded />;
}
function StaffTabs() {
    const role = appRoleOf(useAuth((s) => s.user));
    return (
        <Tab.Navigator screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={(p) => <StaffTabBar {...p} />}>
            {role === 'chef' ? (
                <>
                    <Tab.Screen name="Tasks" component={ChefTasksScreen} />
                    <Tab.Screen name="Kitchen" component={KitchenBoardScreen} />
                    <Tab.Screen name="Inventory" component={InventoryScreen} />
                    <Tab.Screen name="More" component={MoreScreen} />
                </>
            ) : role === 'waiter' ? (
                <>
                    <Tab.Screen name="Orders" component={AdminOrdersScreen} />
                    <Tab.Screen name="Reservations" component={WaiterReservations} />
                    <Tab.Screen name="Kitchen" component={KitchenBoardScreen} />
                    <Tab.Screen name="More" component={MoreScreen} />
                </>
            ) : (
                <>
                    <Tab.Screen name="Dashboard" component={DashboardScreen} />
                    <Tab.Screen name="Orders" component={AdminOrdersScreen} />
                    <Tab.Screen name="Kitchen" component={KitchenBoardScreen} />
                    <Tab.Screen name="Inventory" component={InventoryScreen} />
                    <Tab.Screen name="More" component={MoreScreen} />
                </>
            )}
        </Tab.Navigator>
    );
}
export function StaffNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}
        >
            <Stack.Screen name="Tabs" component={StaffTabs} />
            <Stack.Screen name="AdminOrder" component={AdminOrderScreen} />
            <Stack.Screen name="AssignChefs" component={AssignChefsScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="InventoryItem" component={InventoryItemScreen} />
            <Stack.Screen name="UpdateStock" component={UpdateStockScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="AddInventoryItem" component={AddInventoryItemScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="RestockPlan" component={RestockPlanScreen} />
            <Stack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
            <Stack.Screen name="PurchaseOrder" component={PurchaseOrderScreen} />
            <Stack.Screen name="AdminReservations" component={AdminReservationsScreen} />
            <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} />
            <Stack.Screen name="StaffList" component={StaffListScreen} />
            <Stack.Screen name="AddStaff" component={AddStaffScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="MenuAdmin" component={MenuAdminScreen} />
            <Stack.Screen name="MenuItemEdit" component={MenuItemEditScreen} />
            <Stack.Screen name="RestaurantSettings" component={RestaurantSettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Navigator>
    );
}
