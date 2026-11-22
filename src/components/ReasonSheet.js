import React, { useEffect, useState } from 'react';
import { Button, Chip, Input, Sheet, Txt } from './ui';
import { View } from 'react-native';
export function ReasonSheet({ visible, title, presets, confirmLabel = 'Confirm', onClose, onConfirm, loading, danger = true, message }) {
    const [reason, setReason] = useState('');
    useEffect(() => {
        if (visible) setReason('');
    }, [visible]);
    return (
        <Sheet
            visible={visible}
            onClose={onClose}
            title={title}
            footer={
                <Button
                    title={confirmLabel}
                    variant={danger ? 'danger' : 'primary'}
                    loading={loading}
                    disabled={!reason.trim()}
                    onPress={() => onConfirm(reason.trim())}
                />
            }
        >
            {message ? <Txt variant="small">{message}</Txt> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {presets.map((p) => (
                    <Chip key={p} small label={p} active={reason === p} onPress={() => setReason(p)} />
                ))}
            </View>
            <Input placeholder="Or type a reason…" value={reason} onChangeText={setReason} multiline maxLength={300} />
        </Sheet>
    );
}
