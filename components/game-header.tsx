import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function GameHeader({ title, subtitle, right }: GameHeaderProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
        <ThemedText style={styles.backArrow}>←</ThemedText>
      </Pressable>

      <View style={styles.titleBox}>
        <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText themeColor="textSecondary" style={styles.subtitle} numberOfLines={1}>
            {subtitle}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    minHeight: 52,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 22 },
  titleBox: { flex: 1, gap: 1 },
  title: { fontSize: 16 },
  subtitle: { fontSize: 12 },
  rightBox: { width: 60, alignItems: 'flex-end' },
});
