import { useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// "Portão parental": antes de liberar um recurso social para uma conta de
// menor de idade, confirma que quem está mexendo no aparelho é um adulto
// (conta de soma simples, sem checar identidade real). Exigência da
// Política para Famílias da Play Store ("consentimento de um adulto").
interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function novaConta(): { a: number; b: number; resposta: number } {
  const a = 10 + Math.floor(Math.random() * 15);
  const b = 10 + Math.floor(Math.random() * 15);
  return { a, b, resposta: a + b };
}

export function ParentalGate({ visible, onCancel, onConfirm }: Props) {
  const theme = useTheme();
  const [conta, setConta] = useState(novaConta);
  const [valor, setValor] = useState('');
  const [erro,  setErro]  = useState(false);

  function reset() {
    setConta(novaConta());
    setValor('');
    setErro(false);
  }

  function handleConfirmar() {
    if (Number(valor) === conta.resposta) {
      reset();
      onConfirm();
    } else {
      setErro(true);
    }
  }

  function handleCancelar() {
    reset();
    onCancel();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleCancelar}>
      <View style={s.overlay}>
        <ThemedView style={s.card}>
          <ThemedText style={{ fontSize: 32, textAlign: 'center' }}>🔒</ThemedText>
          <ThemedText type="subtitle" style={{ fontSize: 17, textAlign: 'center', marginTop: Spacing.two }}>
            Confirmação de um adulto
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>
            Para ativar o chat da comunidade nesta conta de menor de idade, resolva a conta abaixo.
          </ThemedText>

          <ThemedText style={{ fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: Spacing.three }}>
            {conta.a} + {conta.b} = ?
          </ThemedText>

          <TextInput
            style={[s.input, { color: theme.text, borderColor: erro ? C.red : C.border, backgroundColor: theme.background }]}
            value={valor}
            onChangeText={t => { setValor(t.replace(/\D/g, '')); setErro(false); }}
            keyboardType="numeric"
            placeholder="Resposta"
            placeholderTextColor={theme.textSecondary}
            autoFocus
          />
          {erro && (
            <ThemedText style={{ color: C.red, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              Resposta incorreta. Tente de novo.
            </ThemedText>
          )}

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancelar} activeOpacity={0.7}>
              <ThemedText style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancelar</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.confirmBtn, { opacity: valor ? 1 : 0.5 }]}
              onPress={handleConfirmar}
              disabled={!valor}
              activeOpacity={0.8}>
              <ThemedText style={{ color: '#fff', fontWeight: '800' }}>CONFIRMAR</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  card: { width: '100%', maxWidth: 360, borderRadius: C.radius.lg, padding: Spacing.four },
  input: {
    marginTop: Spacing.three,
    borderWidth: 1.5,
    borderRadius: C.radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: C.radius.pill, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: C.radius.pill, alignItems: 'center', backgroundColor: C.purple },
});
