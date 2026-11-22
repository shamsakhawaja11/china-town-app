import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { inventoryApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors, radius } from '../../theme';
import { dateTime, money, qty } from '../../utils/format';
import { poStatus } from '../../utils/status';
import { toast } from '../../store/toast';
import {
    Body,
    BottomBar,
    Button,
    Card,
    Divider,
    EmptyState,
    Header,
    Icon,
    KV,
    ListSkeleton,
    Pill,
    Screen,
    Stepper,
    Txt,
} from '../../components/ui';
export function PurchaseOrderScreen({ route, navigation }) {
    const { id } = route.params;
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['inventory', 'po', 'one', id], queryFn: () => inventoryApi.purchaseOrder(id) });
    const [received, setReceived] = useState({});
    useEffect(() => {
        if (q.data) setReceived(Object.fromEntries(q.data.items.map((i) => [i.id, i.quantityPending])));
    }, [q.data]);
    const after = (msg) => {
        toast.success(msg);
        qc.invalidateQueries({ queryKey: ['inventory'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
    };
    const receive = useMutation({
        mutationFn: () =>
            inventoryApi.receive(
                id,
                Object.entries(received)
                    .filter(([, v]) => v > 0)
                    .map(([purchaseOrderItemId, quantityReceived]) => ({ purchaseOrderItemId, quantityReceived })),
            ),
        onSuccess: (po) => after(po.status === 'received' ? 'Delivery received · stock updated' : 'Partial delivery saved'),
        onError: (e) => toast.error("Couldn't receive", errorMessage(e)),
    });
    const cancel = useMutation({
        mutationFn: () => inventoryApi.cancelPurchaseOrder(id),
        onSuccess: () => {
            after('Purchase order cancelled');
            navigation.goBack();
        },
        onError: (e) => toast.error("Couldn't cancel", errorMessage(e)),
    });
    const po = q.data;
    if (q.isLoading) {
        return (
            <Screen>
                <Header title="Purchase order" />
                <ListSkeleton />
            </Screen>
        );
    }
    if (!po) {
        return (
            <Screen>
                <Header title="Purchase order" />
                <EmptyState tone="error" title="Not found" />
            </Screen>
        );
    }
    const tone = poStatus[po.status];
    const open = po.status === 'ordered' || po.status === 'partially_received';
    const receiving = Object.values(received).filter((v) => v > 0).length;
    return (
        <Screen>
            <Header
                title={po.poNumber}
                subtitle={po.supplierName ?? undefined}
                right={<Pill label={tone.label} fg={tone.fg} bg={tone.bg} />}
            />
            <Body>
                <Card style={{ gap: 4 }}>
                    <KV label="Ordered" value={dateTime(po.orderedAt)} />
                    {po.expectedAt ? <KV label="Expected" value={dateTime(po.expectedAt)} /> : null}
                    {po.receivedAt ? <KV label="Received" value={dateTime(po.receivedAt)} /> : null}
                    {po.createdBy ? <KV label="By" value={po.createdBy.name} /> : null}
                    <Divider />
                    <KV label="Total" value={money(po.totalCost)} bold big color={colors.primary} />
                </Card>
                {po.notes ? <Txt variant="small">{po.notes}</Txt> : null}
                <Txt variant="h3">{open ? 'What arrived?' : 'Items'}</Txt>
                {po.items.map((i, idx) => (
                    <Animated.View key={i.id} entering={FadeInDown.delay(idx * 50).springify()}>
                        <Card style={{ gap: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Icon
                                    name={i.quantityPending === 0 ? 'check-circle' : 'package-variant'}
                                    size={22}
                                    color={i.quantityPending === 0 ? colors.success : colors.textMuted}
                                />
                                <View style={{ flex: 1 }}>
                                    <Txt variant="bodyMedium">{i.name}</Txt>
                                    <Txt variant="tiny">
                                        {qty(i.quantityReceived)} / {qty(i.quantityOrdered, i.unit)} received · {money(i.unitCost)}/{i.unit}
                                    </Txt>
                                </View>
                                <Txt variant="bodyMedium">{money(i.lineTotal)}</Txt>
                            </View>
                            {open && i.quantityPending > 0 ? (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: colors.bg,
                                        borderRadius: radius.md,
                                        padding: 10,
                                    }}
                                >
                                    <Txt variant="small">Received now</Txt>
                                    <Stepper
                                        size="sm"
                                        value={received[i.id] ?? 0}
                                        min={0}
                                        max={i.quantityPending}
                                        step={i.unit === 'pcs' ? 10 : 0.5}
                                        format={(v) => qty(v, i.unit)}
                                        onChange={(v) => setReceived((r) => ({ ...r, [i.id]: v }))}
                                    />
                                </View>
                            ) : null}
                        </Card>
                    </Animated.View>
                ))}
                {po.status === 'ordered' ? (
                    <Button
                        title="Cancel purchase order"
                        variant="ghost"
                        icon="cancel"
                        loading={cancel.isPending}
                        onPress={() =>
                            Alert.alert('Cancel this order?', undefined, [
                                { text: 'No' },
                                { text: 'Cancel order', style: 'destructive', onPress: () => cancel.mutate() },
                            ])
                        }
                    />
                ) : null}
            </Body>
            {open ? (
                <BottomBar>
                    <Button
                        title={receiving ? `Receive ${receiving} item${receiving > 1 ? 's' : ''}` : 'Set quantities'}
                        icon="truck-check-outline"
                        variant="success"
                        disabled={!receiving}
                        loading={receive.isPending}
                        onPress={() => receive.mutate()}
                    />
                </BottomBar>
            ) : null}
        </Screen>
    );
}
