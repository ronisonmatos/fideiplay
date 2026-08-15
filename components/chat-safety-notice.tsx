import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';

// Lembrete de segurança on-line, exigido pela Política para Famílias da Play
// Store antes de liberar a um menor de idade a troca de mensagens em formato
// livre no chat da comunidade. Só fecha pelo botão "Entendi" — confirmação
// fica em profiles.chat_safety_ack_at (app/(tabs)/chat.tsx).
interface Props {
  visible: boolean;
  onAck: () => void;
}

const REGRAS = [
  { emoji: '🙈', texto: 'Nunca compartilhe seu endereço, telefone, escola ou senhas com outras pessoas do chat.' },
  { emoji: '📸', texto: 'Não envie fotos suas ou combine encontros pessoais com quem você conhece só pelo app.' },
  { emoji: '🚩', texto: 'Se alguém pedir informações pessoais ou te deixar desconfortável, denuncie e bloqueie.' },
  { emoji: '👨‍👩‍👧', texto: 'Converse com um adulto de confiança sempre que algo parecer estranho.' },
];

export function ChatSafetyNotice({ visible, onAck }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <ThemedView style={s.card}>
          <ThemedText style={{ fontSize: 34, textAlign: 'center' }}>🛡️</ThemedText>
          <ThemedText type="subtitle" style={{ fontSize: 18, textAlign: 'center', marginTop: Spacing.two }}>
            Antes de conversar, leia isso
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ fontSize: 13, textAlign: 'center', marginTop: 6 }}>
            O chat da comunidade é público — qualquer pessoa cadastrada pode ver o que você escreve.
          </ThemedText>

          <ScrollView style={{ marginTop: Spacing.three, maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: Spacing.three }}>
              {REGRAS.map(r => (
                <View key={r.texto} style={s.regraRow}>
                  <ThemedText style={{ fontSize: 20 }}>{r.emoji}</ThemedText>
                  <ThemedText style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{r.texto}</ThemedText>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={s.ackBtn} onPress={onAck} activeOpacity={0.85}>
            <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>ENTENDI, VOU ME CUIDAR</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  card: { width: '100%', maxWidth: 400, borderRadius: C.radius.lg, padding: Spacing.four },
  regraRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  ackBtn: {
    marginTop: Spacing.four,
    backgroundColor: C.purple,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
  },
});
