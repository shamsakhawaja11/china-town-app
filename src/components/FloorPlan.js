import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { G, Rect, Text as SvgText, Circle } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { haptics } from '../lib/haptics';
import { colors, fonts, radius } from '../theme';
import { Txt } from './ui';
export function FloorPlan({ plan, tables, selected, onToggle, partySize }) {
    const { width } = useWindowDimensions();
    const canvasW = plan?.canvasWidth ?? 1000;
    const canvasH = plan?.canvasHeight ?? 700;
    const w = width - 40;
    const h = (w * canvasH) / canvasW;
    const fill = (t) => {
        if (selected.includes(t.id)) return colors.primary;
        if (!t.isAvailable) return '#D9CCC5';
        if (partySize && t.capacity < partySize) return colors.goldSoft;
        return colors.successSoft;
    };
    const stroke = (t) => {
        if (selected.includes(t.id)) return colors.primaryDark;
        if (!t.isAvailable) return '#BFAEA6';
        if (partySize && t.capacity < partySize) return colors.gold;
        return colors.success;
    };
    return (
        <Animated.View entering={FadeIn.duration(400)}>
            <View
                style={{
                    width: w,
                    height: h,
                    backgroundColor: colors.surface,
                    borderRadius: radius.xl,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: 'hidden',
                }}
            >
                <Svg width={w} height={h} viewBox={`0 0 ${canvasW} ${canvasH}`}>
                    <Rect x={canvasW / 2 - 70} y={canvasH - 14} width={140} height={14} rx={6} fill={colors.primaryLight} />
                    <SvgText
                        x={canvasW / 2}
                        y={canvasH - 22}
                        fontSize={22}
                        fontFamily={fonts.medium}
                        fontWeight="500"
                        fill={colors.textMuted}
                        textAnchor="middle"
                    >
                        ENTRANCE
                    </SvgText>
                    {tables.map((t) => {
                        const cx = t.posX + t.width / 2;
                        const cy = t.posY + t.height / 2;
                        const sel = selected.includes(t.id);
                        const seats = Math.min(t.capacity, 12);
                        return (
                            <G
                                key={t.id}
                                onPress={() => {
                                    if (!t.isAvailable) {
                                        haptics.warning();
                                        return;
                                    }
                                    haptics.selection();
                                    onToggle(t);
                                }}
                                rotation={t.rotation}
                                origin={`${cx}, ${cy}`}
                            >
                                {Array.from({ length: seats }).map((_, i) => {
                                    const a = (i / seats) * Math.PI * 2;
                                    const rx = t.width / 2 + 12;
                                    const ry = t.height / 2 + 12;
                                    return (
                                        <Circle
                                            key={i}
                                            cx={cx + Math.cos(a) * rx}
                                            cy={cy + Math.sin(a) * ry}
                                            r={9}
                                            fill={sel ? '#F4A79F' : '#EADDD6'}
                                        />
                                    );
                                })}
                                <Rect
                                    x={t.posX}
                                    y={t.posY}
                                    width={t.width}
                                    height={t.height}
                                    rx={18}
                                    fill={fill(t)}
                                    stroke={stroke(t)}
                                    strokeWidth={3}
                                />
                                <SvgText
                                    x={cx}
                                    y={cy + 2}
                                    fontSize={26}
                                    fontFamily={fonts.bold}
                                    fontWeight="700"
                                    fill={sel ? colors.white : colors.text}
                                    textAnchor="middle"
                                >
                                    {t.tableNumber}
                                </SvgText>
                                <SvgText
                                    x={cx}
                                    y={cy + 26}
                                    fontSize={17}
                                    fontFamily={fonts.medium}
                                    fontWeight="500"
                                    fill={sel ? colors.white : colors.textMuted}
                                    textAnchor="middle"
                                >
                                    {`${t.capacity} seats`}
                                </SvgText>
                            </G>
                        );
                    })}
                </Svg>
            </View>
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                    { c: colors.successSoft, b: colors.success, l: 'Available' },
                    { c: colors.primary, b: colors.primaryDark, l: 'Selected' },
                    { c: '#D9CCC5', b: '#BFAEA6', l: 'Booked' },
                    ...(partySize ? [{ c: colors.goldSoft, b: colors.gold, l: 'Too small' }] : []),
                ].map((x) => (
                    <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                            style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: x.c, borderWidth: 1.5, borderColor: x.b }}
                        />
                        <Txt variant="small">{x.l}</Txt>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
}
