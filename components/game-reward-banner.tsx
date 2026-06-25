import { Image, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { C } from '@/constants/theme';

interface Props {
  xp: number;
  coins: number | null; // null = aguardando / não mostrar ainda
}

export function GameRewardBanner({ xp, coins }: Props) {
  if (coins === null) return null;
  return (
    <View style={s.row}>
      <View style={[s.badge, { backgroundColor: C.purple + '22' }]}>
        <ThemedText style={[s.txt, { color: C.purple }]}>⚡ +{xp} XP</ThemedText>
      </View>
      {coins > 0 && (
        <View style={[s.badge, { backgroundColor: C.gold + '22' }]}>
          <Image
            source={require('@/assets/images/moedas.png')}
            style={s.icon}
            resizeMode="contain"
          />
          <ThemedText style={[s.txt, { color: C.gold }]}>+{coins}</ThemedText>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  icon:  { width: 18, height: 18 },
  txt:   { fontWeight: '800', fontSize: 14 },
});
