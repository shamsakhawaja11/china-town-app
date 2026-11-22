import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { cartApi, reservationsApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { dateTime, money } from '../../utils/format';
import { useCart, CART_KEY } from '../../hooks/useCart';
import { toast } from '../../store/toast';
import {
    Body,
    BottomBar,
    Button,
    Card,
    DishImage,
    Divider,
    EmptyState,
    Header,
    Icon,
    IconButton,
    Input,
    KV,
    ListSkeleton,
    PressableScale,
    RadioGroup,
    Screen,
    Stepper,
    Txt,
} from '../../components/ui';
export function CartScreen({ navigation }) {
    const qc = useQueryClient();
    const { cart, query, setQty, remove, clear, update } = useCart();
    const [notes, setNotes] = useState('');
    const [seat, setSeat] = useState('table');
    useEffect(() => {
        if (cart?.notes) setNotes(cart.notes);
        if (cart?.reservation) setSeat('booking');
    }, [cart?.id]);
    const bookings = useQuery({
        queryKey: ['reservations', 'mine', 'upcoming'],
        queryFn: () => reservationsApi.mine('upcoming'),
        select: (d) => d.items.filter((r) => r.status === 'confirmed' || r.status === 'seated'),
    });
    const checkout = useMutation({
        mutationFn: () =>
            cartApi.checkout({
                orderType: cart?.orderType,
                notes: notes.trim() || null,
                ...(cart?.orderType === 'dine_in'
                    ? seat === 'booking'
                        ? { reservationId: cart?.reservation?.id ?? null, tableId: null }
                        : { tableId: cart?.tables?.[0]?.id ?? null, reservationId: null }
                    : {}),
            }),
        onSuccess: (order) => {
            qc.invalidateQueries({ queryKey: CART_KEY });
            qc.invalidateQueries({ queryKey: ['orders'] });
            navigation.replace('OrderTracking', { id: order.id, justPlaced: true });
        },
        onError: (e) => toast.error("Couldn't place order", errorMessage(e)),
    });
    if (query.isLoading) {
        return (
            <Screen>
                <Header title="My cart" />
                <ListSkeleton rows={3} />
            </Screen>
        );
    }
    if (!cart || cart.items.length === 0) {
        return (
            <Screen>
                <Header title="My cart" />
                <EmptyState
                    icon="cart-outline"
                    title="Your cart is empty"
                    message="Add a few dishes from the menu and they'll show up here."
                    action="Browse menu"
                    onAction={() => navigation.navigate('Tabs', { screen: 'Menu' })}
                />
            </Screen>
        );
    }
    const isDineIn = cart.orderType === 'dine_in';
    const table = cart.tables?.[0];
    const needsSeat = isDineIn && (seat === 'table' ? !table : !cart.reservation);
    const setType = (t) => update.mutate({ orderType: t });
    return (
        <Screen>
            <Header
                title="My cart"
                subtitle={`${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}`}
                right={
                    <IconButton
                        icon="delete-sweep-outline"
                        color={colors.danger}
                        onPress={() =>
                            Alert.alert('Clear cart?', 'This removes every item.', [
                                { text: 'Keep', style: 'cancel' },
                                { text: 'Clear', style: 'destructive', onPress: () => clear.mutate() },
                            ])
                        }
                    />
                }
            />
            <Body>
                {cart.items.map((line, i) => (
                    <Animated.View
                        key={line.id}
                        entering={FadeInDown.delay(i * 50).springify()}
                        exiting={FadeOutLeft}
                        layout={LinearTransition.springify()}
                    >
                        <Card style={{ flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center' }}>
                            <DishImage uri={line.imageUrl} size={64} radius={14} />
                            <View style={{ flex: 1, gap: 2 }}>
                                <Txt variant="bodyMedium" numberOfLines={1}>
                                    {line.name}
                                </Txt>
                                <Txt variant="small">{money(line.unitPrice)} each</Txt>
                                {line.specialInstructions ? (
                                    <Txt variant="tiny" color={colors.gold} numberOfLines={1}>
                                        “{line.specialInstructions}”
                                    </Txt>
                                ) : null}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                    <Txt variant="price">{money(line.subtotal)}</Txt>
                                    <Stepper
                                        value={line.quantity}
                                        size="sm"
                                        onChange={(q) =>
                                            q === 0 ? remove.mutate(line.id) : setQty.mutate({ lineId: line.id, quantity: q })
                                        }
                                    />
                                </View>
                            </View>
                        </Card>
                    </Animated.View>
                ))}

                <PressableScale
                    onPress={() => navigation.navigate('Tabs', { screen: 'Menu' })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', padding: 6 }}
                >
                    <Icon name="plus-circle-outline" size={20} color={colors.primary} />
                    <Txt variant="bodyMedium" color={colors.primary}>
                        Add more dishes
                    </Txt>
                </PressableScale>

                <Txt variant="h3">How would you like it?</Txt>
                <RadioGroup
                    value={cart.orderType}
                    onChange={setType}
                    options={[
                        { value: 'dine_in', label: 'Dine in', description: 'Eat at the restaurant', icon: 'silverware-fork-knife' },
                        { value: 'takeaway', label: 'Takeaway', description: "Pick up — we'll give you a code", icon: 'shopping-outline' },
                    ]}
                />

                {isDineIn ? (
                    <Animated.View entering={FadeInDown.springify()} style={{ gap: 10 }}>
                        <Txt variant="h3">Where are you sitting?</Txt>
                        <RadioGroup
                            value={seat}
                            onChange={setSeat}
                            options={[
                                {
                                    value: 'table',
                                    label: table ? `Table ${table.table_number}` : 'Choose a table',
                                    description: table ? 'Tap to change' : 'Pick from the floor plan',
                                    icon: 'table-chair',
                                },
                                {
                                    value: 'booking',
                                    label: 'My reservation',
                                    description: bookings.data?.length
                                        ? `${bookings.data.length} confirmed booking(s)`
                                        : 'No confirmed booking yet',
                                    icon: 'calendar-check',
                                    disabled: !bookings.data?.length,
                                },
                            ]}
                        />
                        {seat === 'table' ? (
                            <Button
                                title={table ? 'Change table' : 'Open floor plan'}
                                variant="secondary"
                                icon="floor-plan"
                                onPress={() => navigation.navigate('TablePicker', { mode: 'walkin' })}
                            />
                        ) : (
                            <RadioGroup
                                value={cart.reservation?.id ?? null}
                                onChange={(id) => update.mutate({ reservationId: id })}
                                options={(bookings.data ?? []).map((b) => ({
                                    value: b.id,
                                    label: `${dateTime(b.reservationTime)}`,
                                    description: `Party of ${b.partySize} · ${b.tables.map((t) => t.tableNumber).join(', ')}`,
                                    icon: 'calendar-star',
                                }))}
                            />
                        )}
                    </Animated.View>
                ) : null}

                <Input
                    label="Notes for the kitchen"
                    icon="message-text-outline"
                    placeholder="Allergies, celebration, cutlery…"
                    value={notes}
                    onChangeText={setNotes}
                    maxLength={500}
                />

                <Card style={{ gap: 2 }}>
                    <KV label="Subtotal" value={money(cart.subtotal)} />
                    <KV label={`Tax (${cart.taxRatePercent}%)`} value={money(cart.tax)} />
                    <Divider dashed />
                    <KV label="Total" value={money(cart.total)} bold big color={colors.primary} />
                </Card>
            </Body>
            <BottomBar>
                {needsSeat ? (
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Icon name="information-outline" size={16} color={colors.warning} />
                        <Txt variant="small" color={colors.warning}>
                            Choose your table or booking to place a dine-in order.
                        </Txt>
                    </View>
                ) : null}
                <Button
                    title={`Place order · ${money(cart.total)}`}
                    icon="check-circle-outline"
                    disabled={needsSeat}
                    loading={checkout.isPending}
                    onPress={() => checkout.mutate()}
                />
            </BottomBar>
        </Screen>
    );
}
