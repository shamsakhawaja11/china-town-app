import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { adminApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { toast } from '../../store/toast';
import { Body, BottomBar, Button, CheckboxGroup, Header, Input, RadioGroup, Screen, Txt } from '../../components/ui';
export function AddStaffScreen({ navigation }) {
    const qc = useQueryClient();
    const specs = useQuery({ queryKey: ['admin', 'specializations'], queryFn: adminApi.specializations });
    const [type, setType] = useState('chef');
    const [specIds, setSpecIds] = useState([]);
    const [f, setF] = useState({ name: '', email: '', phone: '', password: '', position: '' });
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const ok = f.name.trim() && (f.email.trim() || f.phone.trim()) && f.password.length >= 8;
    const save = useMutation({
        mutationFn: () =>
            adminApi.createStaff({
                name: f.name.trim(),
                email: f.email.trim() || undefined,
                phone: f.phone.trim() || undefined,
                password: f.password,
                staffType: type,
                position: f.position.trim() || undefined,
                specializationIds: type === 'chef' ? specIds : undefined,
            }),
        onSuccess: (s) => {
            toast.success(`${s.name} added`, `They can sign in now as ${s.staffType}.`);
            qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
            navigation.goBack();
        },
        onError: (e) => toast.error("Couldn't add staff", errorMessage(e)),
    });
    return (
        <Screen>
            <Header title="Add staff" />
            <Body>
                <Txt variant="h3">Role</Txt>
                <RadioGroup
                    value={type}
                    onChange={setType}
                    options={[
                        { value: 'chef', label: 'Chef', description: 'Cooks dishes from the kitchen queue', icon: 'chef-hat' },
                        {
                            value: 'waiter',
                            label: 'Waiter',
                            description: 'Serves tables, collects cash, seats guests',
                            icon: 'room-service-outline',
                        },
                        {
                            value: 'manager',
                            label: 'Manager',
                            description: 'Orders, kitchen, inventory and refunds',
                            icon: 'briefcase-outline',
                        },
                    ]}
                />
                <Input label="Full name" icon="account-outline" value={f.name} onChangeText={set('name')} />
                <Input
                    label="Email"
                    icon="email-outline"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={f.email}
                    onChangeText={set('email')}
                />
                <Input
                    label="Phone"
                    icon="phone-outline"
                    keyboardType="phone-pad"
                    value={f.phone}
                    onChangeText={set('phone')}
                    hint="Email or phone is required"
                />
                <Input
                    label="Temporary password"
                    icon="lock-outline"
                    password
                    value={f.password}
                    onChangeText={set('password')}
                    hint="At least 8 characters. Ask them to change it."
                />
                <Input
                    label="Position (optional)"
                    icon="badge-account-horizontal-outline"
                    placeholder={type === 'chef' ? 'e.g. Wok Chef' : 'e.g. Senior Waiter'}
                    value={f.position}
                    onChangeText={set('position')}
                />
                {type === 'chef' ? (
                    <Animated.View entering={FadeInDown.springify()} style={{ gap: 6 }}>
                        <Txt variant="h3">Specialities</Txt>
                        <Txt variant="small">Used to suggest the best chef for each dish.</Txt>
                        <CheckboxGroup
                            values={specIds}
                            onChange={setSpecIds}
                            options={(specs.data ?? [])
                                .filter((s) => s.is_active)
                                .map((s) => ({ value: s.id, label: s.name, description: s.description ?? undefined }))}
                        />
                    </Animated.View>
                ) : null}
            </Body>
            <BottomBar>
                <Button title="Create account" icon="account-plus" disabled={!ok} loading={save.isPending} onPress={() => save.mutate()} />
            </BottomBar>
        </Screen>
    );
}
