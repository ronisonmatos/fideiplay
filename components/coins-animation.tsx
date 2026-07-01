import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { C } from '@/constants/theme';

interface Props {
  amount: number;
  visible: boolean;
  onDone?: () => void;
}

export function CoinsAnimation({ amount, visible, onDone }: Props) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.5)).current;
  const isSpend    = amount < 0;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(1);
    translateY.setValue(0);
    scale.setValue(0.5);

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -80, duration: 1400, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start(() => onDone?.());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const color       = isSpend ? C.red  : C.gold;
  const borderColor = isSpend ? C.red + '88' : C.gold + '88';
  const label       = isSpend ? `${amount} 🪙` : `+${amount}`;

  return (
    <Animated.View style={[s.wrap, { opacity, transform: [{ translateY }, { scale }] }]} pointerEvents="none">
      <View style={[s.inner, { borderColor }]}>
        {!isSpend && <Image source={require('@/assets/images/moedas.png')} style={s.icon} resizeMode="contain" />}
        <ThemedText style={[s.text, { color }]}>{label}</ThemedText>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 999,
    top: '40%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: C.gold + '88',
  },
  icon: { width: 24, height: 24 },
  text: { color: C.gold, fontWeight: '900', fontSize: 22 },
});
