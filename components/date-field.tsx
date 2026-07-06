import { useState } from 'react';
import { Modal, Platform, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { C } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function isoToDate(iso: string | null): Date {
  if (!iso) return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatBR(iso: string | null): string {
  if (!iso) return 'Selecionar';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface DateFieldProps {
  label: string;
  value: string | null; // ISO 'AAAA-MM-DD' ou null
  onChange: (iso: string) => void;
  minimumDate?: Date;
}

export function DateField({ label, value, onChange, minimumDate }: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && selected) onChange(dateToIso(selected));
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1.5,
          borderColor: C.border,
          borderRadius: C.radius.pill,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: theme.background,
        }}>
        <ThemedText style={{ fontSize: 13, color: theme.textSecondary }}>{label}</ThemedText>
        <ThemedText style={{ fontSize: 14, fontWeight: '700', color: value ? theme.text : theme.textSecondary }}>
          {formatBR(value)} 📅
        </ThemedText>
      </TouchableOpacity>

      {/* Android abre o diálogo nativo do sistema — não precisa de Modal próprio */}
      {open && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={isoToDate(value)}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      )}

      {/* iOS: calendário centralizado num Modal — evita ficar espremido dentro de colunas estreitas */}
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <View style={{ width: '100%', maxWidth: 340, borderRadius: C.radius.lg, overflow: 'hidden', backgroundColor: theme.background }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '700', textAlign: 'center', paddingTop: 14, color: theme.textSecondary }}>
                {label}
              </ThemedText>
              <DateTimePicker
                value={isoToDate(value)}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                onChange={handleChange}
              />
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={{ paddingVertical: 12, alignItems: 'center', backgroundColor: C.purple }}
                activeOpacity={0.85}>
                <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Concluir</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
