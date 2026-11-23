import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInRight,
    FadeOut,
    LinearTransition,
    ZoomIn,
    ZoomOut,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { cartApi, reservationsApi, restaurantApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors, radius, shadow } from '../../theme';
import { money, time } from '../../utils/format';
import { CART_KEY } from '../../hooks/useCart';
import { toast } from '../../store/toast';
import { haptics } from '../../lib/haptics';
import {
    Body,
    BottomBar,
    Button,
    Card,
    EmptyState,
    Header,
    Icon,
    Input,
    PressableScale,
    RadioGroup,
    Screen,
    Skeleton,
    Stepper,
    Txt,
} from '../../components/ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_TABLES = 5;
const GAP = 12;

const AREA_STYLES = {
    'window side': { icon: 'window-closed-variant', color: '#E6A93A', soft: '#FDF3DE' },
    gallery: { icon: 'stairs', color: '#3A7BD5', soft: '#E4EEFB' },
    indoor: { icon: 'sofa-outline', color: '#2E9E5B', soft: '#E3F5EA' },
    family: { icon: 'account-group-outline', color: '#8E5BC2', soft: '#F1E8FA' },
    'private room': { icon: 'door-closed-lock', color: '#7A4B3A', soft: '#F3E6E0' },
};
const DEFAULT_AREA = { icon: 'table-furniture', color: colors.textMuted, soft: colors.surfaceAlt };
const areaStyle = (name) => AREA_STYLES[(name ?? '').toLowerCase()] ?? DEFAULT_AREA;

function slots(opening, closing, duration) {
    const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const out = [];
    for (let m = toMin(opening); m + duration <= toMin(closing); m += 30) {
        out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
    return out;
}

const tableNo = (t) => Number(String(t.tableNumber).replace(/\D/g, '')) || 0;
const longName = (t) => String(t.tableNumber).replace(/^T(\d+)$/i, 'Table $1');

function bestExactCombo(free, party, keepIds, maxTables) {
    const pool = free.filter((t) => t.capacity <= party);
    let best = null;
    const pick = [];
    const score = (combo) => {
        const kept = combo.filter((t) => keepIds.includes(t.id)).length;
        return kept * 100 - combo.length;
    };
    const walk = (start, sum) => {
        if (sum === party) {
            if (!best || score(pick) > score(best)) best = [...pick];
            return;
        }
        if (pick.length >= maxTables) return;
        for (let i = start; i < pool.length; i++) {
            if (sum + pool[i].capacity > party) continue;
            pick.push(pool[i]);
            walk(i + 1, sum + pool[i].capacity);
            pick.pop();
        }
    };
    walk(0, 0);
    return best ?? [];
}

const seatWord = (n) => `${n} ${n === 1 ? 'seat' : 'seats'}`;
const tableList = (list) => list.map((t) => `${t.tableNumber} (${t.capacity})`).join(' + ');

function FitStatus({ kind, title, message, actionLabel, onAction, suggestions, onSuggest }) {
    const tone = {
        under: { fg: colors.warning, bg: colors.warningSoft, icon: 'account-plus-outline' },
        over: { fg: colors.danger, bg: colors.dangerSoft, icon: 'seat-outline' },
        exact: { fg: colors.success, bg: colors.successSoft, icon: 'check-decagram' },
        none: { fg: colors.textMuted, bg: colors.surfaceAlt, icon: 'gesture-tap' },
        blocked: { fg: colors.danger, bg: colors.dangerSoft, icon: 'table-cancel' },
    }[kind];
    return (
        <Animated.View
            key={kind + title}
            entering={FadeInDown.springify().damping(16)}
            style={[styles.fit, { backgroundColor: tone.bg }]}
        >
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Icon name={tone.icon} size={20} color={tone.fg} />
                <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="smallMedium" color={tone.fg} style={{ fontWeight: '700' }}>
                        {title}
                    </Txt>
                    {message ? (
                        <Txt variant="small" color={colors.text}>
                            {message}
                        </Txt>
                    ) : null}
                </View>
            </View>
            {suggestions?.length ? (
                <View style={styles.suggestRow}>
                    {suggestions.map((t) => (
                        <PressableScale key={t.id} haptic onPress={() => onSuggest(t)} style={[styles.suggest, { borderColor: tone.fg }]}>
                            <Icon name="plus" size={14} color={tone.fg} />
                            <Txt variant="smallMedium" color={tone.fg} style={{ fontWeight: '700' }}>
                                {t.tableNumber} · {seatWord(t.capacity)}
                            </Txt>
                        </PressableScale>
                    ))}
                </View>
            ) : null}
            {actionLabel ? (
                <PressableScale haptic onPress={onAction} style={[styles.fitAction, { backgroundColor: tone.fg }]}>
                    <Icon name="swap-horizontal" size={16} color={colors.white} />
                    <Txt variant="smallMedium" color={colors.white} style={{ fontWeight: '700' }} numberOfLines={1}>
                        {actionLabel}
                    </Txt>
                </PressableScale>
            ) : null}
        </Animated.View>
    );
}

function dayLabel(d) {
    const today = new Date();
    const diff = Math.round(
        (new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
            86400000,
    );
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function TableCard({ table, width, selected, disabled, reason, onPress, index }) {
    const area = areaStyle(table.category?.name);
    const pop = useSharedValue(1);
    useEffect(() => {
        if (selected) pop.value = withSequence(withTiming(1.07, { duration: 110 }), withSpring(1, { damping: 9, stiffness: 220 }));
    }, [selected, pop]);
    const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
    const busy = !table.isAvailable;
    return (
        <Animated.View entering={FadeInDown.delay(Math.min(index, 12) * 35).springify().damping(15)} style={[{ width }, popStyle]}>
            <PressableScale
                haptic
                disabled={disabled}
                onPress={onPress}
                style={[
                    styles.table,
                    { borderColor: selected ? colors.primary : busy ? colors.border : `${area.color}55` },
                    selected && styles.tableSelected,
                    selected && shadow(3),
                    !selected && !busy && shadow(1),
                    busy && styles.tableBusy,
                    disabled && !busy && { opacity: 0.5 },
                ]}
            >
                <View style={styles.tableTop}>
                    <Txt variant="h3" color={selected ? colors.white : busy ? colors.textFaint : colors.text}>
                        {table.tableNumber}
                    </Txt>
                    {selected ? (
                        <Animated.View entering={ZoomIn.springify().damping(12)} exiting={ZoomOut.duration(120)}>
                            <Icon name="check-circle" size={20} color={colors.white} />
                        </Animated.View>
                    ) : busy ? (
                        <Icon name="lock-outline" size={16} color={colors.textFaint} />
                    ) : (
                        <Icon name={area.icon} size={16} color={area.color} />
                    )}
                </View>
                <View style={styles.tableBottom}>
                    <Icon
                        name={busy ? 'clock-outline' : 'account-outline'}
                        size={14}
                        color={selected ? colors.white : busy ? colors.textFaint : colors.text}
                    />
                    <Txt
                        variant="smallMedium"
                        color={selected ? colors.white : busy ? colors.textFaint : colors.text}
                        numberOfLines={1}
                    >
                        {busy ? reason : `${table.capacity} seats`}
                    </Txt>
                </View>
            </PressableScale>
        </Animated.View>
    );
}

function AreaChip({ label, icon, color, left, active, onPress }) {
    return (
        <PressableScale haptic onPress={onPress} style={[styles.areaChip, active ? styles.areaChipActive : shadow(1)]}>
            {icon ? <Icon name={icon} size={16} color={active ? colors.white : color} /> : null}
            <Txt variant="smallMedium" color={active ? colors.white : colors.text} style={{ fontWeight: '700' }}>
                {label}
            </Txt>
            {left !== undefined ? (
                <Txt variant="small" color={active ? '#FFD9D2' : colors.textMuted}>
                    {left} left
                </Txt>
            ) : null}
        </PressableScale>
    );
}

function Legend({ areas }) {
    const Box = ({ fill, border }) => (
        <View style={[styles.legendBox, { backgroundColor: fill ?? colors.surface, borderColor: border ?? colors.border }]} />
    );
    return (
        <View style={styles.legend}>
            <View style={styles.legendItem}>
                <Box />
                <Txt variant="small">Available</Txt>
            </View>
            <View style={styles.legendItem}>
                <Box fill={colors.primary} border={colors.primary} />
                <Txt variant="small">Selected</Txt>
            </View>
            {areas.map((a) => (
                <View key={a.id} style={styles.legendItem}>
                    <Box border={areaStyle(a.name).color} />
                    <Txt variant="small">{a.name}</Txt>
                </View>
            ))}
        </View>
    );
}

export function TablePickerScreen({ route, navigation }) {
    const mode = route.params.mode;
    const isBooking = mode === 'booking';
    const qc = useQueryClient();
    const restaurant = useQuery({ queryKey: ['restaurant'], queryFn: restaurantApi.get });
    const [step, setStep] = useState(isBooking ? 'details' : 'tables');
    const [party, setParty] = useState(2);
    const [selected, setSelected] = useState([]);
    const [dayIdx, setDayIdx] = useState(0);
    const [slot, setSlot] = useState(null);
    const [duration, setDuration] = useState(90);
    const [requests, setRequests] = useState('');
    const [area, setArea] = useState('all');
    const [gridWidth, setGridWidth] = useState(0);

    const days = useMemo(() => Array.from({ length: 14 }, (_, i) => new Date(Date.now() + i * 86400000)), []);
    const day = days[dayIdx];
    const opening = restaurant.data?.opening_time ?? '12:00';
    const closing = restaurant.data?.closing_time ?? '23:30';
    const allSlots = useMemo(() => slots(opening, closing, duration), [opening, closing, duration]);
    const slotDate = (s) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(s.slice(0, 2)), Number(s.slice(3, 5)));
    const slotOk = (s) => slotDate(s).getTime() > Date.now() + 20 * 60000;
    const iso = slot ? slotDate(slot).toISOString() : null;

    useEffect(() => setSelected([]), [dayIdx, slot, duration, party]);
    useEffect(() => {
        if (slot && !slotOk(slot)) setSlot(null);
    }, [dayIdx]);

    useEffect(() => {
        if (step !== 'tables' || !isBooking) return undefined;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            setStep('details');
            return true;
        });
        return () => sub.remove();
    }, [step, isBooking]);

    const live = useQuery({
        queryKey: ['tables', 'live'],
        queryFn: restaurantApi.liveTables,
        enabled: !isBooking,
        refetchInterval: 15000,
    });
    const avail = useQuery({
        queryKey: ['availability', iso, party, duration],
        queryFn: () => reservationsApi.availability(iso, party, duration),
        enabled: isBooking && !!iso,
    });
    useEffect(() => {
        const ids = avail.data?.suggestedTableIds ?? (avail.data?.suggestedTableId ? [avail.data.suggestedTableId] : []);
        setSelected(ids);
    }, [avail.data]);

    const source = isBooking ? avail : live;
    const allTables = isBooking ? (avail.data?.tables ?? []) : (live.data?.tables ?? []);
    const tables = useMemo(
        () => allTables.filter((t) => t.isAvailable).sort((a, b) => tableNo(a) - tableNo(b)),
        [allTables],
    );
    const openSlots = useMemo(() => allSlots.filter(slotOk), [allSlots, dayIdx]);
    const slotIndex = slot ? openSlots.indexOf(slot) : -1;
    const slotLabel = (sl) => time(new Date(2000, 0, 1, Number(sl.slice(0, 2)), Number(sl.slice(3, 5))));

    const areas = useMemo(() => {
        const map = new Map();
        for (const t of tables) {
            const id = t.category?.id ?? 'none';
            if (!map.has(id)) map.set(id, { id, name: t.category?.name ?? 'Other', tables: [] });
            map.get(id).tables.push(t);
        }
        return [...map.values()];
    }, [tables]);
    const shownAreas = area === 'all' ? areas : areas.filter((a) => a.id === area);

    const chosen = tables.filter((t) => selected.includes(t.id));
    const seats = chosen.reduce((s, t) => s + t.capacity, 0);
    const tooSmall = chosen.length > 0 && seats < party;
    const remaining = party - seats;
    const exact = chosen.length > 0 && seats === party;
    const freeCount = tables.filter((t) => t.isAvailable).length;
    const exactFree = tables.filter((t) => t.isAvailable && t.capacity === party).length;

    const extra = seats - party;
    const over = extra > 0;
    const maxTables = isBooking ? MAX_TABLES : 1;
    const freeTables = useMemo(() => tables.filter((t) => t.isAvailable), [tables]);

    const fits = (t) => t.isAvailable && (isBooking ? t.capacity <= party : t.capacity === party);
    const canPick = (t) => t.isAvailable;

    const fix = useMemo(() => {
        if (!chosen.length || seats === party) return [];
        return bestExactCombo(freeTables, party, selected, maxTables);
    }, [chosen.length, seats, party, freeTables, selected, maxTables]);
    const anyExact = useMemo(() => bestExactCombo(freeTables, party, [], maxTables).length > 0, [freeTables, party, maxTables]);
    const addOptions = useMemo(() => {
        if (!isBooking || !tooSmall || chosen.length >= MAX_TABLES) return [];
        const pool = freeTables.filter((t) => !selected.includes(t.id));
        const exactOnes = pool.filter((t) => t.capacity === remaining);
        return (exactOnes.length ? exactOnes : pool.filter((t) => t.capacity < remaining).sort((a, b) => b.capacity - a.capacity)).slice(0, 3);
    }, [isBooking, tooSmall, chosen.length, freeTables, selected, remaining]);

    const fixKeeps = fix.filter((t) => selected.includes(t.id));
    const fixAdds = fix.filter((t) => !selected.includes(t.id));
    const fixDrops = chosen.filter((t) => !fix.some((f) => f.id === t.id));
    let fixLabel = null;
    if (fix.length) {
        if (!fixAdds.length) fixLabel = `Remove ${fixDrops.map((t) => t.tableNumber).join(' + ')}`;
        else if (!fixDrops.length) fixLabel = `Add ${fixAdds.map((t) => t.tableNumber).join(' + ')}`;
        else if (!fixKeeps.length) fixLabel = `Use ${tableList(fix)} instead`;
        else fixLabel = `Swap ${fixDrops.map((t) => t.tableNumber).join(' + ')} for ${fixAdds.map((t) => t.tableNumber).join(' + ')}`;
    }
    const applyFix = () => setSelected(fix.map((t) => t.id));

    let status;
    if (!chosen.length) {
        status = anyExact
            ? {
                  kind: 'none',
                  title: `Pick tables for ${party} ${party === 1 ? 'guest' : 'guests'}`,
                  message: isBooking
                      ? `Your tables must add up to exactly ${seatWord(party)}. You can join up to ${MAX_TABLES} tables.`
                      : `Choose a table with exactly ${seatWord(party)}.`,
              }
            : {
                  kind: 'blocked',
                  title: `No free tables make exactly ${seatWord(party)}`,
                  message: isBooking
                      ? 'Try another time or change the number of guests.'
                      : 'Book a table instead so we can join tables for your group.',
              };
    } else if (exact) {
        status = {
            kind: 'exact',
            title: `Perfect fit · ${seatWord(seats)} for ${party} ${party === 1 ? 'guest' : 'guests'}`,
            message: chosen.length > 1 ? `${tableList(chosen)} will be joined for your group.` : null,
        };
    } else if (tooSmall) {
        status = {
            kind: 'under',
            title: `${seatWord(seats)} for ${party} guests · ${seatWord(remaining)} short`,
            message: isBooking
                ? chosen.length >= MAX_TABLES
                    ? `You've reached ${MAX_TABLES} tables. Swap one for a bigger table.`
                    : `Choose one more table with ${seatWord(remaining)} to match your group.`
                : `This table is too small. Pick a table with exactly ${seatWord(party)}.`,
            suggestions: addOptions,
        };
    } else {
        status = {
            kind: 'over',
            title: `${seatWord(seats)} for ${party} ${party === 1 ? 'guest' : 'guests'} · ${seatWord(extra)} extra`,
            message: fix.length
                ? `We only book the seats you need, so empty chairs stay free for other guests. ${
                      fixAdds.length || fixDrops.length ? 'Tap below to fix it.' : ''
                  }`
                : `No free tables add up to exactly ${seatWord(party)}. ${
                      isBooking ? 'Try another time or change the number of guests.' : 'Book a table instead to join tables.'
                  }`,
        };
    }
    const toggle = (t) => {
        if (!isBooking) return setSelected([t.id]);
        setSelected((cur) => {
            if (cur.includes(t.id)) return cur.filter((x) => x !== t.id);
            if (cur.length >= MAX_TABLES) {
                haptics.warning?.();
                toast.info(`Up to ${MAX_TABLES} tables`, 'Remove one to add another.');
                return cur;
            }
            return [...cur, t.id];
        });
    };

    const chooseTable = useMutation({
        mutationFn: () => cartApi.update({ orderType: 'dine_in', tableId: selected[0], reservationId: null }),
        onSuccess: (cart) => {
            qc.setQueryData(CART_KEY, cart);
            const t = tables.find((x) => x.id === selected[0]);
            toast.success(
                `${t ? longName(t) : 'Table'} is yours`,
                cart.itemCount ? 'Review your cart and place the order.' : 'Now pick your dishes.',
            );
            if (cart.itemCount) navigation.navigate('Cart');
            else navigation.navigate('Tabs', { screen: 'Menu' });
        },
        onError: (e) => {
            toast.error("Couldn't select table", errorMessage(e));
            live.refetch();
        },
    });
    const book = useMutation({
        mutationFn: () =>
            reservationsApi.create({
                reservationTime: iso,
                partySize: party,
                durationMinutes: duration,
                tableIds: selected,
                specialRequests: requests.trim() || undefined,
            }),
        onSuccess: (r) => {
            qc.invalidateQueries({ queryKey: ['reservations'] });
            navigation.replace('BookingDetail', { id: r.id, justBooked: true });
        },
        onError: (e) => {
            toast.error("Couldn't book", errorMessage(e));
            avail.refetch();
        },
    });

    const summary = isBooking
        ? `${dayLabel(day)} · ${slot ? time(slotDate(slot)) : '--'} · ${party} ${party === 1 ? 'guest' : 'guests'}`
        : `Now · ${party} ${party === 1 ? 'guest' : 'guests'}`;

    const selectionLabel =
        chosen.length === 0
            ? 'No table selected'
            : chosen.length === 1
              ? `${longName(chosen[0])} · ${chosen[0].category?.name ?? 'Table'}`
              : `${chosen.map((t) => t.tableNumber).join(' + ')} · joined`;

    const cardWidth = gridWidth ? (gridWidth - GAP * 2) / 3 : 0;

    if (step === 'details') {
        return (
            <Screen>
                <Header title={isBooking ? 'Book a table' : 'How many guests?'} subtitle={restaurant.data?.name} />
                <Body>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={styles.iconBox}>
                                <Icon name="account-group" size={22} color={colors.primary} />
                            </View>
                            <View>
                                <Txt variant="bodyMedium">Guests</Txt>
                                <Txt variant="small">{party === 1 ? 'Just me' : `${party} people`}</Txt>
                            </View>
                        </View>
                        <Stepper value={party} onChange={setParty} min={1} max={30} />
                    </Card>

                    {isBooking ? (
                        <Animated.View entering={FadeInDown.springify()} style={{ gap: 14 }}>
                            <Txt variant="h3">Date</Txt>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 10 }}
                                style={{ marginHorizontal: -20 }}
                            >
                                <View style={{ width: 10 }} />
                                {days.map((d, i) => {
                                    const active = i === dayIdx;
                                    return (
                                        <PressableScale
                                            key={i}
                                            haptic
                                            onPress={() => setDayIdx(i)}
                                            style={[styles.day, active && styles.dayActive]}
                                        >
                                            <Txt variant="tiny" color={active ? '#FFD9D2' : colors.textMuted}>
                                                {i === 0 ? 'Today' : DAYS[d.getDay()]}
                                            </Txt>
                                            <Txt variant="h2" color={active ? colors.white : colors.text}>
                                                {d.getDate()}
                                            </Txt>
                                            <Txt variant="tiny" color={active ? '#FFD9D2' : colors.textMuted}>
                                                {MONTHS[d.getMonth()]}
                                            </Txt>
                                        </PressableScale>
                                    );
                                })}
                                <View style={{ width: 10 }} />
                            </ScrollView>

                            <Txt variant="h3">Time</Txt>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {allSlots.map((s) => {
                                    const ok = slotOk(s);
                                    const active = s === slot;
                                    return (
                                        <PressableScale
                                            key={s}
                                            haptic
                                            disabled={!ok}
                                            onPress={() => setSlot(s)}
                                            style={[styles.slot, active && styles.slotActive, !ok && { opacity: 0.35 }]}
                                        >
                                            <Txt variant="smallMedium" color={active ? colors.white : colors.text}>
                                                {time(new Date(2000, 0, 1, Number(s.slice(0, 2)), Number(s.slice(3, 5))))}
                                            </Txt>
                                        </PressableScale>
                                    );
                                })}
                                {allSlots.filter(slotOk).length === 0 ? (
                                    <Txt variant="small">No more slots today, pick another day.</Txt>
                                ) : null}
                            </View>

                            <Txt variant="h3">How long?</Txt>
                            <RadioGroup
                                value={duration}
                                onChange={setDuration}
                                options={[
                                    { value: 60, label: '1 hour', description: 'Quick lunch', icon: 'timer-outline' },
                                    { value: 90, label: '1.5 hours', description: 'Most guests choose this', icon: 'timer-sand' },
                                    { value: 120, label: '2 hours', description: 'Celebrations & groups', icon: 'party-popper' },
                                ]}
                            />

                            <Input
                                label="Special requests"
                                icon="star-outline"
                                placeholder="Birthday, window seat, high chair…"
                                value={requests}
                                onChangeText={setRequests}
                                multiline
                                maxLength={500}
                            />

                            <Card flat style={{ flexDirection: 'row', gap: 10, backgroundColor: colors.goldSoft, borderColor: '#F3DDAE' }}>
                                <Icon name="table-multiple" size={22} color={colors.gold} />
                                <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
                                    You only book the seats you need: your tables must add up to exactly {party}{' '}
                                    {party === 1 ? 'seat' : 'seats'}. For a bigger group, join up to {MAX_TABLES} tables.
                                </Txt>
                            </Card>
                        </Animated.View>
                    ) : null}
                </Body>
                <BottomBar>
                    <Button
                        title={isBooking ? (slot ? 'Choose your table' : 'Pick a time first') : 'Show free tables'}
                        icon="arrow-right"
                        disabled={isBooking && !slot}
                        onPress={() => setStep('tables')}
                    />
                </BottomBar>
            </Screen>
        );
    }

    return (
        <Screen>
            <Header
                title="Choose your table"
                onBack={isBooking ? () => setStep('details') : undefined}
                right={
                    !isBooking ? (
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Txt variant="tiny" color={colors.success}>
                                LIVE
                            </Txt>
                        </View>
                    ) : null
                }
            />
            <Body>
                <Animated.View entering={FadeInDown.springify().damping(16)}>
                    <Card style={styles.summary}>
                        <Icon name="calendar-month-outline" size={20} color={colors.primary} />
                        <Txt variant="bodyMedium" style={{ flex: 1, fontWeight: '700' }} numberOfLines={1}>
                            {summary}
                        </Txt>
                        <PressableScale haptic onPress={() => setStep('details')} hitSlop={10}>
                            <Txt variant="bodyMedium" color={colors.primary} style={{ fontWeight: '700' }}>
                                Change
                            </Txt>
                        </PressableScale>
                    </Card>
                </Animated.View>

                {isBooking && openSlots.length ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginHorizontal: -20, flexGrow: 0 }}
                        contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
                        contentOffset={{ x: Math.max(0, slotIndex * 92 - 120), y: 0 }}
                    >
                        {openSlots.map((sl) => {
                            const active = sl === slot;
                            return (
                                <PressableScale
                                    key={sl}
                                    haptic
                                    onPress={() => setSlot(sl)}
                                    style={[styles.timeChip, active && styles.timeChipActive]}
                                >
                                    <Icon name="clock-outline" size={14} color={active ? colors.white : colors.textMuted} />
                                    <Txt variant="smallMedium" color={active ? colors.white : colors.text} style={{ fontWeight: '700' }}>
                                        {slotLabel(sl)}
                                    </Txt>
                                </PressableScale>
                            );
                        })}
                    </ScrollView>
                ) : null}

                {areas.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginHorizontal: -20, flexGrow: 0 }}
                        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 4 }}
                    >
                        <Animated.View entering={FadeInRight.delay(40).springify()}>
                            <AreaChip label="All tables" active={area === 'all'} onPress={() => setArea('all')} />
                        </Animated.View>
                        {areas.map((a, i) => {
                            const st = areaStyle(a.name);
                            return (
                                <Animated.View key={a.id} entering={FadeInRight.delay(80 + i * 50).springify()}>
                                    <AreaChip
                                        label={a.name}
                                        icon={st.icon}
                                        color={st.color}
                                        left={a.tables.filter((t) => fits(t)).length}
                                        active={area === a.id}
                                        onPress={() => setArea(area === a.id ? 'all' : a.id)}
                                    />
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                ) : null}

                {source.isLoading ? (
                    <Skeleton height={380} r={22} />
                ) : source.isError ? (
                    <EmptyState tone="error" title="Couldn't load tables" message={errorMessage(source.error)} />
                ) : allTables.length === 0 ? (
                    <EmptyState title="No tables yet" message="The restaurant hasn't set up its floor plan." />
                ) : tables.length === 0 ? (
                    isBooking ? (
                        <EmptyState
                            icon="calendar-remove"
                            title={`Fully booked at ${slot ? slotLabel(slot) : 'this time'}`}
                            message="Every table is taken at this time. Pick another time above."
                        />
                    ) : (
                        <EmptyState
                            icon="table-cancel"
                            title="All tables are busy right now"
                            message="Try again in a few minutes, or book a table for later."
                            action="Book a table"
                            onAction={() => navigation.replace('TablePicker', { mode: 'booking' })}
                        />
                    )
                ) : (
                    <View style={styles.floor}>
                        <View style={{ gap: 18 }} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
                            {shownAreas.map((a) => {
                                const st = areaStyle(a.name);
                                return (
                                    <Animated.View key={a.id} layout={LinearTransition.springify().damping(18)} entering={FadeIn} exiting={FadeOut}>
                                        <View style={[styles.areaBand, { backgroundColor: st.soft }]}>
                                            <Icon name={st.icon} size={15} color={st.color} />
                                            <Txt variant="smallMedium" color={st.color} style={{ fontWeight: '700' }}>
                                                {a.name}
                                            </Txt>
                                        </View>
                                        {cardWidth > 0 ? (
                                            <View style={styles.grid}>
                                                {a.tables.map((t, i) => (
                                                    <TableCard
                                                        key={t.id}
                                                        index={i}
                                                        table={t}
                                                        width={cardWidth}
                                                        selected={selected.includes(t.id)}
                                                        disabled={!canPick(t)}
                                                        reason={isBooking ? 'Booked' : 'Occupied'}
                                                        onPress={() => toggle(t)}
                                                    />
                                                ))}
                                            </View>
                                        ) : null}
                                    </Animated.View>
                                );
                            })}
                        </View>
                        <View style={styles.entrance}>
                            <Icon name="arrow-up" size={14} color={colors.textMuted} />
                            <Txt variant="smallMedium">Entrance</Txt>
                        </View>
                    </View>
                )}

                {tables.length > 0 ? <Legend areas={areas} /> : null}

                {isBooking ? (
                    <Txt variant="small" style={{ textAlign: 'center' }}>
                        {tables.length} {tables.length === 1 ? 'table' : 'tables'} free at {slot ? slotLabel(slot) : '--'} · tap tables to join them
                    </Txt>
                ) : (
                    <Txt variant="small" style={{ textAlign: 'center' }}>
                        {exactFree > 0
                            ? `${exactFree} free ${exactFree === 1 ? 'table has' : 'tables have'} exactly ${seatWord(party)}`
                            : `No free table has exactly ${seatWord(party)} right now`}
                    </Txt>
                )}

                {isBooking && avail.data?.depositRequired ? (
                    <Card flat style={{ flexDirection: 'row', gap: 10, backgroundColor: colors.infoSoft, borderColor: '#CFE0F7' }}>
                        <Icon name="shield-check-outline" size={22} color={colors.info} />
                        <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
                            A {money(avail.data.depositRequired)} refundable deposit holds your booking. It goes back to your wallet when
                            you arrive.
                        </Txt>
                    </Card>
                ) : null}
            </Body>
            <BottomBar>
                <View style={styles.selRow}>
                    <Animated.View key={selectionLabel} entering={FadeIn.duration(180)} style={{ flex: 1 }}>
                        <Txt variant="small" numberOfLines={1}>
                            {selectionLabel}
                        </Txt>
                    </Animated.View>
                    <Txt variant="h3" color={tooSmall ? colors.warning : over ? colors.danger : exact ? colors.success : colors.text}>
                        Seats {seats}
                        {chosen.length ? <Txt variant="small">{` / ${party} guests`}</Txt> : null}
                    </Txt>
                </View>
                <FitStatus
                    {...status}
                    actionLabel={!exact && chosen.length && fix.length && (over || !addOptions.length || !isBooking) ? fixLabel : null}
                    onAction={applyFix}
                    onSuggest={(t) => toggle(t)}
                />
                <Button
                    title={
                        isBooking
                            ? chosen.length > 1
                                ? `Confirm booking · ${chosen.length} tables`
                                : 'Confirm booking'
                            : chosen.length
                              ? `Sit at ${longName(chosen[0])}`
                              : 'Tap a free table'
                    }
                    icon="check"
                    disabled={!exact || (isBooking && !iso)}
                    loading={isBooking ? book.isPending : chooseTable.isPending}
                    onPress={() => (isBooking ? book.mutate() : chooseTable.mutate())}
                />
            </BottomBar>
        </Screen>
    );
}

const styles = StyleSheet.create({
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    day: {
        width: 62,
        height: 78,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    slot: {
        paddingHorizontal: 14,
        height: 38,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
    },
    slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    summary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
    areaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 42,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
    },
    areaChipActive: { backgroundColor: colors.primary },
    floor: {
        backgroundColor: colors.primarySoft,
        borderRadius: radius.xl,
        padding: 14,
        gap: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    areaBand: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: radius.md,
        marginBottom: 12,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    table: {
        height: 84,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        padding: 12,
        justifyContent: 'space-between',
    },
    tableSelected: { backgroundColor: colors.primary },
    tableBusy: { backgroundColor: colors.surfaceAlt },
    tableTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tableBottom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    entrance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 2 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendBox: { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5 },
    selRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    timeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        width: 84,
        height: 38,
        justifyContent: 'center',
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    fit: { borderRadius: radius.lg, padding: 12, gap: 10 },
    suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 30 },
    suggest: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 32,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        backgroundColor: colors.surface,
    },
    fitAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 38,
        borderRadius: radius.md,
        paddingHorizontal: 12,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        height: 24,
        borderRadius: radius.pill,
        backgroundColor: colors.successSoft,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
});