import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function GameHeader({ title, subtitle, right }: GameHeaderProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.header, { borderBottomColor: C.border }]}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
        <ThemedText style={styles.backArrow}>←</ThemedText>
      </Pressable>

      <View style={styles.titleBox}>
        <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            themeColor="textSecondary"
            style={styles.subtitle}
            numberOfLines={1}>
            {subtitle.toUpperCase()}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.rightBox}>{right ?? null}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
    minHeight: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: C.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backArrow: { fontSize: 26 },
  titleBox: { flex: 1, gap: 2 },
  title: { fontSize: 16, letterSpacing: 0.2 },
  subtitle: { fontSize: 11, letterSpacing: 1.1 },
  rightBox: { width: 64, alignItems: 'flex-end' },
});
