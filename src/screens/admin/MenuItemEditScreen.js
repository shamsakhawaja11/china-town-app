import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { pickImage } from '../../lib/pickImage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { num } from '../../utils/format';
import { spiceLabel } from '../../utils/status';
import { toast } from '../../store/toast';
import {
    Body,
    BottomBar,
    Button,
    Chip,
    DishImage,
    Header,
    Input,
    ListSkeleton,
    PressableScale,
    Screen,
    Icon,
    Toggle,
    Txt,
} from '../../components/ui';
export function MenuItemEditScreen({ route, navigation }) {
    const { id } = route.params;
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['menu', 'item', id], queryFn: () => menuApi.item(id) });
    const [f, setF] = useState({ name: '', description: '', price: '', prep: '', spice: 'none', available: true, imageUrl: null });
    const [uploading, setUploading] = useState(false);
    useEffect(() => {
        if (q.data)
            setF({
                name: q.data.name,
                description: q.data.description ?? '',
                price: String(num(q.data.price)),
                prep: q.data.preparation_time_minutes ? String(q.data.preparation_time_minutes) : '',
                spice: q.data.spice_level,
                available: q.data.is_available,
                imageUrl: q.data.image_url,
            });
    }, [q.data]);
    const pickPhoto = async () => {
        let picked;
        try {
            picked = await pickImage();
        } catch (e) {
            return toast.error("Couldn't open photos", e.message);
        }
        if (!picked) return;
        setUploading(true);
        try {
            const path = await menuApi.uploadImage(picked.uri, picked.type, picked.fileName);
            setF((x) => ({ ...x, imageUrl: path }));
            toast.success('Photo uploaded', 'Save to apply it.');
        } catch (e) {
            toast.error('Upload failed', errorMessage(e));
        } finally {
            setUploading(false);
        }
    };
    const save = useMutation({
        mutationFn: () =>
            menuApi.updateItem(id, {
                name: f.name.trim(),
                description: f.description.trim() || undefined,
                price: Number(f.price),
                preparationTimeMinutes: f.prep ? Number(f.prep) : undefined,
                spiceLevel: f.spice,
                isAvailable: f.available,
                ...(f.imageUrl ? { imageUrl: f.imageUrl } : {}),
            }),
        onSuccess: () => {
            toast.success('Dish updated');
            qc.invalidateQueries({ queryKey: ['menu'] });
            qc.invalidateQueries({ queryKey: ['admin', 'menu'] });
            navigation.goBack();
        },
        onError: (e) => toast.error("Couldn't save", errorMessage(e)),
    });
    if (!q.data) {
        return (
            <Screen>
                <Header title="Edit dish" />
                <ListSkeleton rows={2} />
            </Screen>
        );
    }
    return (
        <Screen>
            <Header title="Edit dish" subtitle={q.data.category.name} />
            <Body>
                <PressableScale onPress={pickPhoto} style={{ alignSelf: 'center' }}>
                    <DishImage uri={f.imageUrl} category={q.data.category.name} size={150} radius={28} />
                    <View
                        style={{
                            position: 'absolute',
                            right: -6,
                            bottom: -6,
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 3,
                            borderColor: colors.bg,
                        }}
                    >
                        <Icon name={uploading ? 'loading' : 'camera'} size={20} color={colors.white} />
                    </View>
                </PressableScale>
                <Input label="Name" value={f.name} onChangeText={(name) => setF((x) => ({ ...x, name }))} />
                <Input
                    label="Description"
                    multiline
                    value={f.description}
                    onChangeText={(description) => setF((x) => ({ ...x, description }))}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Price (Rs)"
                        keyboardType="decimal-pad"
                        value={f.price}
                        onChangeText={(price) => setF((x) => ({ ...x, price }))}
                    />
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Prep time (min)"
                        keyboardType="number-pad"
                        value={f.prep}
                        onChangeText={(prep) => setF((x) => ({ ...x, prep }))}
                    />
                </View>
                <Txt variant="smallMedium">Spice level</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Object.keys(spiceLabel).map((s) => (
                        <Chip
                            key={s}
                            small
                            label={spiceLabel[s]}
                            active={f.spice === s}
                            onPress={() => setF((x) => ({ ...x, spice: s }))}
                        />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Txt variant="bodyMedium">Available to order</Txt>
                    <Toggle value={f.available} onChange={(available) => setF((x) => ({ ...x, available }))} />
                </View>
            </Body>
            <BottomBar>
                <Button
                    title="Save dish"
                    icon="content-save-outline"
                    disabled={!f.name.trim() || !(Number(f.price) >= 1) || uploading}
                    loading={save.isPending}
                    onPress={() => save.mutate()}
                />
            </BottomBar>
        </Screen>
    );
}
