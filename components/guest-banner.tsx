import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { C } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export function GuestBanner() {
  const { isGuest, user } = useAuth();

  if (!isGuest || user) return null;

  return (
    <View style={styles.banner}>
      <ThemedText style={styles.text} numberOfLines={1}>
        🔓 Jogando sem conta — progresso não será salvo
      </ThemedText>
      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        style={styles.btn}
        activeOpacity={0.8}>
        <ThemedText style={styles.btnText}>ENTRAR</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.gold + '22',
    borderBottomWidth: 1,
    borderBottomColor: C.gold + '55',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: C.gold,
    fontWeight: '600',
  },
  btn: {
    backgroundColor: C.gold,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  btnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
