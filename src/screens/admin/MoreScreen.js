import React from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { notificationsApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { titleCase } from '../../utils/format';
import { appRoleOf, useAuth } from '../../store/auth';
import { Avatar, Body, Card, ListRow, Pill, Screen, Txt } from '../../components/ui';
export function MoreScreen() {
    const nav = useNavigation();
    const user = useAuth((s) => s.user);
    const logout = useAuth((s) => s.logout);
    const role = appRoleOf(user);
    const unread = useQuery({ queryKey: ['notifications', 'unread'], queryFn: notificationsApi.unread });
    const isAdmin = role === 'admin';
    const isBoss = isAdmin || role === 'manager';
    const sections = [
        {
            title: 'Operations',
            rows: [
                {
                    icon: 'calendar-account',
                    title: 'Reservations',
                    subtitle: 'Confirm, seat and manage bookings',
                    go: () => nav.navigate('AdminReservations'),
                    show: isBoss,
                },
                {
                    icon: 'clipboard-list-outline',
                    title: 'Restock plan',
                    subtitle: 'Forecast-based reordering',
                    go: () => nav.navigate('RestockPlan'),
                    show: isBoss,
                },
                {
                    icon: 'truck-outline',
                    title: 'Purchase orders',
                    subtitle: 'Receive deliveries',
                    go: () => nav.navigate('PurchaseOrders'),
                    show: isBoss,
                },
                {
                    icon: 'pot-steam-outline',
                    title: 'Kitchen board',
                    go: () => nav.navigate('Tabs', { screen: 'Kitchen' }),
                    show: role === 'waiter',
                },
            ],
        },
        {
            title: 'Restaurant',
            rows: [
                {
                    icon: 'food-variant',
                    title: 'Menu',
                    subtitle: 'Prices, photos, sold-out switches',
                    go: () => nav.navigate('MenuAdmin'),
                    show: isAdmin,
                },
                {
                    icon: 'account-group-outline',
                    title: 'Staff',
                    subtitle: 'Add chefs, waiters, managers',
                    go: () => nav.navigate('StaffList'),
                    show: isAdmin,
                },
                {
                    icon: 'star-outline',
                    title: 'Reviews',
                    subtitle: 'What guests are saying',
                    go: () => nav.navigate('AdminReviews'),
                    tint: colors.gold,
                    show: isAdmin,
                },
                {
                    icon: 'storefront-outline',
                    title: 'Restaurant settings',
                    subtitle: 'Hours, address, cover photo',
                    go: () => nav.navigate('RestaurantSettings'),
                    show: isAdmin,
                },
            ],
        },
        {
            title: 'Account',
            rows: [
                {
                    icon: 'bell-outline',
                    title: 'Notifications',
                    subtitle: unread.data?.unread ? `${unread.data.unread} unread` : undefined,
                    go: () => nav.navigate('Notifications'),
                    tint: colors.info,
                    show: true,
                },
                {
                    icon: 'account-edit-outline',
                    title: 'Edit profile',
                    go: () => nav.navigate('EditProfile'),
                    tint: colors.success,
                    show: true,
                },
                {
                    icon: 'lock-reset',
                    title: 'Change password',
                    go: () => nav.navigate('ChangePassword'),
                    tint: colors.textMuted,
                    show: true,
                },
            ],
        },
    ];
    return (
        <Screen>
            <Body>
                <Animated.View entering={FadeInDown.springify()}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <Avatar name={user?.name} size={60} />
                        <View style={{ flex: 1, gap: 3 }}>
                            <Txt variant="h2">{user?.name}</Txt>
                            <Txt variant="small">{user?.email ?? user?.phone}</Txt>
                            <Pill
                                label={user?.staff?.position ?? titleCase(role)}
                                icon={isAdmin ? 'shield-crown' : 'badge-account'}
                                fg={colors.primary}
                                bg={colors.primaryLight}
                            />
                        </View>
                    </Card>
                </Animated.View>
                {sections.map((s, i) => {
                    const rows = s.rows.filter((r) => r.show);
                    if (!rows.length) return null;
                    return (
                        <Animated.View key={s.title} entering={FadeInDown.delay(80 + i * 70).springify()} style={{ gap: 8 }}>
                            <Txt variant="smallMedium">{s.title.toUpperCase()}</Txt>
                            <Card style={{ paddingVertical: 4 }}>
                                {rows.map((r) => (
                                    <ListRow
                                        key={r.title}
                                        icon={r.icon}
                                        title={r.title}
                                        subtitle={r.subtitle}
                                        onPress={r.go}
                                        tint={r.tint}
                                    />
                                ))}
                            </Card>
                        </Animated.View>
                    );
                })}
                <Card style={{ paddingVertical: 4 }}>
                    <ListRow
                        icon="logout"
                        title="Log out"
                        danger
                        right={<View />}
                        onPress={() =>
                            Alert.alert('Log out?', undefined, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Log out', style: 'destructive', onPress: () => logout() },
                            ])
                        }
                    />
                </Card>
            </Body>
        </Screen>
    );
}
