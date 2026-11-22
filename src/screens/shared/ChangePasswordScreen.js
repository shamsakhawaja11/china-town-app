import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../store/auth';
import { toast } from '../../store/toast';
import { Body, Button, Card, Header, Icon, Input, Screen, Txt } from '../../components/ui';
import { colors } from '../../theme';
export function ChangePasswordScreen() {
    const logout = useAuth((s) => s.logout);
    const [cur, setCur] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const mismatch = !!confirm && confirm !== next;
    const change = useMutation({
        mutationFn: () => authApi.changePassword(cur, next),
        onSuccess: () => {
            toast.success('Password changed', 'Please sign in again.');
            logout();
        },
        onError: (e) => toast.error("Couldn't change password", errorMessage(e)),
    });
    return (
        <Screen>
            <Header title="Change password" />
            <Body>
                <Card flat style={{ flexDirection: 'row', gap: 10, backgroundColor: colors.infoSoft, borderColor: '#CFE0F7' }}>
                    <Icon name="information-outline" size={20} color={colors.info} />
                    <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
                        For your security you'll be signed out on all devices.
                    </Txt>
                </Card>
                <Input label="Current password" icon="lock-outline" password value={cur} onChangeText={setCur} />
                <Input
                    label="New password"
                    icon="lock-plus-outline"
                    password
                    value={next}
                    onChangeText={setNext}
                    hint="At least 8 characters"
                />
                <Input
                    label="Confirm new password"
                    icon="lock-check-outline"
                    password
                    value={confirm}
                    onChangeText={setConfirm}
                    error={mismatch ? "Passwords don't match" : null}
                />
                <Button
                    title="Update password"
                    loading={change.isPending}
                    disabled={!cur || next.length < 8 || next !== confirm}
                    onPress={() => change.mutate()}
                />
            </Body>
        </Screen>
    );
}
