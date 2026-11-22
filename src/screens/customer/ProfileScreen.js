import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { usersApi } from '../../api/endpoints';
import { colors, radius, shadow } from '../../theme';
import { money } from '../../utils/format';
import { useAuth } from '../../store/auth';
import { AnimatedNumber, Avatar, Body, Card, Icon, ListRow, PressableScale, Screen, Txt } from '../../components/ui';
export function ProfileScreen() {
    const nav = useNavigation();
    const logout = useAuth((s) => s.logout);
    const user = useAuth((s) => s.user);
    const q = useQuery({ queryKey: ['profile'], queryFn: usersApi.profile });
    const p = q.data;
    const stats = [
        { l: 'Orders', v: p?.stats.completedOrders ?? 0, icon: 'receipt' },
        { l: 'Bookings', v: p?.stats.upcomingReservations ?? 0, icon: 'calendar-check' },
        { l: 'Reviews', v: p?.stats.reviews ?? 0, icon: 'star' },
    ];
    return (
        <Screen>
            <Body refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
                <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', gap: 6, paddingTop: 10 }}>
                    <Avatar name={p?.name ?? user?.name} size={88} />
                    <Txt variant="h1">{p?.name ?? user?.name}</Txt>
                    <Txt variant="small">{p?.email ?? p?.phone ?? user?.email}</Txt>
                </Animated.View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {stats.map((s, i) => (
                        <Animated.View key={s.l} entering={FadeInDown.delay(80 + i * 60).springify()} style={{ flex: 1 }}>
                            <Card style={{ alignItems: 'center', gap: 2, paddingVertical: 14 }}>
                                <Icon name={s.icon} size={20} color={colors.primary} />
                                <AnimatedNumber value={s.v} variant="h2" />
                                <Txt variant="tiny">{s.l}</Txt>
                            </Card>
                        </Animated.View>
                    ))}
                </View>

                <Animated.View entering={FadeInDown.delay(260).springify()}>
                    <PressableScale onPress={() => nav.navigate('Wallet')} style={[styles.wallet, shadow(2)]}>
                        <LinearGradient
                            colors={[colors.dark, '#5A1A12', colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.walletCircle} />
                        <View style={{ flex: 1, gap: 2 }}>
                            <Txt variant="smallMedium" color="#E6C7BC">
                                Wallet balance
                            </Txt>
                            <AnimatedNumber value={p?.stats.walletBalance ?? 0} format={money} variant="h1" color={colors.white} />
                            <Txt variant="tiny" color={colors.gold}>
                                Tap to top up or see history
                            </Txt>
                        </View>
                        <View style={styles.walletIcon}>
                            <Icon name="wallet" size={26} color={colors.gold} />
                        </View>
                    </PressableScale>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(320).springify()}>
                    <Card style={{ paddingVertical: 6 }}>
                        <ListRow
                            icon="receipt-text-outline"
                            title="My orders"
                            subtitle={p?.stats.activeOrders ? `${p.stats.activeOrders} in progress` : 'Track and reorder'}
                            onPress={() => nav.navigate('Tabs', { screen: 'Orders' })}
                        />
                        <ListRow
                            icon="calendar-month-outline"
                            title="My bookings"
                            onPress={() => nav.navigate('Tabs', { screen: 'Bookings' })}
                        />
                        <ListRow icon="star-outline" title="My reviews" onPress={() => nav.navigate('MyReviews')} tint={colors.gold} />
                        <ListRow
                            icon="bell-outline"
                            title="Notifications"
                            onPress={() => nav.navigate('Notifications')}
                            tint={colors.info}
                        />
                    </Card>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(380).springify()}>
                    <Card style={{ paddingVertical: 6 }}>
                        <ListRow
                            icon="account-edit-outline"
                            title="Edit profile"
                            onPress={() => nav.navigate('EditProfile')}
                            tint={colors.success}
                        />
                        <ListRow
                            icon="lock-reset"
                            title="Change password"
                            onPress={() => nav.navigate('ChangePassword')}
                            tint={colors.textMuted}
                        />
                        <ListRow icon="map-marker-outline" title="Find the restaurant" onPress={() => nav.navigate('Map')} />
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
                </Animated.View>
                <Txt variant="tiny" center>
                    Chinatown v1.0 · Made for FYP
                </Txt>
            </Body>
        </Screen>
    );
}
const styles = StyleSheet.create({
    wallet: { borderRadius: radius.xl, padding: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', minHeight: 120 },
    walletCircle: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        right: -50,
        top: -60,
        backgroundColor: 'rgba(230,169,58,0.12)',
    },
    walletIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: 'rgba(230,169,58,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
