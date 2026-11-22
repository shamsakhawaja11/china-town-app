import React, { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { adminApi, inventoryApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { titleCase } from '../../utils/format';
import { ingredientIcon } from '../../utils/dishVisual';
import { toast } from '../../store/toast';
import { Body, BottomBar, Button, CheckboxGroup, Chip, Header, Input, RadioGroup, Screen, Txt } from '../../components/ui';
const CATS = ['meat', 'seafood', 'vegetables', 'dry_goods', 'sauces', 'dairy', 'beverages', 'other'];
const UNITS = ['kg', 'g', 'l', 'ml', 'pcs'];
export function AddInventoryItemScreen({ navigation }) {
    const qc = useQueryClient();
    const ingredients = useQuery({ queryKey: ['ingredients'], queryFn: adminApi.ingredients, retry: false });
    const inv = useQuery({ queryKey: ['inventory', 'all', 'all', ''], queryFn: () => inventoryApi.list({}) });
    const tracked = new Set(inv.data?.items.map((i) => i.ingredientId));
    const untracked = (ingredients.data ?? []).filter((i) => !tracked.has(i.id));
    const [mode, setMode] = useState('new');
    const [ingredientId, setIngredientId] = useState(null);
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('kg');
    const [diet, setDiet] = useState(['veg']);
    const [category, setCategory] = useState('vegetables');
    const [f, setF] = useState({ current: '', reorder: '', par: '', cost: '', supplier: '' });
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const n = (s) => (s.trim() ? Number(s) : undefined);
    const ok = (mode === 'new' ? name.trim().length > 1 : !!ingredientId) && f.reorder.trim() !== '';
    const save = useMutation({
        mutationFn: () =>
            inventoryApi.create({
                ...(mode === 'new'
                    ? {
                          newIngredient: {
                              name: name.trim(),
                              unit,
                              isVegetarian: diet.includes('veg') || diet.includes('vegan'),
                              isVegan: diet.includes('vegan'),
                          },
                      }
                    : { ingredientId }),
                category,
                currentQuantity: n(f.current),
                reorderLevel: Number(f.reorder) || 0,
                parLevel: n(f.par),
                unitCost: n(f.cost),
                defaultSupplier: f.supplier.trim() || undefined,
            }),
        onSuccess: (item) => {
            toast.success('Item added', item.name);
            qc.invalidateQueries({ queryKey: ['inventory'] });
            navigation.replace('InventoryItem', { id: item.id });
        },
        onError: (e) => toast.error("Couldn't add item", errorMessage(e)),
    });
    return (
        <Screen>
            <Header title="Add item" />
            <Body>
                {untracked.length ? (
                    <RadioGroup
                        value={mode}
                        onChange={setMode}
                        options={[
                            { value: 'new', label: 'New ingredient', icon: 'plus-box-outline' },
                            {
                                value: 'existing',
                                label: 'Existing ingredient',
                                description: `${untracked.length} not tracked yet`,
                                icon: 'format-list-checks',
                            },
                        ]}
                    />
                ) : null}

                {mode === 'new' ? (
                    <Animated.View entering={FadeInDown} style={{ gap: 14 }}>
                        <Input label="Name" icon="food-apple-outline" placeholder="e.g. Bok choy" value={name} onChangeText={setName} />
                        <Txt variant="smallMedium">Unit</Txt>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {UNITS.map((u) => (
                                <Chip
                                    key={u}
                                    label={u}
                                    active={unit === u}
                                    onPress={() => setUnit(u)}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                />
                            ))}
                        </View>
                        <CheckboxGroup
                            columns={2}
                            values={diet}
                            onChange={(v) => setDiet(v.includes('vegan') && !v.includes('veg') ? [...v, 'veg'] : v)}
                            options={[
                                { value: 'veg', label: 'Vegetarian' },
                                { value: 'vegan', label: 'Vegan' },
                            ]}
                        />
                    </Animated.View>
                ) : (
                    <RadioGroup
                        value={ingredientId}
                        onChange={setIngredientId}
                        options={untracked.map((i) => ({ value: i.id, label: i.name, description: i.unit, icon: 'food-variant' }))}
                    />
                )}

                <Txt variant="smallMedium">Category</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {CATS.map((c) => (
                        <Chip
                            key={c}
                            small
                            icon={ingredientIcon(c)}
                            label={titleCase(c)}
                            active={category === c}
                            onPress={() => setCategory(c)}
                        />
                    ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Opening stock"
                        keyboardType="decimal-pad"
                        placeholder="0"
                        value={f.current}
                        onChangeText={set('current')}
                    />
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Reorder at *"
                        keyboardType="decimal-pad"
                        placeholder="e.g. 2"
                        value={f.reorder}
                        onChangeText={set('reorder')}
                    />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Target level"
                        keyboardType="decimal-pad"
                        placeholder="Auto"
                        value={f.par}
                        onChangeText={set('par')}
                    />
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Cost / unit (Rs)"
                        keyboardType="decimal-pad"
                        placeholder="0"
                        value={f.cost}
                        onChangeText={set('cost')}
                    />
                </View>
                <Input
                    label="Default supplier"
                    icon="store-outline"
                    placeholder="Optional"
                    value={f.supplier}
                    onChangeText={set('supplier')}
                />
            </Body>
            <BottomBar>
                <Button title="Add to inventory" icon="check" disabled={!ok} loading={save.isPending} onPress={() => save.mutate()} />
            </BottomBar>
        </Screen>
    );
}
