import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { C } from '@/constants/theme';

// Faixa diagonal no canto superior direito, estilo "selo de promoção" de
// e-commerce. O container externo é quadrado e cortado (overflow: hidden) —
// é ele que define o canto onde a faixa aparece; a faixa em si é uma tira
// larga, rotacionada 45°, posicionada pra cruzar esse canto na diagonal.
export function PromoRibbon({ label = 'PROMOÇÃO' }: { label?: string }) {
  return (
    <View style={s.container} pointerEvents="none">
      <View style={s.ribbon}>
        <ThemedText style={s.text} numberOfLines={1}>{label}</ThemedText>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    overflow: 'hidden',
    zIndex: 10,
  },
  ribbon: {
    position: 'absolute',
    top: 14,
    right: -30,
    width: 130,
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: C.red,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
