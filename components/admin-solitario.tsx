import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type SubAba = 'categorias' | 'cartas';

interface CategoriaRow {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  ativo: boolean;
  ordem: number;
}

interface CartaRow {
  id: string;
  categoria_id: string;
  nome: string;
  imagem_url: string | null;
  ativo: boolean;
}

const CATEGORIA_COR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function AdminSolitarioSection() {
  const theme = useTheme();
  const [subAba, setSubAba] = useState<SubAba>('categorias');

  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [categoriasLoading, setCategoriasLoading] = useState(true);
  const [categoriasError, setCategoriasError] = useState<string | null>(null);
  const [categoriasRefresh, setCategoriasRefresh] = useState(false);

  const [cartas, setCartas] = useState<CartaRow[]>([]);
  const [cartasLoading, setCartasLoading] = useState(true);
  const [cartasError, setCartasError] = useState<string | null>(null);
  const [cartasRefresh, setCartasRefresh] = useState(false);
  const [filtroCategoriaId, setFiltroCategoriaId] = useState<string | null>(null);

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catNome, setCatNome] = useState('');
  const [catIcone, setCatIcone] = useState('✝️');
  const [catCor, setCatCor] = useState('#534AB7');
  const [catAtivo, setCatAtivo] = useState(true);
  const [catSaving, setCatSaving] = useState(false);
  const [catToggling, setCatToggling] = useState<string | null>(null);
  const [catDeleting, setCatDeleting] = useState<string | null>(null);

  const [cartaModalVisible, setCartaModalVisible] = useState(false);
  const [cartaEditingId, setCartaEditingId] = useState<string | null>(null);
  const [cartaCategoriaId, setCartaCategoriaId] = useState<string | null>(null);
  const [cartaNome, setCartaNome] = useState('');
  const [cartaImagemUrl, setCartaImagemUrl] = useState('');
  const [cartaAtivo, setCartaAtivo] = useState(true);
  const [cartaSaving, setCartaSaving] = useState(false);
  const [cartaToggling, setCartaToggling] = useState<string | null>(null);
  const [cartaDeleting, setCartaDeleting] = useState<string | null>(null);

  const fetchCategorias = useCallback(async (isRefresh = false) => {
    if (isRefresh) setCategoriasRefresh(true); else setCategoriasLoading(true);
    setCategoriasError(null);
    try {
      const { data, error } = await supabase
        .from('solitario_categorias')
        .select('id, nome, icone, cor, ativo, ordem')
        .order('ordem', { ascending: true });
      if (error) throw error;
      setCategorias((data as CategoriaRow[]) ?? []);
    } catch {
      setCategoriasError('Não foi possível carregar as categorias.');
    } finally {
      setCategoriasLoading(false);
      setCategoriasRefresh(false);
    }
  }, []);

  const fetchCartas = useCallback(async (isRefresh = false) => {
    if (isRefresh) setCartasRefresh(true); else setCartasLoading(true);
    setCartasError(null);
    try {
      const { data, error } = await supabase
        .from('solitario_cartas')
        .select('id, categoria_id, nome, imagem_url, ativo')
        .order('nome', { ascending: true });
      if (error) throw error;
      setCartas((data as CartaRow[]) ?? []);
    } catch {
      setCartasError('Não foi possível carregar as cartas.');
    } finally {
      setCartasLoading(false);
      setCartasRefresh(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchCategorias();
    fetchCartas();
  }, [fetchCategorias, fetchCartas]));

  // ── Categorias ────────────────────────────────────────────────────────────
  const handleOpenCreateCategoria = useCallback(() => {
    setCatEditingId(null);
    setCatNome(''); setCatIcone('✝️'); setCatCor('#534AB7'); setCatAtivo(true);
    setCatModalVisible(true);
  }, []);

  const handleOpenEditCategoria = useCallback((cat: CategoriaRow) => {
    setCatEditingId(cat.id);
    setCatNome(cat.nome); setCatIcone(cat.icone); setCatCor(cat.cor); setCatAtivo(cat.ativo);
    setCatModalVisible(true);
  }, []);

  const handleSaveCategoria = useCallback(async () => {
    const nome = catNome.trim();
    const cor = catCor.trim();
    const icone = catIcone.trim();
    if (!nome || !icone) {
      Alert.alert('Preencha tudo', 'Nome e ícone são obrigatórios.');
      return;
    }
    if (!CATEGORIA_COR_REGEX.test(cor)) {
      Alert.alert('Cor inválida', 'Informe a cor em formato hexadecimal, ex: #534AB7.');
      return;
    }
    setCatSaving(true);
    const payload = { nome, icone, cor, ativo: catAtivo };
    const { error } = catEditingId
      ? await supabase.from('solitario_categorias').update(payload).eq('id', catEditingId)
      : await supabase.from('solitario_categorias').insert(payload);
    setCatSaving(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar a categoria. O nome pode já estar em uso.');
      return;
    }
    setCatModalVisible(false);
    fetchCategorias(true);
  }, [catNome, catIcone, catCor, catAtivo, catEditingId, fetchCategorias]);

  const handleToggleCategoriaAtivo = useCallback(async (cat: CategoriaRow) => {
    setCatToggling(cat.id);
    const { error } = await supabase.from('solitario_categorias').update({ ativo: !cat.ativo }).eq('id', cat.id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar.');
    } else {
      setCategorias(prev => prev.map(c => c.id === cat.id ? { ...c, ativo: !c.ativo } : c));
    }
    setCatToggling(null);
  }, []);

  const handleDeleteCategoria = useCallback((cat: CategoriaRow) => {
    const numCartas = cartas.filter(cr => cr.categoria_id === cat.id).length;
    Alert.alert(
      'Excluir categoria?',
      numCartas > 0
        ? `"${cat.nome}" será removida permanentemente, junto com ${numCartas} carta(s) cadastrada(s) nela.`
        : `"${cat.nome}" será removida permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setCatDeleting(cat.id);
            const { error } = await supabase.from('solitario_categorias').delete().eq('id', cat.id);
            setCatDeleting(null);
            if (error) {
              Alert.alert('Erro', 'Não foi possível excluir a categoria.');
            } else {
              setCategorias(prev => prev.filter(c => c.id !== cat.id));
              setCartas(prev => prev.filter(cr => cr.categoria_id !== cat.id));
            }
          },
        },
      ],
    );
  }, [cartas]);

  // ── Cartas ────────────────────────────────────────────────────────────────
  const handleOpenCreateCarta = useCallback(() => {
    setCartaEditingId(null);
    setCartaCategoriaId(filtroCategoriaId ?? categorias[0]?.id ?? null);
    setCartaNome(''); setCartaImagemUrl(''); setCartaAtivo(true);
    setCartaModalVisible(true);
  }, [filtroCategoriaId, categorias]);

  const handleOpenEditCarta = useCallback((carta: CartaRow) => {
    setCartaEditingId(carta.id);
    setCartaCategoriaId(carta.categoria_id);
    setCartaNome(carta.nome);
    setCartaImagemUrl(carta.imagem_url ?? '');
    setCartaAtivo(carta.ativo);
    setCartaModalVisible(true);
  }, []);

  const handleSaveCarta = useCallback(async () => {
    const nome = cartaNome.trim();
    if (!nome || !cartaCategoriaId) {
      Alert.alert('Preencha tudo', 'Categoria e nome são obrigatórios.');
      return;
    }
    setCartaSaving(true);
    const payload = {
      categoria_id: cartaCategoriaId,
      nome,
      imagem_url: cartaImagemUrl.trim() || null,
      ativo: cartaAtivo,
    };
    const { error } = cartaEditingId
      ? await supabase.from('solitario_cartas').update(payload).eq('id', cartaEditingId)
      : await supabase.from('solitario_cartas').insert(payload);
    setCartaSaving(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar a carta. O nome pode já existir nessa categoria.');
      return;
    }
    setCartaModalVisible(false);
    fetchCartas(true);
  }, [cartaCategoriaId, cartaNome, cartaImagemUrl, cartaAtivo, cartaEditingId, fetchCartas]);

  const handleToggleCartaAtivo = useCallback(async (carta: CartaRow) => {
    setCartaToggling(carta.id);
    const { error } = await supabase.from('solitario_cartas').update({ ativo: !carta.ativo }).eq('id', carta.id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar.');
    } else {
      setCartas(prev => prev.map(c => c.id === carta.id ? { ...c, ativo: !c.ativo } : c));
    }
    setCartaToggling(null);
  }, []);

  const handleDeleteCarta = useCallback((carta: CartaRow) => {
    Alert.alert(
      'Excluir carta?',
      `"${carta.nome}" será removida permanentemente do banco de dados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setCartaDeleting(carta.id);
            const { error } = await supabase.from('solitario_cartas').delete().eq('id', carta.id);
            setCartaDeleting(null);
            if (error) Alert.alert('Erro', 'Não foi possível excluir a carta.');
            else setCartas(prev => prev.filter(c => c.id !== carta.id));
          },
        },
      ],
    );
  }, []);

  const categoriaPorId = (id: string) => categorias.find(c => c.id === id);
  const cartasFiltradas = filtroCategoriaId ? cartas.filter(c => c.categoria_id === filtroCategoriaId) : cartas;

  return (
    <View style={st.fill}>
      {/* Modal — Nova/editar categoria */}
      <Modal visible={catModalVisible} animationType="slide" onRequestClose={() => setCatModalVisible(false)}>
        <ThemedView style={st.fill}>
          <View style={[st.modalHeader, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => setCatModalVisible(false)} style={st.modalCloseBtn}>
              <ThemedText style={{ fontSize: 22 }}>✕</ThemedText>
            </TouchableOpacity>
            <ThemedText type="smallBold">{catEditingId ? 'Editar categoria' : 'Nova categoria'}</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={st.modalScroll} keyboardShouldPersistTaps="handled">
            <ThemedText style={st.fieldLabel}>Nome</ThemedText>
            <TextInput
              style={[st.input, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
              value={catNome} onChangeText={setCatNome}
              placeholder="Ex.: Santos" placeholderTextColor={theme.textSecondary}
            />
            <ThemedText style={st.fieldLabel}>Ícone (emoji)</ThemedText>
            <TextInput
              style={[st.input, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
              value={catIcone} onChangeText={setCatIcone}
              placeholder="✝️" placeholderTextColor={theme.textSecondary}
            />
            <ThemedText style={st.fieldLabel}>Cor (hex)</ThemedText>
            <View style={st.corRow}>
              <View style={[st.corPreview, { backgroundColor: CATEGORIA_COR_REGEX.test(catCor) ? catCor : '#00000000', borderColor: C.border }]} />
              <TextInput
                style={[st.input, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                value={catCor} onChangeText={setCatCor}
                placeholder="#534AB7" placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>
            <View style={st.switchRow}>
              <ThemedText style={st.fieldLabel}>Ativa</ThemedText>
              <Switch value={catAtivo} onValueChange={setCatAtivo} trackColor={{ false: '#3a3a5c', true: C.purple }} thumbColor="#fff" />
            </View>
            <TouchableOpacity
              style={[st.btnPrincipal, catSaving && { opacity: 0.6 }]}
              onPress={handleSaveCategoria} disabled={catSaving} activeOpacity={0.85}>
              {catSaving ? <ActivityIndicator color="#fff" /> : <ThemedText style={st.btnText}>SALVAR</ThemedText>}
            </TouchableOpacity>
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Modal — Nova/editar carta */}
      <Modal visible={cartaModalVisible} animationType="slide" onRequestClose={() => setCartaModalVisible(false)}>
        <ThemedView style={st.fill}>
          <View style={[st.modalHeader, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => setCartaModalVisible(false)} style={st.modalCloseBtn}>
              <ThemedText style={{ fontSize: 22 }}>✕</ThemedText>
            </TouchableOpacity>
            <ThemedText type="smallBold">{cartaEditingId ? 'Editar carta' : 'Nova carta'}</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={st.modalScroll} keyboardShouldPersistTaps="handled">
            <ThemedText style={st.fieldLabel}>Categoria</ThemedText>
            <View style={st.pillRow}>
              {categorias.map(cat => {
                const active = cartaCategoriaId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCartaCategoriaId(cat.id)}
                    style={[st.pillBtn, { borderColor: cat.cor }, active && { backgroundColor: cat.cor }]}
                    activeOpacity={0.8}>
                    <ThemedText style={[st.pillBtnText, { color: active ? '#fff' : cat.cor }]}>{cat.icone} {cat.nome}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
            <ThemedText style={st.fieldLabel}>Nome</ThemedText>
            <TextInput
              style={[st.input, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
              value={cartaNome} onChangeText={setCartaNome}
              placeholder="Ex.: São Francisco" placeholderTextColor={theme.textSecondary}
            />
            <ThemedText style={st.fieldLabel}>Imagem — URL (opcional)</ThemedText>
            <TextInput
              style={[st.input, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
              value={cartaImagemUrl} onChangeText={setCartaImagemUrl}
              placeholder="https://..." placeholderTextColor={theme.textSecondary}
              autoCapitalize="none" keyboardType="url"
            />
            <ThemedText themeColor="textSecondary" style={st.fieldHint}>
              Sem imagem, a carta mostra o nome em texto. A partir do nível 6 o jogo prioriza a imagem quando houver.
            </ThemedText>
            <View style={st.switchRow}>
              <ThemedText style={st.fieldLabel}>Ativa</ThemedText>
              <Switch value={cartaAtivo} onValueChange={setCartaAtivo} trackColor={{ false: '#3a3a5c', true: C.purple }} thumbColor="#fff" />
            </View>
            <TouchableOpacity
              style={[st.btnPrincipal, cartaSaving && { opacity: 0.6 }]}
              onPress={handleSaveCarta} disabled={cartaSaving} activeOpacity={0.85}>
              {cartaSaving ? <ActivityIndicator color="#fff" /> : <ThemedText style={st.btnText}>SALVAR</ThemedText>}
            </TouchableOpacity>
          </ScrollView>
        </ThemedView>
      </Modal>

      <View style={[st.filterRow, { borderBottomColor: C.border }]}>
        {(['categorias', 'cartas'] as SubAba[]).map(a => {
          const active = subAba === a;
          return (
            <TouchableOpacity
              key={a}
              style={[st.filterBtn, active && { borderBottomWidth: 2, borderBottomColor: C.purple }]}
              onPress={() => setSubAba(a)}
              activeOpacity={0.7}>
              <ThemedText style={{ fontSize: 16, lineHeight: 20 }}>{a === 'categorias' ? '🗂️' : '🃏'}</ThemedText>
              <ThemedText style={[st.filterTxt, { color: active ? C.purple : theme.textSecondary }]}>
                {a === 'categorias' ? 'Categorias' : 'Cartas'}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {subAba === 'categorias' ? (
        <>
          <View style={st.newBtnWrap}>
            <TouchableOpacity style={st.newBtn} onPress={handleOpenCreateCategoria} activeOpacity={0.85}>
              <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Nova categoria</ThemedText>
            </TouchableOpacity>
          </View>
          {categoriasLoading ? (
            <View style={st.centerFlex}><ActivityIndicator color={C.purple} /></View>
          ) : categoriasError ? (
            <ErrorState message={categoriasError} onRetry={() => fetchCategorias()} />
          ) : (
            <ScrollView
              contentContainerStyle={st.scroll}
              refreshControl={<RefreshControl refreshing={categoriasRefresh} onRefresh={() => fetchCategorias(true)} tintColor={C.purple} />}>
              {categorias.length === 0 ? (
                <EmptyState icon="🗂️" color={C.purple} title="Nenhuma categoria" subtitle="Toque em “+ Nova categoria” para cadastrar a primeira." />
              ) : categorias.map(cat => {
                const numCartas = cartas.filter(c => c.categoria_id === cat.id).length;
                return (
                  <ThemedView key={cat.id} type="backgroundElement" style={st.card}>
                    <View style={st.row}>
                      <View style={[st.iconWrap, { backgroundColor: cat.cor + '22' }]}>
                        <ThemedText style={{ fontSize: 20 }}>{cat.icone}</ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold" numberOfLines={1}>{cat.nome}</ThemedText>
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                          {numCartas} carta(s) · {cat.cor}
                        </ThemedText>
                      </View>
                      {catToggling === cat.id ? (
                        <ActivityIndicator size="small" color={C.purple} />
                      ) : (
                        <Switch value={cat.ativo} onValueChange={() => handleToggleCategoriaAtivo(cat)} trackColor={{ false: '#3a3a5c', true: C.purple }} thumbColor="#fff" />
                      )}
                    </View>
                    <View style={st.footerRow}>
                      <TouchableOpacity onPress={() => handleOpenEditCategoria(cat)} activeOpacity={0.7}>
                        <ThemedText style={{ fontSize: 12, color: C.purple, fontWeight: '700' }}>✏️ Editar</ThemedText>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }} />
                      {catDeleting === cat.id ? (
                        <ActivityIndicator size="small" color={C.red} />
                      ) : (
                        <TouchableOpacity onPress={() => handleDeleteCategoria(cat)} activeOpacity={0.7} hitSlop={8}>
                          <ThemedText style={{ fontSize: 11, color: C.red, fontWeight: '600' }}>🗑 Excluir</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ThemedView>
                );
              })}
            </ScrollView>
          )}
        </>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filtroCategoriaRow}>
            <TouchableOpacity
              onPress={() => setFiltroCategoriaId(null)}
              style={[st.pillBtn, { borderColor: C.purple }, filtroCategoriaId === null && { backgroundColor: C.purple }]}>
              <ThemedText style={[st.pillBtnText, { color: filtroCategoriaId === null ? '#fff' : C.purple }]}>Todas</ThemedText>
            </TouchableOpacity>
            {categorias.map(cat => {
              const active = filtroCategoriaId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setFiltroCategoriaId(cat.id)}
                  style={[st.pillBtn, { borderColor: cat.cor }, active && { backgroundColor: cat.cor }]}>
                  <ThemedText style={[st.pillBtnText, { color: active ? '#fff' : cat.cor }]}>{cat.icone} {cat.nome}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={st.newBtnWrap}>
            <TouchableOpacity style={st.newBtn} onPress={handleOpenCreateCarta} activeOpacity={0.85}>
              <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Nova carta</ThemedText>
            </TouchableOpacity>
          </View>
          {cartasLoading ? (
            <View style={st.centerFlex}><ActivityIndicator color={C.purple} /></View>
          ) : cartasError ? (
            <ErrorState message={cartasError} onRetry={() => fetchCartas()} />
          ) : (
            <ScrollView
              contentContainerStyle={st.scroll}
              refreshControl={<RefreshControl refreshing={cartasRefresh} onRefresh={() => fetchCartas(true)} tintColor={C.purple} />}>
              {cartasFiltradas.length === 0 ? (
                <EmptyState icon="🃏" color={C.purple} title="Nenhuma carta" subtitle="Toque em “+ Nova carta” para cadastrar a primeira." />
              ) : cartasFiltradas.map(carta => {
                const cat = categoriaPorId(carta.categoria_id);
                return (
                  <ThemedView key={carta.id} type="backgroundElement" style={st.card}>
                    <View style={st.row}>
                      {carta.imagem_url ? (
                        <Image source={{ uri: carta.imagem_url }} style={st.thumb} />
                      ) : (
                        <View style={[st.thumb, st.thumbPlaceholder, { backgroundColor: (cat?.cor ?? C.purple) + '22' }]}>
                          <ThemedText style={{ fontSize: 18 }}>{cat?.icone ?? '🃏'}</ThemedText>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold" numberOfLines={1}>{carta.nome}</ThemedText>
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }} numberOfLines={1}>
                          {cat?.nome ?? '—'}
                        </ThemedText>
                      </View>
                      {cartaToggling === carta.id ? (
                        <ActivityIndicator size="small" color={C.purple} />
                      ) : (
                        <Switch value={carta.ativo} onValueChange={() => handleToggleCartaAtivo(carta)} trackColor={{ false: '#3a3a5c', true: C.purple }} thumbColor="#fff" />
                      )}
                    </View>
                    <View style={st.footerRow}>
                      <TouchableOpacity onPress={() => handleOpenEditCarta(carta)} activeOpacity={0.7}>
                        <ThemedText style={{ fontSize: 12, color: C.purple, fontWeight: '700' }}>✏️ Editar</ThemedText>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }} />
                      {cartaDeleting === carta.id ? (
                        <ActivityIndicator size="small" color={C.red} />
                      ) : (
                        <TouchableOpacity onPress={() => handleDeleteCarta(carta)} activeOpacity={0.7} hitSlop={8}>
                          <ThemedText style={{ fontSize: 11, color: C.red, fontWeight: '600' }}>🗑 Excluir</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ThemedView>
                );
              })}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

function EmptyState({ icon, color, title, subtitle }: { icon: string; color: string; title: string; subtitle: string }) {
  return (
    <View style={st.emptyWrap}>
      <View style={[st.emptyIconWrap, { backgroundColor: color + '18' }]}>
        <ThemedText style={{ fontSize: 32 }}>{icon}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={[st.center, { color }]}>{title}</ThemedText>
      <ThemedText themeColor="textSecondary" style={[st.center, { fontSize: 13 }]}>{subtitle}</ThemedText>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={st.centerFlex}>
      <ThemedText style={{ fontSize: 36, lineHeight: 44 }}>⚠️</ThemedText>
      <ThemedText themeColor="textSecondary" style={[st.center, { fontSize: 13 }]}>{message}</ThemedText>
      <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={st.retryBtn}>
        <ThemedText style={{ color: C.purple, fontWeight: '700', fontSize: 14 }}>Tentar novamente</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: 'center' },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingTop: Spacing.five },
  scroll: { padding: Spacing.three, gap: Spacing.two },

  filterRow: { flexDirection: 'row', borderBottomWidth: 1 },
  filterBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4, flexDirection: 'row', justifyContent: 'center' },
  filterTxt: { fontSize: 13, fontWeight: '700' },

  filtroCategoriaRow: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.one },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, marginBottom: Spacing.two },
  pillBtn: { borderWidth: 1.5, borderRadius: C.radius.pill, paddingHorizontal: 12, paddingVertical: 6, marginRight: Spacing.one },
  pillBtnText: { fontSize: 12, fontWeight: '700' },

  newBtnWrap: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  newBtn: { backgroundColor: C.purple, borderRadius: C.radius.pill, paddingVertical: 12, alignItems: 'center' },

  card: { borderRadius: C.radius.md, padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 40, height: 40, borderRadius: C.radius.sm },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center' },

  emptyWrap: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.five, paddingHorizontal: Spacing.four },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  retryBtn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },

  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, minHeight: 56,
  },
  modalCloseBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalScroll: { padding: Spacing.four, gap: Spacing.two },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginTop: Spacing.two, marginBottom: 2 },
  fieldHint: { fontSize: 12, lineHeight: 17 },
  input: { borderWidth: 1, borderRadius: C.radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  corRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  corPreview: { width: 40, height: 40, borderRadius: C.radius.sm, borderWidth: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two },
  btnPrincipal: { backgroundColor: C.purple, borderRadius: C.radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.four },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
