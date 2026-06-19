import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

const CATEGORIES = [
  {
    emoji: '🏆',
    title: 'Quiz dos Santos',
    description: 'Perguntas sobre a vida dos santos, com ranking e conquistas.',
    tag: 'Conhecimento',
    tagColor: '#F59E0B',
    route: '/quiz-santos' as const,
  },
  {
    emoji: '📖',
    title: 'Versículo Misterioso',
    description: 'Descubra o trecho bíblico a partir de dicas progressivas.',
    tag: 'Bíblia',
    tagColor: '#8B5CF6',
    route: '/versiculo-misterioso' as const,
  },
  {
    emoji: '🗺️',
    title: 'Peregrinação Virtual',
    description: 'Percorra santuários do mundo respondendo perguntas para avançar.',
    tag: 'Aventura',
    tagColor: '#10B981',
    route: '/peregrinacao' as const,
  },
  {
    emoji: '🔤',
    title: 'Palavras da Fé',
    description: 'Caça-palavras temático: liturgia, orações e sacramentos.',
    tag: 'Vocabulário',
    tagColor: '#3B82F6',
    route: '/palavras-fe' as const,
  },
  {
    emoji: '⏱️',
    title: 'Desafio Litúrgico',
    description: 'Identifique cores e rituais da missa contra o relógio.',
    tag: 'Liturgia',
    tagColor: '#EF4444',
    route: '/desafio-liturgico' as const,
  },
  {
    emoji: '🛑',
    title: 'Stop Católico',
    description: 'Preencha as categorias com palavras da fé que começam com a letra sorteada.',
    tag: 'Vocabulário',
    tagColor: '#F97316',
    route: '/stop-catolico' as const,
  },
] as const;

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: BottomTabInset + Spacing.five },
          ]}>
          <View style={styles.hero}>
            <Image
              source={require('@/assets/images/logo_fideiplay.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText themeColor="textSecondary" style={styles.tagline}>
              Jogos Católicos para toda a família
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              ESCOLHA UM JOGO
            </ThemedText>

            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.title}
                onPress={() => router.push(cat.route)}
                activeOpacity={0.75}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText style={styles.cardEmoji}>{cat.emoji}</ThemedText>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <ThemedText type="smallBold" style={styles.cardTitle}>
                        {cat.title}
                      </ThemedText>
                      <View style={[styles.tag, { backgroundColor: cat.tagColor + '22' }]}>
                        <ThemedText style={[styles.tagText, { color: cat.tagColor }]}>
                          {cat.tag}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText themeColor="textSecondary" style={styles.cardDesc}>
                      {cat.description}
                    </ThemedText>
                  </View>
                  <ThemedText themeColor="textSecondary" style={styles.arrow}>
                    ›
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.four, gap: Spacing.five },
  hero: { alignItems: 'center', paddingTop: Spacing.four, gap: Spacing.one },
  logo: { width: 200, height: 120 },
  tagline: { fontSize: 15, textAlign: 'center', marginTop: Spacing.one },
  section: { gap: Spacing.two },
  sectionLabel: { letterSpacing: 1.1, marginBottom: Spacing.one },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardEmoji: { fontSize: 32, width: 44, textAlign: 'center' },
  cardBody: { flex: 1, gap: Spacing.half },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  cardTitle: { fontSize: 15 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  tagText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  arrow: { fontSize: 24, marginRight: 2 },
});
