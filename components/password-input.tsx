import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {}

// Campo de senha com botão de mostrar/ocultar — mesmo TextInput por fora,
// só envolve num View relativo pra encaixar o botão do olho por cima.
export function PasswordInput({ style, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={s.wrap}>
      <TextInput
        style={[style, s.input]}
        secureTextEntry={!visible}
        {...props}
      />
      <TouchableOpacity
        onPress={() => setVisible(v => !v)}
        style={s.toggle}
        hitSlop={10}
        activeOpacity={0.7}>
        <ThemedText style={s.toggleIcon}>{visible ? '🙈' : '👁️'}</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  input: { paddingRight: 44 },
  toggle: {
    position: 'absolute',
    right: 4,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  toggleIcon: { fontSize: 18 },
});
