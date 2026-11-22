import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { usersApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../store/auth';
import { toast } from '../../store/toast';
import { Avatar, Body, Button, Header, Input, Screen } from '../../components/ui';
import { View } from 'react-native';
export function EditProfileScreen() {
    const nav = useNavigation();
    const qc = useQueryClient();
    const refreshMe = useAuth((s) => s.refreshMe);
    const user = useAuth((s) => s.user);
    const q = useQuery({ queryKey: ['profile'], queryFn: usersApi.profile, enabled: user?.role === 'customer' });
    const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' });
    useEffect(() => {
        if (q.data) setForm({ name: q.data.name, email: q.data.email ?? '', phone: q.data.phone ?? '' });
    }, [q.data]);
    const save = useMutation({
        mutationFn: () =>
            usersApi.update({
                name: form.name.trim() || undefined,
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
            }),
        onSuccess: async () => {
            await refreshMe();
            qc.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile updated');
            nav.goBack();
        },
        onError: (e) => toast.error("Couldn't save", errorMessage(e)),
    });
    return (
        <Screen>
            <Header title="Edit profile" />
            <Body>
                <View style={{ alignItems: 'center', marginVertical: 8 }}>
                    <Avatar name={form.name} size={84} />
                </View>
                <Input
                    label="Full name"
                    icon="account-outline"
                    value={form.name}
                    onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                />
                <Input
                    label="Email"
                    icon="email-outline"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={form.email}
                    onChangeText={(email) => setForm((f) => ({ ...f, email }))}
                />
                <Input
                    label="Phone"
                    icon="phone-outline"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(phone) => setForm((f) => ({ ...f, phone }))}
                    hint="Pakistani mobile, e.g. 0300 1234567"
                />
                <Button
                    title="Save changes"
                    icon="content-save-outline"
                    loading={save.isPending}
                    disabled={!form.name.trim()}
                    onPress={() => save.mutate()}
                />
            </Body>
        </Screen>
    );
}
