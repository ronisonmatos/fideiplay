import { Image, type ImageSourcePropType } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface TrilhaIconProps {
  icone: string | ImageSourcePropType;
  size: number;
  opacity?: number;
}

// Ícones de trilha estão em transição: a maioria já usa PNG (ver data/trilhas.ts),
// mas trilhas sem arte nova ainda usam emoji — renderiza o tipo certo pra cada caso.
export function TrilhaIcon({ icone, size, opacity = 1 }: TrilhaIconProps) {
  if (typeof icone === 'string') {
    return (
      <ThemedText style={{ fontSize: size, lineHeight: size * 1.2, opacity }}>
        {icone}
      </ThemedText>
    );
  }
  return (
    <Image source={icone} style={{ width: size, height: size, opacity }} resizeMode="contain" />
  );
}
