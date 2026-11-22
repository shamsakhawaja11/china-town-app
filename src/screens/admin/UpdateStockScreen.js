import React, { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { inventoryApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { qty } from '../../utils/format';
import { appRoleOf, useAuth } from '../../store/auth';
import { toast } from '../../store/toast';
import { Body, BottomBar, Button, Card, Chip, Header, Icon, Input, RadioGroup, Screen, Stepper, Txt } from '../../components/ui';
export function UpdateStockScreen({ route, navigation }) {
    const { id, name, unit, current } = route.params;
    const qc = useQueryClient();
    const isChef = appRoleOf(useAuth((s) => s.user)) === 'chef';
    const [type, setType] = useState(isChef ? 'usage' : 'purchase');
    const [amount, setAmount] = useState(type === 'adjustment' ? current : 1);
    const [cost, setCost] = useState('');
    const [supplier, setSupplier] = useState('');
    const [reason, setReason] = useState('');
    const step = unit === 'pcs' ? 1 : unit === 'kg' || unit === 'l' ? 0.5 : 1;
    const after = type === 'purchase' ? current + amount : type === 'adjustment' ? amount : current - amount;
    const invalid = after < 0 || (type !== 'adjustment' && amount <= 0) || (type === 'adjustment' && amount === current);
    const save = useMutation({
        mutationFn: () =>
            inventoryApi.adjust(id, {
                type,
                quantity: amount,
                unitCost: type === 'purchase' && cost ? Number(cost) : undefined,
                supplier: type === 'purchase' && supplier.trim() ? supplier.trim() : undefined,
                reason: reason.trim() || undefined,
            }),
        onSuccess: (r) => {
            toast.success('Stock updated', `${name}: ${qty(r.currentQuantity, unit)}`);
            qc.invalidateQueries({ queryKey: ['inventory'] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
            navigation.goBack();
        },
        onError: (e) => toast.error("Couldn't update stock", errorMessage(e)),
    });
    return (
        <Screen>
            <Header title="Update stock" subtitle={name} />
            <Body>
                <RadioGroup
                    value={type}
                    onChange={(t) => {
                        setType(t);
                        setAmount(t === 'adjustment' ? current : 1);
                    }}
                    options={[
                        {
                            value: 'purchase',
                            label: 'Purchase / delivery',
                            description: 'Add stock',
                            icon: 'truck-delivery-outline',
                            disabled: isChef,
                        },
                        { value: 'usage', label: 'Kitchen use', description: 'Remove stock used outside orders', icon: 'chef-hat' },
                        { value: 'waste', label: 'Waste', description: 'Spoiled, dropped or expired', icon: 'delete-outline' },
                        {
                            value: 'adjustment',
                            label: 'Stock count',
                            description: 'Set the counted amount',
                            icon: 'clipboard-check-outline',
                            disabled: isChef,
                        },
                    ]}
                />

                <Animated.View entering={FadeInDown.springify()}>
                    <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 22 }}>
                        <Txt variant="smallMedium">
                            {type === 'adjustment' ? 'Counted quantity' : 'Quantity'} ({unit})
                        </Txt>
                        <Stepper value={amount} onChange={setAmount} min={0} max={100000} size="lg" step={step} format={(v) => qty(v)} />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {(unit === 'pcs' ? [10, 50, 100] : [1, 5, 10]).map((v) => (
                                <Chip
                                    key={v}
                                    small
                                    label={`${type === 'adjustment' ? '' : '+'}${v}`}
                                    onPress={() => setAmount((a) => Math.round((type === 'adjustment' ? v : a + v) * 1000) / 1000)}
                                />
                            ))}
                        </View>
                        <Input
                            containerStyle={{ alignSelf: 'stretch' }}
                            keyboardType="decimal-pad"
                            value={String(amount)}
                            onChangeText={(t) => setAmount(Number(t.replace(/[^0-9.]/g, '')) || 0)}
                            icon="pencil-outline"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Txt variant="bodyMedium">{qty(current, unit)}</Txt>
                            <Icon name="arrow-right" size={18} color={colors.textMuted} />
                            <Animated.View key={after} entering={FadeIn}>
                                <Txt variant="h2" color={after < 0 ? colors.danger : colors.primary}>
                                    {qty(Math.max(after, 0), unit)}
                                </Txt>
                            </Animated.View>
                        </View>
                        {after < 0 ? (
                            <Txt variant="small" color={colors.danger}>
                                Not enough stock
                            </Txt>
                        ) : null}
                    </Card>
                </Animated.View>

                {type === 'purchase' ? (
                    <Animated.View entering={FadeInDown} style={{ gap: 14 }}>
                        <Input
                            label="Supplier"
                            icon="store-outline"
                            placeholder="e.g. Fresh Farm Veggies"
                            value={supplier}
                            onChangeText={setSupplier}
                        />
                        <Input
                            label={`Cost per ${unit} (Rs)`}
                            icon="cash"
                            keyboardType="decimal-pad"
                            placeholder="Optional, updates unit cost"
                            value={cost}
                            onChangeText={setCost}
                        />
                    </Animated.View>
                ) : null}
                <Input
                    label="Note"
                    icon="message-text-outline"
                    placeholder={type === 'waste' ? 'What happened?' : 'Optional'}
                    value={reason}
                    onChangeText={setReason}
                    maxLength={300}
                />
            </Body>
            <BottomBar>
                <Button
                    title="Save"
                    icon="content-save-outline"
                    disabled={invalid}
                    loading={save.isPending}
                    onPress={() => save.mutate()}
                />
            </BottomBar>
        </Screen>
    );
}
