import { useState, useRef, useCallback } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  senderName?: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Bem-vindo ao FideiPlay! 🙏 Conecte-se com outros jogadores e compartilhe sua fé.',
    sender: 'other',
    senderName: 'FideiPlay',
    timestamp: '09:00',
  },
  {
    id: '2',
    text: 'Alguém quer jogar o Quiz Bíblico? 📖',
    sender: 'other',
    senderName: 'Maria S.',
    timestamp: '09:05',
  },
  {
    id: '3',
    text: 'Eu quero! Qual nível você está?',
    sender: 'user',
    timestamp: '09:06',
  },
  {
    id: '4',
    text: 'Nível intermediário! Vamos lá 😊',
    sender: 'other',
    senderName: 'Maria S.',
    timestamp: '09:07',
  },
  {
    id: '5',
    text: 'Acabei de completar o desafio dos Salmos. Muito bom!',
    sender: 'other',
    senderName: 'João P.',
    timestamp: '09:12',
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const theme = useTheme();

  const sendMessage = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setMessages(prev => [
      ...prev,
      { id: String(Date.now()), text: trimmed, sender: 'user', timestamp },
    ]);
    setInputText('');

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  }, [inputText]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
          <ThemedText type="subtitle">Chat</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
            Comunidade FideiPlay
          </ThemedText>
        </ThemedView>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.messageList,
              { paddingBottom: BottomTabInset + Spacing.four },
            ]}
            renderItem={({ item, index }) => {
              const isUser = item.sender === 'user';
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showSender =
                !isUser && item.senderName && prevMsg?.senderName !== item.senderName;

              return (
                <View
                  style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowOther,
                  ]}>
                  {showSender && (
                    <Text style={[styles.senderName, { color: theme.textSecondary }]}>
                      {item.senderName}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? styles.bubbleUser
                        : [styles.bubbleOther, { backgroundColor: theme.backgroundElement }],
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        { color: isUser ? '#ffffff' : theme.text },
                      ]}>
                      {item.text}
                    </Text>
                    <Text
                      style={[
                        styles.timestamp,
                        {
                          color: isUser ? 'rgba(255,255,255,0.65)' : theme.textSecondary,
                        },
                      ]}>
                      {item.timestamp}
                    </Text>
                  </View>
                </View>
              );
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          <ThemedView
            type="backgroundElement"
            style={[
              styles.inputBar,
              { paddingBottom: BottomTabInset > 0 ? Spacing.two : Spacing.three },
            ]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escreva uma mensagem..."
              placeholderTextColor={theme.textSecondary}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              activeOpacity={0.75}
              style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.4 }]}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.half,
  },
  headerSubtitle: { fontSize: 14 },
  messageList: { padding: Spacing.three, gap: Spacing.two },
  messageRow: { gap: 2 },
  messageRowUser: { alignItems: 'flex-end' },
  messageRowOther: { alignItems: 'flex-start' },
  senderName: { fontSize: 12, marginBottom: 2, marginLeft: Spacing.two },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    gap: 4,
  },
  bubbleUser: { backgroundColor: '#208AEF', borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16, lineHeight: 22 },
  timestamp: { fontSize: 11, alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#ffffff', fontSize: 18, marginLeft: 2 },
});
