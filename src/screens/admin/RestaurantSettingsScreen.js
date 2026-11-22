import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { pickImage } from '../../lib/pickImage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { menuApi, restaurantApi } from '../../api/endpoints';
import { assetUri, errorMessage } from '../../api/client';
import { colors, radius } from '../../theme';
import { toast } from '../../store/toast';
import { Body, BottomBar, Button, Header, Icon, Input, ListSkeleton, PressableScale, Screen, Txt } from '../../components/ui';
import { Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export function RestaurantSettingsScreen({ navigation }) {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['restaurant'], queryFn: restaurantApi.get });
    const [f, setF] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        opening: '',
        closing: '',
        lat: '',
        lng: '',
        image: null,
    });
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    useEffect(() => {
        const r = q.data;
        if (r)
            setF({
                name: r.name,
                description: r.description ?? '',
                address: r.address,
                phone: r.phone ?? '',
                opening: r.opening_time,
                closing: r.closing_time,
                lat: r.latitude?.toString() ?? '',
                lng: r.longitude?.toString() ?? '',
                image: r.image_url,
            });
    }, [q.data]);
    const pick = async () => {
        try {
            const picked = await pickImage();
            if (!picked) return;
            const path = await menuApi.uploadImage(picked.uri, picked.type, picked.fileName);
            setF((x) => ({ ...x, image: path }));
        } catch (e) {
            toast.error('Upload failed', errorMessage(e));
        }
    };
    const timesOk = TIME.test(f.opening) && TIME.test(f.closing) && f.closing > f.opening;
    const save = useMutation({
        mutationFn: () =>
            restaurantApi.update({
                name: f.name.trim(),
                description: f.description.trim() || null,
                address: f.address.trim(),
                phone: f.phone.trim() || null,
                opening_time: f.opening,
                closing_time: f.closing,
                latitude: f.lat ? Number(f.lat) : null,
                longitude: f.lng ? Number(f.lng) : null,
                image_url: f.image,
            }),
        onSuccess: () => {
            toast.success('Restaurant updated');
            qc.invalidateQueries({ queryKey: ['restaurant'] });
            navigation.goBack();
        },
        onError: (e) => toast.error("Couldn't save", errorMessage(e)),
    });
    if (!q.data) {
        return (
            <Screen>
                <Header title="Restaurant" />
                <ListSkeleton rows={3} />
            </Screen>
        );
    }
    return (
        <Screen>
            <Header title="Restaurant settings" />
            <Body>
                <PressableScale onPress={pick} style={{ height: 160, borderRadius: radius.xl, overflow: 'hidden' }}>
                    {f.image ? (
                        <Image source={{ uri: assetUri(f.image) }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <LinearGradient
                            colors={[colors.primaryDark, colors.primary]}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Icon name="image-plus" size={36} color={colors.white} />
                        </LinearGradient>
                    )}
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 10,
                            right: 10,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 999,
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                        }}
                    >
                        <Txt variant="tiny" color={colors.white}>
                            Change cover photo
                        </Txt>
                    </View>
                </PressableScale>
                <Input label="Name" icon="storefront-outline" value={f.name} onChangeText={set('name')} />
                <Input label="Description" multiline value={f.description} onChangeText={set('description')} />
                <Input label="Address" icon="map-marker-outline" value={f.address} onChangeText={set('address')} />
                <Input label="Phone" icon="phone-outline" keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Opens"
                        icon="clock-start"
                        placeholder="12:00"
                        value={f.opening}
                        onChangeText={set('opening')}
                        maxLength={5}
                    />
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Closes"
                        icon="clock-end"
                        placeholder="23:30"
                        value={f.closing}
                        onChangeText={set('closing')}
                        maxLength={5}
                    />
                </View>
                {!timesOk ? (
                    <Txt variant="small" color={colors.danger}>
                        Use 24-hour HH:mm and close after opening.
                    </Txt>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Latitude"
                        keyboardType="numbers-and-punctuation"
                        value={f.lat}
                        onChangeText={set('lat')}
                    />
                    <Input
                        containerStyle={{ flex: 1 }}
                        label="Longitude"
                        keyboardType="numbers-and-punctuation"
                        value={f.lng}
                        onChangeText={set('lng')}
                    />
                </View>
            </Body>
            <BottomBar>
                <Button
                    title="Save"
                    icon="content-save-outline"
                    disabled={!timesOk || !f.name.trim() || !f.address.trim()}
                    loading={save.isPending}
                    onPress={() => save.mutate()}
                />
            </BottomBar>
        </Screen>
    );
}
