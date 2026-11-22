import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';
import { Card, ProgressBar, Stars, Txt } from './ui';
export function RatingSummaryCard({ summary }) {
    const total = Math.max(1, summary.totalReviews);
    return (
        <Card>
            <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
                <View style={{ alignItems: 'center', width: 96 }}>
                    <Txt variant="display" style={{ fontSize: 44, lineHeight: 52 }}>
                        {summary.averageRating.toFixed(1)}
                    </Txt>
                    <Stars value={summary.averageRating} size={14} />
                    <Txt variant="small" style={{ marginTop: 4 }}>
                        {summary.totalReviews} reviews
                    </Txt>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                    {['5', '4', '3', '2', '1'].map((k, i) => (
                        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Txt variant="smallMedium" style={{ width: 10 }}>
                                {k}
                            </Txt>
                            <View style={{ flex: 1 }}>
                                <ProgressBar value={summary.distribution[k] / total} color={colors.gold} height={7} delay={i * 80} />
                            </View>
                            <Txt variant="tiny" style={{ width: 22, textAlign: 'right' }}>
                                {summary.distribution[k]}
                            </Txt>
                        </View>
                    ))}
                </View>
            </View>
            {summary.categories ? (
                <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
                    {[
                        ['Food', summary.categories.food],
                        ['Service', summary.categories.service],
                        ['Ambience', summary.categories.ambience],
                    ].map(([l, v]) => (
                        <View key={l} style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 14, padding: 10, alignItems: 'center' }}>
                            <Txt variant="h3" color={colors.primary}>
                                {v ? v.toFixed(1) : '–'}
                            </Txt>
                            <Txt variant="tiny">{l}</Txt>
                        </View>
                    ))}
                </View>
            ) : null}
        </Card>
    );
}
