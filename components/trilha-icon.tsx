import { Image, type ImageSourcePropType } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface TrilhaIconProps {
  icone: string | ImageSourcePropType;
  size: number;
  opacity?: number;
}

// Ícones de trilha têm 3 formas possíveis:
// - asset local via require() (a maioria das trilhas embutidas, ver data/trilhas.ts)
// - emoji (trilhas sem arte própria, ou cadastradas via banco sem PNG ainda)
// - URL pública (trilha cadastrada via banco com PNG subido no bucket "trilha-icones")
export function TrilhaIcon({ icone, size, opacity = 1 }: TrilhaIconProps) {
  if (typeof icone === 'string') {
    if (icone.startsWith('http://') || icone.startsWith('https://')) {
      return (
        <Image source={{ uri: icone }} style={{ width: size, height: size, opacity }} resizeMode="contain" />
      );
    }
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
