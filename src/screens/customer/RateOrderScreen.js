import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideOutLeft, ZoomIn } from 'react-native-reanimated';
import { ordersApi, reviewsApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { colors } from '../../theme';
import { toast } from '../../store/toast';
import {
    Body,
    BottomBar,
    Button,
    Card,
    Chip,
    DishImage,
    Header,
    Input,
    ListSkeleton,
    ProgressBar,
    Screen,
    Stars,
    SuccessBurst,
    Txt,
} from '../../components/ui';
const MOODS = ['', 'Terrible 😞', 'Not great 😕', 'Okay 🙂', 'Good 😊', 'Amazing 🤩'];
const TAGS = ['Delicious food', 'Fast service', 'Friendly staff', 'Great ambience', 'Good value', 'Generous portions'];
export function RateOrderScreen({ route, navigation }) {
    const { orderId } = route.params;
    const qc = useQueryClient();
    const order = useQuery({ queryKey: ['orders', orderId], queryFn: () => ordersApi.get(orderId) });
    const o = order.data;
    const [step, setStep] = useState(1);
    const [overall, setOverall] = useState(0);
    const [sub, setSub] = useState({ food: 0, service: 0, ambience: 0 });
    const [tags, setTags] = useState([]);
    const [comment, setComment] = useState('');
    const [dishes, setDishes] = useState({});
    const toRate = o?.items.filter((i) => !i.review) ?? [];
    useEffect(() => {
        if (o?.restaurantReview && step === 1) setStep(2);
    }, [o?.restaurantReview]);
    const submitRestaurant = useMutation({
        mutationFn: () =>
            reviewsApi.rateRestaurant(orderId, {
                rating: overall,
                foodRating: sub.food || undefined,
                serviceRating: sub.service || undefined,
                ambienceRating: sub.ambience || undefined,
                comment: [tags.join(', '), comment.trim()].filter(Boolean).join('. ') || undefined,
            }),
        onSuccess: () => (toRate.length ? setStep(2) : finish()),
        onError: (e) => toast.error("Couldn't send review", errorMessage(e)),
    });
    const submitDishes = useMutation({
        mutationFn: () =>
            reviewsApi.rateDishes(
                orderId,
                Object.entries(dishes)
                    .filter(([, v]) => v.rating > 0)
                    .map(([orderItemId, v]) => ({ orderItemId, rating: v.rating, comment: v.comment.trim() || undefined })),
            ),
        onSuccess: () => finish(),
        onError: (e) => toast.error("Couldn't send review", errorMessage(e)),
    });
    function finish() {
        qc.invalidateQueries({ queryKey: ['orders'] });
        qc.invalidateQueries({ queryKey: ['reviews'] });
        qc.invalidateQueries({ queryKey: ['menu'] });
        qc.invalidateQueries({ queryKey: ['restaurant'] });
        setStep(3);
    }
    if (order.isLoading || !o) {
        return (
            <Screen>
                <Header title="Rate your order" />
                <ListSkeleton rows={3} />
            </Screen>
        );
    }
    const ratedDishes = Object.values(dishes).filter((d) => d.rating > 0).length;
    return (
        <Screen>
            <Header title="Rate your order" subtitle={`#${o.orderNumber}`} />
            {step < 3 ? (
                <View style={{ paddingHorizontal: 20, gap: 6 }}>
                    <ProgressBar value={step === 1 ? 0.5 : 1} />
                    <Txt variant="tiny">
                        Step {step} of 2 · {step === 1 ? 'Your visit' : 'Your dishes'}
                    </Txt>
                </View>
            ) : null}

            {step === 1 ? (
                <Animated.View key="s1" entering={FadeIn} exiting={SlideOutLeft} style={{ flex: 1 }}>
                    <Body>
                        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
                            <Txt variant="h2" center>
                                How was your experience?
                            </Txt>
                            <Stars value={overall} onChange={setOverall} size={42} gap={6} />
                            {overall ? (
                                <Animated.View key={overall} entering={ZoomIn.springify()}>
                                    <Txt variant="h3" color={colors.primary}>
                                        {MOODS[overall]}
                                    </Txt>
                                </Animated.View>
                            ) : (
                                <Txt variant="small">Tap a star</Txt>
                            )}
                        </Card>
                        {overall ? (
                            <Animated.View entering={FadeInDown.springify()} style={{ gap: 16 }}>
                                <Card style={{ gap: 14 }}>
                                    {[
                                        ['food', 'Food', 'food'],
                                        ['service', 'Service', 'room-service-outline'],
                                        ['ambience', 'Ambience', 'lamp'],
                                    ].map(([k, l]) => (
                                        <View
                                            key={k}
                                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                        >
                                            <Txt variant="bodyMedium">{l}</Txt>
                                            <Stars value={sub[k]} onChange={(v) => setSub((s) => ({ ...s, [k]: v }))} size={26} gap={4} />
                                        </View>
                                    ))}
                                </Card>
                                <Txt variant="h3">What stood out?</Txt>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {TAGS.map((t) => (
                                        <Chip
                                            key={t}
                                            small
                                            label={t}
                                            active={tags.includes(t)}
                                            onPress={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
                                        />
                                    ))}
                                </View>
                                <Input
                                    label="Tell us more (optional)"
                                    placeholder="Your review is shown to other guests exactly as you write it."
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                    maxLength={800}
                                />
                            </Animated.View>
                        ) : null}
                    </Body>
                    <BottomBar>
                        <Button
                            title={toRate.length ? 'Next: rate dishes' : 'Submit review'}
                            iconRight="arrow-right"
                            disabled={!overall}
                            loading={submitRestaurant.isPending}
                            onPress={() => submitRestaurant.mutate()}
                        />
                    </BottomBar>
                </Animated.View>
            ) : null}

            {step === 2 ? (
                <Animated.View key="s2" entering={SlideInRight.springify().damping(18)} style={{ flex: 1 }}>
                    <Body>
                        <Txt variant="small">Rate the dishes you tried. Skip any you don't want to rate.</Txt>
                        {toRate.map((item, i) => {
                            const v = dishes[item.id] ?? { rating: 0, comment: '' };
                            return (
                                <Animated.View key={item.id} entering={FadeInDown.delay(i * 80).springify()}>
                                    <Card style={{ gap: 10 }}>
                                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                            <DishImage uri={item.imageUrl} size={54} radius={14} />
                                            <View style={{ flex: 1, gap: 4 }}>
                                                <Txt variant="bodyMedium">{item.name}</Txt>
                                                <Stars
                                                    value={v.rating}
                                                    onChange={(r) => setDishes((d) => ({ ...d, [item.id]: { ...v, rating: r } }))}
                                                    size={26}
                                                    gap={4}
                                                />
                                            </View>
                                        </View>
                                        {v.rating ? (
                                            <Animated.View entering={FadeIn}>
                                                <Input
                                                    placeholder="Comment (optional)"
                                                    value={v.comment}
                                                    onChangeText={(c) => setDishes((d) => ({ ...d, [item.id]: { ...v, comment: c } }))}
                                                    maxLength={500}
                                                />
                                            </Animated.View>
                                        ) : null}
                                    </Card>
                                </Animated.View>
                            );
                        })}
                    </Body>
                    <BottomBar>
                        <Button
                            title={ratedDishes ? `Submit ${ratedDishes} dish review${ratedDishes > 1 ? 's' : ''}` : 'Skip'}
                            variant={ratedDishes ? 'primary' : 'outline'}
                            loading={submitDishes.isPending}
                            onPress={() => (ratedDishes ? submitDishes.mutate() : finish())}
                        />
                    </BottomBar>
                </Animated.View>
            ) : null}

            {step === 3 ? (
                <Animated.View entering={FadeIn} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10 }}>
                    <SuccessBurst size={96} color={colors.gold} bg={colors.goldSoft} />
                    <Txt variant="h1" center>
                        Thank you!
                    </Txt>
                    <Txt variant="body" color={colors.textMuted} center>
                        Your review helps other guests and our kitchen. It's now live on the restaurant page.
                    </Txt>
                    <Button title="Done" style={{ marginTop: 16 }} onPress={() => navigation.goBack()} />
                </Animated.View>
            ) : null}
        </Screen>
    );
}
