import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';

import { AvatarImage } from '@/components/avatar-image';
import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrilhaIcon } from '@/components/trilha-icon';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { TRILHAS } from '@/data/trilhas';
import {
  type AdminUserResult,
  listUserTrilhas,
  revokeTrilha,
  searchUsers,
  unlockTrilha,
} from '@/lib/admin-trilhas';
import { broadcastNotification, sendNotificationToUser, triggerDispatchNow } from '@/lib/admin-notifications';
import { suggestBannerDescription } from '@/lib/banner-ads';
import { ALCANCE_LABELS } from '@/constants/eventos-precos';
import { CATEGORIAS_EVENTO, CORES_CATEGORIA, type CategoriaEvento } from '@/constants/banner-config';
import { notificarUsuario, type EventoPatrocinado } from '@/lib/eventos-patrocinados';

const TRILHAS_PREMIUM = TRILHAS.filter(t => !t.gratis);

// Máscara automática enquanto digita — só números, barras/dois-pontos entram sozinhos
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// Converte DD/MM/AAAA + HH:MM (ambos opcionais) em ISO; null = sem data definida
function parseOptionalDateTime(dateStr: string, timeStr: string): { ok: boolean; value: string | null } {
  if (!dateStr.trim() && !timeStr.trim()) return { ok: true, value: null };
  const [dd, mm, yyyy] = dateStr.split('/').map(Number);
  const [hh, min] = (timeStr.trim() || '00:00').split(':').map(Number);
  if (!dd || !mm || !yyyy || Number.isNaN(hh) || Number.isNaN(min)) return { ok: false, value: null };
  const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
  if (Number.isNaN(d.getTime())) return { ok: false, value: null };
  return { ok: true, value: d.toISOString() };
}

function isoToDatePart(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function isoToTimePart(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Converte AAAA-MM-DD (coluna date) em Date local, sem shift de timezone
function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "SP, RJ" -> ["SP", "RJ"] — mesma normalização (maiúsculas) usada em hooks/use-location.ts
function parseListaCsv(text: string): string[] {
  return text.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}

interface PickedAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

// Sobe uma imagem já escolhida no bucket "ads" e devolve a URL pública.
async function uploadAdImage(asset: PickedAsset): Promise<string> {
  const ext  = (asset.fileName?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const bytes = await new File(asset.uri).bytes();
  const { error } = await supabase.storage
    .from('ads')
    .upload(path, bytes, { contentType: asset.mimeType || 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('ads').getPublicUrl(path);
  return data.publicUrl;
}

// Abre a galeria e devolve os assets escolhidos, sem subir nada ainda.
// Array vazio = usuário cancelou (erro de permissão só mostra o alerta).
async function pickAdImages(opts?: { multiple?: boolean; limit?: number }): Promise<PickedAsset[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permissão negada', 'Autorize o acesso às fotos para escolher uma imagem.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsMultipleSelection: !!opts?.multiple,
    selectionLimit: opts?.limit ?? 1,
  });
  if (result.canceled || !result.assets?.length) return [];
  return result.assets.map(a => ({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType }));
}

// Abre a galeria, sobe a(s) imagem(ns) escolhida(s) no bucket "ads" e devolve as URLs públicas
// na ordem selecionada. Array vazio = usuário cancelou (erros de permissão/upload lançam).
async function pickAndUploadAdImages(opts?: { multiple?: boolean; limit?: number }): Promise<string[]> {
  const assets = await pickAdImages(opts);
  const urls: string[] = [];
  for (const asset of assets) urls.push(await uploadAdImage(asset));
  return urls;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AdminSection   = 'contests' | 'support' | 'trilhas' | 'notifications' | 'ads' | 'banners' | 'eventos' | 'config';
type NotifMode       = 'geral' | 'direto';
type NotifSchedule    = 'now' | '1h' | 'tomorrow9' | 'custom';
type EventosSub      = 'pendentes' | 'historico';
type FilterStatus   = 'pending' | 'approved' | 'rejected';
type SupportFilter  = 'unread' | 'all';

interface Contest {
  id: string;
  user_id: string;
  room_id: string | null;
  category_key: string;
  letter: string;
  answer: string;
  original_result: string;
  game_mode: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  profiles: { name: string; avatar_emoji: string } | null;
}

interface SupportMsg {
  id: string;
  user_id: string | null;
  email: string | null;
  message: string;
  created_at: string;
  read: boolean;
  reply: string | null;
  replied_at: string | null;
}

interface AdRow {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_urls: string[] | null;
  media_type: 'video' | 'image';
  thumb_url: string | null;
  cta_text: string;
  cta_url: string | null;
  duration: number;
  skip_after: number;
  coins: number;
  weight: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface BannerAdRow {
  id: string;
  anunciante: string;
  titulo: string;
  descricao: string | null;
  link: string | null;
  imagem_url: string | null;
  tipo: 'comercial' | 'evento';
  data_evento: string | null;
  local_evento: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  alcance: 'nacional' | 'estado' | 'cidade';
  estados: string[];
  cidades: string[];
  categoria: CategoriaEvento;
  ativo: boolean;
  impressoes: number;
  cliques: number;
  created_at: string;
}

// ─── Labels / ícones ──────────────────────────────────────────────────────────

const RESULT_LABEL: Record<string, string> = {
  invalid:    'Inválida (banco)',
  ai_invalid: 'Não reconhecida (IA)',
  unverified: 'Não verificada',
};
const RESULT_ICON: Record<string, string> = {
  invalid: '❌', ai_invalid: '🤖', unverified: '⏳',
};
const STATUS_COLOR: Record<string, string> = {
  pending: C.gold, approved: C.green, rejected: C.red,
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada',
};
const STATUS_ICON: Record<string, string> = {
  pending: '⏳', approved: '✅', rejected: '❌',
};

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function AdminTab() {
  const theme = useTheme();
  const { user, profile } = useAuth();

  const [section, setSection] = useState<AdminSection>('contests');

  // ── Estado: Contestações ──────────────────────────────────────────────────
  const [filter,     setFilter]     = useState<FilterStatus>('pending');
  const [contests,   setContests]   = useState<Contest[]>([]);
  const [cLoading,   setCLoading]   = useState(false);
  const [cRefresh,   setCRefresh]   = useState(false);
  const [acting,     setActing]     = useState<string | null>(null);
  const [cError,     setCError]     = useState<string | null>(null);

  // ── Estado: Suporte ───────────────────────────────────────────────────────
  const [sfilt,      setSfilt]      = useState<SupportFilter>('unread');
  const [msgs,       setMsgs]       = useState<SupportMsg[]>([]);
  const [sLoading,   setSLoading]   = useState(false);
  const [sRefresh,   setSRefresh]   = useState(false);
  const [sError,     setSError]     = useState<string | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [replyText,  setReplyText]  = useState('');
  const [sending,    setSending]    = useState<string | null>(null);

  // ── Estado: Trilhas (busca de usuário + liberação manual) ────────────────
  const [uQuery,       setUQuery]       = useState('');
  const [uResults,     setUResults]     = useState<AdminUserResult[]>([]);
  const [uLoading,     setULoading]     = useState(false);
  const [uError,       setUError]       = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserResult | null>(null);
  const [userTrilhas,  setUserTrilhas]  = useState<Set<number>>(new Set());
  const [tLoading,     setTLoading]     = useState(false);
  const [toggling,     setToggling]     = useState<number | null>(null);

  // ── Estado: Notificações (geral/direta, imediata/agendada) ───────────────
  const [nMode,        setNMode]        = useState<NotifMode>('geral');
  const [nTitle,       setNTitle]       = useState('');
  const [nBody,        setNBody]        = useState('');
  const [nSchedule,    setNSchedule]    = useState<NotifSchedule>('now');
  const [nCustomDate,  setNCustomDate]  = useState('');
  const [nCustomTime,  setNCustomTime]  = useState('');
  const [nSending,     setNSending]     = useState(false);
  const [nQuery,       setNQuery]       = useState('');
  const [nResults,     setNResults]     = useState<AdminUserResult[]>([]);
  const [nSearching,   setNSearching]   = useState(false);
  const [nSelectedUser, setNSelectedUser] = useState<AdminUserResult | null>(null);

  // ── Estado: Anúncios (lista + formulário de criar/editar) ────────────────
  const [ads,         setAds]         = useState<AdRow[]>([]);
  const [adsLoading,  setAdsLoading]  = useState(false);
  const [adsRefresh,  setAdsRefresh]  = useState(false);
  const [adsError,    setAdsError]    = useState<string | null>(null);
  const [adToggling,  setAdToggling]  = useState<string | null>(null);
  const [adDeleting,  setAdDeleting]  = useState<string | null>(null);

  const [adModalVisible, setAdModalVisible] = useState(false);
  const [adEditingId,    setAdEditingId]    = useState<string | null>(null);
  const [adSaving,       setAdSaving]       = useState(false);
  const [aUploadingMedia,    setAUploadingMedia]    = useState(false);
  const [aUploadingThumb,    setAUploadingThumb]    = useState(false);
  const [aUploadingCarousel, setAUploadingCarousel] = useState(false);

  const [aTitle,       setATitle]       = useState('');
  const [aDescription, setADescription] = useState('');
  const [aMediaType,   setAMediaType]   = useState<'image' | 'video'>('image');
  const [aMediaUrl,    setAMediaUrl]    = useState('');
  const [aMediaUrls,   setAMediaUrls]   = useState('');
  const [aThumbUrl,    setAThumbUrl]    = useState('');
  const [aCtaText,     setACtaText]     = useState('Saiba Mais');
  const [aCtaUrl,      setACtaUrl]      = useState('');
  const [aDuration,    setADuration]    = useState('15');
  const [aSkipAfter,   setASkipAfter]   = useState('5');
  const [aCoins,       setACoins]       = useState('15');
  const [aWeight,      setAWeight]      = useState('1');
  const [aActive,      setAActive]      = useState(true);
  const [aStartDate,   setAStartDate]   = useState('');
  const [aStartTime,   setAStartTime]   = useState('');
  const [aEndDate,     setAEndDate]     = useState('');
  const [aEndTime,     setAEndTime]     = useState('');

  // ── Estado: Banners do feed (lista + formulário de criar/editar) ──────────
  const [banners,        setBanners]        = useState<BannerAdRow[]>([]);
  const [bannersLoading, setBannersLoading]  = useState(false);
  const [bannersRefresh, setBannersRefresh]  = useState(false);
  const [bannersError,   setBannersError]    = useState<string | null>(null);
  const [bannerToggling, setBannerToggling]  = useState<string | null>(null);
  const [bannerDeleting, setBannerDeleting]  = useState<string | null>(null);

  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [bannerEditingId,    setBannerEditingId]    = useState<string | null>(null);
  const [bannerSaving,       setBannerSaving]       = useState(false);

  const [bAnunciante, setBAnunciante] = useState('');
  const [bTitulo,     setBTitulo]     = useState('');
  const [bDescricao,  setBDescricao]  = useState('');
  const [bLink,       setBLink]       = useState('');
  const [bImagemUrl,  setBImagemUrl]  = useState('');
  const [bAtivo,      setBAtivo]      = useState(true);
  // Imagem escolhida na galeria mas ainda não enviada — só sobe pro storage ao salvar,
  // pra não acumular imagem órfã no bucket quando o admin escolhe e desiste de cadastrar.
  const [bImagemPendingAsset, setBImagemPendingAsset] = useState<PickedAsset | null>(null);
  const [bPickingImagem, setBPickingImagem] = useState(false);
  const [bSuggestingDesc, setBSuggestingDesc] = useState(false);
  const [bTipo,          setBTipo]          = useState<'comercial' | 'evento'>('comercial');
  const [bCategoria,     setBCategoria]     = useState<CategoriaEvento>('outro');
  const [bDataEvento,    setBDataEvento]    = useState<string | null>(null);
  const [bLocalEvento,   setBLocalEvento]   = useState('');
  const [bAlcance, setBAlcance] = useState<'nacional' | 'estado' | 'cidade'>('nacional');
  const [bEstados, setBEstados] = useState(''); // texto separado por vírgula, ex.: "SP, RJ"
  const [bCidades, setBCidades] = useState('');
  const [bPeriodoInicio, setBPeriodoInicio] = useState<string | null>(null);
  const [bPeriodoFim,    setBPeriodoFim]    = useState<string | null>(null);

  // ── Estado: Eventos patrocinados (fila de aprovação) ──────────────────────
  const [eventosSub,         setEventosSub]         = useState<EventosSub>('pendentes');
  const [eventosPendentes,   setEventosPendentes]   = useState<EventoPatrocinado[]>([]);
  const [eventosHistorico,   setEventosHistorico]   = useState<EventoPatrocinado[]>([]);
  const [eventosLoading,     setEventosLoading]     = useState(false);
  const [eventosRefresh,     setEventosRefresh]     = useState(false);
  const [eventosError,       setEventosError]       = useState<string | null>(null);
  const [eventoActing,       setEventoActing]       = useState<string | null>(null);
  const [rejeitarModalVisible, setRejeitarModalVisible] = useState(false);
  const [rejeitarAlvo,       setRejeitarAlvo]       = useState<EventoPatrocinado | null>(null);
  const [motivoRejeicao,     setMotivoRejeicao]     = useState('');
  const [rejeitando,         setRejeitando]         = useState(false);

  // ── Estado: Configurações do app (banner/eventos ligado/desligado) ────────
  const [configBannerAtivo, setConfigBannerAtivo] = useState(true);
  const [configEventosAtivo, setConfigEventosAtivo] = useState(true);
  const [configLoading,     setConfigLoading]     = useState(false);
  const [configSaving,      setConfigSaving]      = useState(false);
  const [configEventosSaving, setConfigEventosSaving] = useState(false);

  // ── Fetch: Contestações ───────────────────────────────────────────────────
  const fetchContests = useCallback(async (silent = false) => {
    if (!profile?.is_admin) return;
    if (!silent) setCLoading(true);
    setCError(null);
    const { data, error } = await supabase
      .from('stop_contests')
      .select('*, profiles!user_id(name, avatar_emoji)')
      .eq('status', filter)
      .order('created_at', { ascending: filter === 'pending' })
      .limit(50);
    if (error) setCError(error.message);
    else setContests((data ?? []) as Contest[]);
    setCLoading(false);
    setCRefresh(false);
  }, [filter, profile?.is_admin]);

  // ── Fetch: Suporte ────────────────────────────────────────────────────────
  const fetchSupport = useCallback(async (silent = false) => {
    if (!profile?.is_admin) return;
    if (!silent) setSLoading(true);
    setSError(null);
    let q = supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);
    if (sfilt === 'unread') q = q.eq('read', false);
    const { data, error } = await q;
    if (error) setSError(error.message);
    else setMsgs((data ?? []) as SupportMsg[]);
    setSLoading(false);
    setSRefresh(false);
  }, [sfilt, profile?.is_admin]);

  // ── Fetch: Anúncios ───────────────────────────────────────────────────────
  const fetchAds = useCallback(async (silent = false) => {
    if (!profile?.is_admin) return;
    if (!silent) setAdsLoading(true);
    setAdsError(null);
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) setAdsError(error.message);
    else setAds((data ?? []) as AdRow[]);
    setAdsLoading(false);
    setAdsRefresh(false);
  }, [profile?.is_admin]);

  // ── Fetch: Banners do feed ────────────────────────────────────────────────
  const fetchBanners = useCallback(async (silent = false) => {
    if (!profile?.is_admin) return;
    if (!silent) setBannersLoading(true);
    setBannersError(null);
    const { data, error } = await supabase
      .from('banner_ads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) setBannersError(error.message);
    else setBanners((data ?? []) as BannerAdRow[]);
    setBannersLoading(false);
    setBannersRefresh(false);
  }, [profile?.is_admin]);

  // ── Fetch: Configurações ──────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    if (!profile?.is_admin) return;
    setConfigLoading(true);
    const [{ data: banner }, { data: eventos }] = await Promise.all([
      supabase.from('app_config').select('value').eq('key', 'banner_ativo').maybeSingle(),
      supabase.from('app_config').select('value').eq('key', 'eventos_patrocinados_ativo').maybeSingle(),
    ]);
    setConfigBannerAtivo(banner?.value !== 'false');
    setConfigEventosAtivo(eventos?.value !== 'false');
    setConfigLoading(false);
  }, [profile?.is_admin]);

  // ── Fetch: Eventos patrocinados ───────────────────────────────────────────
  const fetchEventos = useCallback(async (silent = false) => {
    if (!profile?.is_admin) return;
    if (!silent) setEventosLoading(true);
    setEventosError(null);
    if (eventosSub === 'pendentes') {
      const { data, error } = await supabase
        .from('eventos_patrocinados')
        .select('*')
        .eq('status', 'aguardando_aprovacao')
        .order('criado_em', { ascending: true });
      if (error) setEventosError(error.message);
      else setEventosPendentes((data ?? []) as EventoPatrocinado[]);
    } else {
      const { data, error } = await supabase
        .from('eventos_patrocinados')
        .select('*')
        .in('status', ['aprovado', 'ativo', 'rejeitado', 'encerrado'])
        .order('criado_em', { ascending: false })
        .limit(100);
      if (error) setEventosError(error.message);
      else setEventosHistorico((data ?? []) as EventoPatrocinado[]);
    }
    setEventosLoading(false);
    setEventosRefresh(false);
  }, [eventosSub, profile?.is_admin]);

  // Recarrega ao focar a aba
  useFocusEffect(useCallback(() => {
    if (section === 'contests') fetchContests();
    else if (section === 'support') fetchSupport();
    else if (section === 'ads') fetchAds();
    else if (section === 'banners') fetchBanners();
    else if (section === 'eventos') fetchEventos();
    else if (section === 'config') fetchConfig();
  }, [section, fetchContests, fetchSupport, fetchAds, fetchBanners, fetchEventos, fetchConfig]));

  // ── Ações: Contestações ───────────────────────────────────────────────────
  const handleApprove = useCallback(async (c: Contest) => {
    Alert.alert(
      'Aprovar contestação?',
      `"${c.answer}" em ${c.category_key.toUpperCase()} (letra ${c.letter}) — o jogador receberá 10 pts.`,
      [{ text: 'Cancelar', style: 'cancel' }, {
        text: 'Aprovar',
        onPress: async () => {
          setActing(c.id);
          try {
            await supabase.from('stop_contests')
              .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
              .eq('id', c.id);
            await supabase.rpc('add_coins', { p_user_id: c.user_id, p_amount: 10, p_motivo: 'stop_contest_approved' });

            // Adiciona a palavra ao banco do Stop
            const word = c.answer.trim();
            const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
            await supabase.from('stop_word_bank').upsert(
              { category: c.category_key, letter: c.letter.toUpperCase(), word: capitalizedWord },
              { onConflict: 'category,letter,word', ignoreDuplicates: true },
            );

            try {
              await supabase.from('notifications').insert({
                user_id: c.user_id,
                title: '✅ Contestação aprovada!',
                body: `Sua palavra "${c.answer}" (${c.letter} — ${c.category_key}) foi aprovada e adicionada ao banco. +10 🪙`,
              });
            } catch { /* best-effort */ }
            setContests(prev => prev.filter(x => x.id !== c.id));
          } catch { Alert.alert('Erro', 'Não foi possível processar. Tente novamente.'); }
          finally { setActing(null); }
        },
      }],
    );
  }, [user]);

  const handleReject = useCallback(async (c: Contest) => {
    Alert.alert(
      'Rejeitar contestação?',
      `"${c.answer}" permanecerá inválida. Nenhum ponto será concedido.`,
      [{ text: 'Cancelar', style: 'cancel' }, {
        text: 'Rejeitar', style: 'destructive',
        onPress: async () => {
          setActing(c.id);
          try {
            await supabase.from('stop_contests')
              .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
              .eq('id', c.id);
            try {
              await supabase.from('notifications').insert({
                user_id: c.user_id,
                title: '❌ Contestação rejeitada',
                body: `Sua palavra "${c.answer}" (${c.letter} — ${c.category_key}) não foi aceita desta vez.`,
              });
            } catch { /* best-effort */ }
            setContests(prev => prev.filter(x => x.id !== c.id));
          } catch { Alert.alert('Erro', 'Não foi possível processar. Tente novamente.'); }
          finally { setActing(null); }
        },
      }],
    );
  }, [user]);

  // ── Ações: Suporte ────────────────────────────────────────────────────────
  const handleSendReply = useCallback(async (msg: SupportMsg) => {
    const text = replyText.trim();
    if (!text) return;
    setSending(msg.id);
    try {
      await supabase.from('support_messages').update({
        reply: text,
        replied_at: new Date().toISOString(),
        replied_by: user!.id,
        read: true,
      }).eq('id', msg.id);

      // Notifica o usuário no app (se tiver conta)
      if (msg.user_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: msg.user_id,
            title: '💬 Resposta do suporte',
            body: text.length > 100 ? text.slice(0, 97) + '…' : text,
          });
        } catch { /* best-effort */ }
      }

      setMsgs(prev => prev.map(m =>
        m.id === msg.id ? { ...m, read: true, reply: text, replied_at: new Date().toISOString() } : m,
      ));
      setExpanded(null);
      setReplyText('');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a resposta.');
    } finally {
      setSending(null);
    }
  }, [user, replyText]);

  const handleMarkRead = useCallback(async (id: string) => {
    await supabase.from('support_messages').update({ read: true }).eq('id', id);
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }, []);

  const handleDeleteMsg = useCallback((id: string) => {
    Alert.alert(
      'Excluir mensagem?',
      'A mensagem será removida permanentemente do banco de dados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('support_messages').delete().eq('id', id);
            if (error) {
              Alert.alert('Erro', 'Não foi possível excluir a mensagem.');
            } else {
              setMsgs(prev => prev.filter(m => m.id !== id));
            }
          },
        },
      ],
    );
  }, []);

  // ── Ações: Trilhas ────────────────────────────────────────────────────────
  const handleSearchUsers = useCallback(async () => {
    const q = uQuery.trim();
    if (!q) return;
    setULoading(true);
    setUError(null);
    const { data, error } = await searchUsers(q);
    if (error) setUError(error);
    setUResults(data);
    setULoading(false);
  }, [uQuery]);

  const handleSelectUser = useCallback(async (u: AdminUserResult) => {
    setSelectedUser(u);
    setUserTrilhas(new Set());
    setTLoading(true);
    const { trilhaIds, error } = await listUserTrilhas(u.id);
    if (error) Alert.alert('Erro', error);
    setUserTrilhas(trilhaIds);
    setTLoading(false);
  }, []);

  const handleBackToSearch = useCallback(() => {
    setSelectedUser(null);
    setUserTrilhas(new Set());
  }, []);

  const handleToggleTrilha = useCallback(async (trilhaId: number, currentlyUnlocked: boolean) => {
    if (!selectedUser) return;
    setToggling(trilhaId);
    const { ok, error } = currentlyUnlocked
      ? await revokeTrilha(selectedUser.id, trilhaId)
      : await unlockTrilha(selectedUser.id, trilhaId);
    if (ok) {
      setUserTrilhas(prev => {
        const next = new Set(prev);
        if (currentlyUnlocked) next.delete(trilhaId); else next.add(trilhaId);
        return next;
      });
    } else {
      Alert.alert('Erro', error ?? 'Não foi possível atualizar.');
    }
    setToggling(null);
  }, [selectedUser]);

  // ── Ações: Notificações ───────────────────────────────────────────────────
  const handleSearchNUsers = useCallback(async () => {
    const q = nQuery.trim();
    if (!q) return;
    setNSearching(true);
    const { data, error } = await searchUsers(q);
    if (error) Alert.alert('Erro', error);
    setNResults(data);
    setNSearching(false);
  }, [nQuery]);

  function computeScheduledAt(): Date | null {
    const now = new Date();
    if (nSchedule === 'now') return now;
    if (nSchedule === '1h') return new Date(now.getTime() + 60 * 60 * 1000);
    if (nSchedule === 'tomorrow9') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    }
    const [dd, mm, yyyy] = nCustomDate.split('/').map(Number);
    const [hh, min] = nCustomTime.split(':').map(Number);
    if (!dd || !mm || !yyyy || Number.isNaN(hh) || Number.isNaN(min)) return null;
    const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const handleSendNotification = useCallback(async () => {
    const title = nTitle.trim();
    const body  = nBody.trim();
    if (!title || !body) {
      Alert.alert('Preencha tudo', 'Título e mensagem são obrigatórios.');
      return;
    }
    if (nMode === 'direto' && !nSelectedUser) {
      Alert.alert('Selecione um usuário', 'Busque e selecione o destinatário.');
      return;
    }
    const scheduledAt = computeScheduledAt();
    if (!scheduledAt) {
      Alert.alert('Data inválida', 'Confira o formato: DD/MM/AAAA e HH:MM.');
      return;
    }

    const destino = nMode === 'geral' ? 'TODOS os usuários' : nSelectedUser!.name;
    const quando  = nSchedule === 'now' ? 'Envio imediato' : `Agendado para ${scheduledAt.toLocaleString('pt-BR')}`;

    Alert.alert(
      nSchedule === 'now' ? 'Enviar agora?' : 'Agendar notificação?',
      `Para: ${destino}\n"${title}"\n${quando}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: nSchedule === 'now' ? 'Enviar' : 'Agendar',
          onPress: async () => {
            setNSending(true);
            const result = nMode === 'geral'
              ? await broadcastNotification(title, body, scheduledAt)
              : await sendNotificationToUser(nSelectedUser!.id, title, body, scheduledAt);

            if (result.ok) {
              if (nSchedule === 'now') triggerDispatchNow();
              Alert.alert(
                'Pronto!',
                nMode === 'geral'
                  ? `Notificação registrada para ${result.count ?? 0} usuários.`
                  : 'Notificação registrada com sucesso.',
              );
              setNTitle('');
              setNBody('');
              setNSelectedUser(null);
              setNQuery('');
              setNResults([]);
              setNCustomDate('');
              setNCustomTime('');
            } else {
              Alert.alert('Erro', result.error ?? 'Não foi possível processar.');
            }
            setNSending(false);
          },
        },
      ],
    );
  }, [nMode, nTitle, nBody, nSchedule, nCustomDate, nCustomTime, nSelectedUser]);

  // ── Ações: Anúncios ───────────────────────────────────────────────────────
  const handleOpenCreateAd = useCallback(() => {
    setAdEditingId(null);
    setATitle(''); setADescription(''); setAMediaType('image'); setAMediaUrl('');
    setAMediaUrls(''); setAThumbUrl(''); setACtaText('Saiba Mais'); setACtaUrl('');
    setADuration('15'); setASkipAfter('5'); setACoins('15'); setAWeight('1');
    setAActive(true); setAStartDate(''); setAStartTime(''); setAEndDate(''); setAEndTime('');
    setAdModalVisible(true);
  }, []);

  const handleOpenEditAd = useCallback((ad: AdRow) => {
    setAdEditingId(ad.id);
    setATitle(ad.title);
    setADescription(ad.description ?? '');
    setAMediaType(ad.media_type);
    setAMediaUrl(ad.media_url);
    setAMediaUrls((ad.media_urls ?? []).join('\n'));
    setAThumbUrl(ad.thumb_url ?? '');
    setACtaText(ad.cta_text);
    setACtaUrl(ad.cta_url ?? '');
    setADuration(String(ad.duration));
    setASkipAfter(String(ad.skip_after));
    setACoins(String(ad.coins));
    setAWeight(String(ad.weight));
    setAActive(ad.active);
    setAStartDate(ad.start_date ? isoToDatePart(ad.start_date) : '');
    setAStartTime(ad.start_date ? isoToTimePart(ad.start_date) : '');
    setAEndDate(ad.end_date ? isoToDatePart(ad.end_date) : '');
    setAEndTime(ad.end_date ? isoToTimePart(ad.end_date) : '');
    setAdModalVisible(true);
  }, []);

  const handlePickMediaImage = useCallback(async () => {
    setAUploadingMedia(true);
    try {
      const urls = await pickAndUploadAdImages({ multiple: false });
      if (urls[0]) setAMediaUrl(urls[0]);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      setAUploadingMedia(false);
    }
  }, []);

  const handlePickThumbImage = useCallback(async () => {
    setAUploadingThumb(true);
    try {
      const urls = await pickAndUploadAdImages({ multiple: false });
      if (urls[0]) setAThumbUrl(urls[0]);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      setAUploadingThumb(false);
    }
  }, []);

  const handlePickCarouselImages = useCallback(async () => {
    const already   = aMediaUrls.split('\n').map(u => u.trim()).filter(Boolean).length;
    const remaining = Math.max(0, 6 - already);
    if (remaining === 0) {
      Alert.alert('Limite atingido', 'O carrossel aceita no máximo 6 imagens.');
      return;
    }
    setAUploadingCarousel(true);
    try {
      const urls = await pickAndUploadAdImages({ multiple: true, limit: remaining });
      if (urls.length) {
        const existing = aMediaUrls.split('\n').map(u => u.trim()).filter(Boolean);
        setAMediaUrls([...existing, ...urls].slice(0, 6).join('\n'));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar as imagens. Tente novamente.');
    } finally {
      setAUploadingCarousel(false);
    }
  }, [aMediaUrls]);

  const handleSaveAd = useCallback(async () => {
    const title    = aTitle.trim();
    const mediaUrl = aMediaUrl.trim();
    if (!title || !mediaUrl) {
      Alert.alert('Preencha tudo', 'Título e URL da mídia principal são obrigatórios.');
      return;
    }

    const duration  = parseInt(aDuration, 10);
    const skipAfter = parseInt(aSkipAfter, 10);
    const coins     = parseInt(aCoins, 10);
    const weight    = parseInt(aWeight, 10);
    if (!duration || Number.isNaN(skipAfter) || !coins || !weight) {
      Alert.alert('Valores inválidos', 'Confira duração, pular após, moedas e peso — todos numéricos.');
      return;
    }

    const start = parseOptionalDateTime(aStartDate, aStartTime);
    const end   = parseOptionalDateTime(aEndDate, aEndTime);
    if (!start.ok || !end.ok) {
      Alert.alert('Data inválida', 'Confira o formato do período: DD/MM/AAAA e HH:MM.');
      return;
    }
    if (start.value && end.value && new Date(start.value) >= new Date(end.value)) {
      Alert.alert('Período inválido', 'A data/hora de término deve ser depois da de início.');
      return;
    }

    const mediaUrls = aMediaUrls.split('\n').map(u => u.trim()).filter(Boolean).slice(0, 6);

    const payload = {
      title,
      description:  aDescription.trim() || null,
      media_type:   aMediaType,
      media_url:    mediaUrl,
      media_urls:   mediaUrls.length ? mediaUrls : null,
      thumb_url:    aThumbUrl.trim() || null,
      cta_text:     aCtaText.trim() || 'Saiba Mais',
      cta_url:      aCtaUrl.trim() || null,
      duration,
      skip_after:   skipAfter,
      coins,
      weight,
      active:       aActive,
      start_date:   start.value,
      end_date:     end.value,
    };

    setAdSaving(true);
    const { error } = adEditingId
      ? await supabase.from('ads').update(payload).eq('id', adEditingId)
      : await supabase.from('ads').insert(payload);
    setAdSaving(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar o anúncio.');
      return;
    }
    setAdModalVisible(false);
    fetchAds(true);
  }, [aTitle, aDescription, aMediaType, aMediaUrl, aMediaUrls, aThumbUrl, aCtaText, aCtaUrl,
      aDuration, aSkipAfter, aCoins, aWeight, aActive, aStartDate, aStartTime, aEndDate, aEndTime,
      adEditingId, fetchAds]);

  const handleToggleAdActive = useCallback(async (ad: AdRow) => {
    setAdToggling(ad.id);
    const { error } = await supabase.from('ads').update({ active: !ad.active }).eq('id', ad.id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar.');
    } else {
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
    }
    setAdToggling(null);
  }, []);

  const handleDeleteAd = useCallback((ad: AdRow) => {
    Alert.alert(
      'Excluir anúncio?',
      `"${ad.title}" será removido permanentemente do banco de dados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setAdDeleting(ad.id);
            const { error } = await supabase.from('ads').delete().eq('id', ad.id);
            setAdDeleting(null);
            if (error) Alert.alert('Erro', 'Não foi possível excluir o anúncio.');
            else setAds(prev => prev.filter(a => a.id !== ad.id));
          },
        },
      ],
    );
  }, []);

  // ── Ações: Banners do feed ────────────────────────────────────────────────
  // Só escolhe da galeria aqui — o upload real acontece em handleSaveBanner,
  // pra não subir imagem no storage se o admin desistir de cadastrar.
  const handlePickBannerImage = useCallback(async () => {
    setBPickingImagem(true);
    try {
      const [asset] = await pickAdImages({ multiple: false });
      if (asset) setBImagemPendingAsset(asset);
    } finally {
      setBPickingImagem(false);
    }
  }, []);

  const handleSuggestBannerDescricao = useCallback(async () => {
    const anunciante = bAnunciante.trim();
    if (!anunciante) {
      Alert.alert('Preencha o anunciante', 'Informe o nome do anunciante antes de gerar a sugestão.');
      return;
    }
    setBSuggestingDesc(true);
    const sugestao = await suggestBannerDescription({
      anunciante,
      titulo: bTitulo.trim(),
      descricaoAtual: bDescricao.trim() || undefined,
    });
    setBSuggestingDesc(false);
    if (!sugestao) {
      Alert.alert('Erro', 'Não foi possível gerar uma sugestão agora. Tente novamente.');
      return;
    }
    setBDescricao(sugestao);
  }, [bAnunciante, bTitulo, bDescricao]);

  const handleOpenCreateBanner = useCallback(() => {
    setBannerEditingId(null);
    setBAnunciante(''); setBTitulo(''); setBDescricao(''); setBLink(''); setBImagemUrl('');
    setBImagemPendingAsset(null);
    setBAtivo(true);
    setBTipo('comercial'); setBCategoria('outro'); setBDataEvento(null); setBLocalEvento('');
    setBPeriodoInicio(todayISO()); setBPeriodoFim(null);
    setBAlcance('nacional'); setBEstados(''); setBCidades('');
    setBannerModalVisible(true);
  }, []);

  const handleOpenEditBanner = useCallback((b: BannerAdRow) => {
    setBannerEditingId(b.id);
    setBAnunciante(b.anunciante);
    setBTitulo(b.titulo);
    setBDescricao(b.descricao ?? '');
    setBLink(b.link ?? '');
    setBImagemUrl(b.imagem_url ?? '');
    setBImagemPendingAsset(null);
    setBAtivo(b.ativo);
    setBTipo(b.tipo ?? 'comercial');
    setBCategoria(b.categoria ?? 'outro');
    setBDataEvento(b.data_evento ?? null);
    setBLocalEvento(b.local_evento ?? '');
    setBPeriodoInicio(b.periodo_inicio ?? null);
    setBPeriodoFim(b.periodo_fim ?? null);
    setBAlcance(b.alcance ?? 'nacional');
    setBEstados((b.estados ?? []).join(', '));
    setBCidades((b.cidades ?? []).join(', '));
    setBannerModalVisible(true);
  }, []);

  const handleSaveBanner = useCallback(async () => {
    const anunciante = bAnunciante.trim();
    const titulo     = bTitulo.trim();
    if (!anunciante || !titulo) {
      Alert.alert('Preencha tudo', 'Anunciante e título são obrigatórios.');
      return;
    }
    if (bTipo === 'evento' && (!bDataEvento || !bLocalEvento.trim() || !bPeriodoInicio || !bPeriodoFim)) {
      Alert.alert('Preencha tudo', 'Data, local e período de exibição são obrigatórios para eventos.');
      return;
    }
    if (bPeriodoInicio && bPeriodoFim && bPeriodoInicio > bPeriodoFim) {
      Alert.alert('Período inválido', 'A data final do período precisa ser depois da inicial.');
      return;
    }
    const estadosList = parseListaCsv(bEstados);
    const cidadesList = parseListaCsv(bCidades);
    if (bAlcance === 'estado' && estadosList.length === 0) {
      Alert.alert('Preencha o alcance', 'Informe ao menos um estado (ex.: SP, RJ).');
      return;
    }
    if (bAlcance === 'cidade' && cidadesList.length === 0) {
      Alert.alert('Preencha o alcance', 'Informe ao menos uma cidade.');
      return;
    }

    setBannerSaving(true);

    // Só sobe a imagem pro storage agora que o cadastro foi confirmado
    let imagemUrl = bImagemUrl.trim() || null;
    if (bImagemPendingAsset) {
      try {
        imagemUrl = await uploadAdImage(bImagemPendingAsset);
      } catch {
        setBannerSaving(false);
        Alert.alert('Erro', 'Não foi possível enviar a imagem. Tente novamente.');
        return;
      }
    }

    const payload = {
      anunciante,
      titulo,
      descricao:      bDescricao.trim() || null,
      link:           bLink.trim() || null,
      imagem_url:     imagemUrl,
      ativo:          bAtivo,
      tipo:           bTipo,
      categoria:      bTipo === 'evento' ? bCategoria : 'outro',
      data_evento:    bTipo === 'evento' ? bDataEvento : null,
      local_evento:   bTipo === 'evento' ? bLocalEvento.trim() : null,
      periodo_inicio: bPeriodoInicio,
      periodo_fim:    bPeriodoFim,
      alcance:        bAlcance,
      estados:        bAlcance === 'estado' ? estadosList : [],
      cidades:        bAlcance === 'cidade' ? cidadesList : [],
    };

    const { error } = bannerEditingId
      ? await supabase.from('banner_ads').update(payload).eq('id', bannerEditingId)
      : await supabase.from('banner_ads').insert(payload);
    setBannerSaving(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar o anúncio.');
      return;
    }
    setBannerModalVisible(false);
    fetchBanners(true);
  }, [bAnunciante, bTitulo, bDescricao, bLink, bImagemUrl, bImagemPendingAsset, bAtivo, bTipo, bCategoria, bDataEvento, bLocalEvento, bPeriodoInicio, bPeriodoFim, bAlcance, bEstados, bCidades, bannerEditingId, fetchBanners]);

  const handleToggleBannerActive = useCallback(async (b: BannerAdRow) => {
    setBannerToggling(b.id);
    const { error } = await supabase.from('banner_ads').update({ ativo: !b.ativo }).eq('id', b.id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar.');
    } else {
      setBanners(prev => prev.map(x => x.id === b.id ? { ...x, ativo: !x.ativo } : x));
    }
    setBannerToggling(null);
  }, []);

  const handleDeleteBanner = useCallback((b: BannerAdRow) => {
    Alert.alert(
      'Excluir anúncio?',
      `"${b.titulo}" será removido permanentemente do banco de dados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setBannerDeleting(b.id);
            const { error } = await supabase.from('banner_ads').delete().eq('id', b.id);
            setBannerDeleting(null);
            if (error) Alert.alert('Erro', 'Não foi possível excluir o anúncio.');
            else setBanners(prev => prev.filter(x => x.id !== b.id));
          },
        },
      ],
    );
  }, []);

  // ── Ações: Eventos patrocinados ───────────────────────────────────────────
  const handleAprovarEvento = useCallback((evento: EventoPatrocinado) => {
    Alert.alert(
      'Aprovar evento?',
      `"${evento.titulo}" entra no ar por ${evento.periodo} dias.`,
      [{ text: 'Cancelar', style: 'cancel' }, {
        text: 'Aprovar',
        onPress: async () => {
          setEventoActing(evento.id);
          const inicio = todayISO();
          const fimDate = new Date();
          fimDate.setDate(fimDate.getDate() + evento.periodo);
          const fim = `${fimDate.getFullYear()}-${String(fimDate.getMonth() + 1).padStart(2, '0')}-${String(fimDate.getDate()).padStart(2, '0')}`;

          const { error } = await supabase.from('eventos_patrocinados').update({
            status:          'aprovado',
            aprovado_por:    user!.id,
            aprovado_em:     new Date().toISOString(),
            exibicao_inicio: inicio,
            exibicao_fim:    fim,
          }).eq('id', evento.id);

          if (!error) {
            notificarUsuario(
              evento.usuario_id,
              '🎉 Evento aprovado!',
              `Seu evento "${evento.titulo}" foi aprovado e já está no ar!`,
            ).catch(() => {});
            setEventosPendentes(prev => prev.filter(e => e.id !== evento.id));
          } else {
            Alert.alert('Erro', 'Não foi possível aprovar. Tente novamente.');
          }
          setEventoActing(null);
        },
      }],
    );
  }, [user]);

  const handleAbrirRejeitar = useCallback((evento: EventoPatrocinado) => {
    setRejeitarAlvo(evento);
    setMotivoRejeicao('');
    setRejeitarModalVisible(true);
  }, []);

  const handleConfirmarRejeitar = useCallback(async () => {
    const motivo = motivoRejeicao.trim();
    if (!motivo || !rejeitarAlvo) {
      Alert.alert('Informe o motivo', 'O motivo da rejeição é obrigatório.');
      return;
    }
    setRejeitando(true);
    const { data, error } = await supabase.functions.invoke('reembolsar-evento', {
      body: { evento_id: rejeitarAlvo.id, motivo },
    });
    setRejeitando(false);
    if (error || data?.error) {
      Alert.alert('Erro', 'Não foi possível rejeitar/reembolsar o evento. Tente novamente.');
      return;
    }
    setEventosPendentes(prev => prev.filter(e => e.id !== rejeitarAlvo.id));
    setRejeitarModalVisible(false);
  }, [motivoRejeicao, rejeitarAlvo]);

  // ── Ações: Configurações ──────────────────────────────────────────────────
  const handleToggleConfigBannerAtivo = useCallback(async (value: boolean) => {
    setConfigSaving(true);
    setConfigBannerAtivo(value);
    const { error } = await supabase
      .from('app_config')
      .update({ value: value ? 'true' : 'false', updated_at: new Date().toISOString() })
      .eq('key', 'banner_ativo');
    if (error) {
      setConfigBannerAtivo(!value);
      Alert.alert('Erro', 'Não foi possível atualizar a configuração.');
    }
    setConfigSaving(false);
  }, []);

  const handleToggleConfigEventosAtivo = useCallback(async (value: boolean) => {
    setConfigEventosSaving(true);
    setConfigEventosAtivo(value);
    const { error } = await supabase
      .from('app_config')
      .update({ value: value ? 'true' : 'false', updated_at: new Date().toISOString() })
      .eq('key', 'eventos_patrocinados_ativo');
    if (error) {
      setConfigEventosAtivo(!value);
      Alert.alert('Erro', 'Não foi possível atualizar a configuração.');
    }
    setConfigEventosSaving(false);
  }, []);

  function getAdStatus(ad: AdRow): { label: string; color: string } {
    if (!ad.active) return { label: 'Desativado', color: theme.textSecondary };
    const now = Date.now();
    if (ad.start_date && new Date(ad.start_date).getTime() > now) {
      return { label: `Agendado p/ ${new Date(ad.start_date).toLocaleDateString('pt-BR')}`, color: C.gold };
    }
    if (ad.end_date && new Date(ad.end_date).getTime() < now) {
      return { label: 'Expirado', color: C.red };
    }
    return { label: 'No ar', color: C.green };
  }

  // ── Gate ──────────────────────────────────────────────────────────────────
  if (!profile?.is_admin) {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 48, lineHeight: 56 }}>🔒</ThemedText>
            <ThemedText type="subtitle" style={s.center}>Acesso restrito</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={s.fill}>
      <Modal
        visible={adModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAdModalVisible(false)}>
        <ThemedView style={s.fill}>
          <SafeAreaView style={s.fill} edges={['top']}>
            <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={[s.header, { borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <ThemedText style={s.headerTitle}>{adEditingId ? 'Editar anúncio' : 'Novo anúncio'}</ThemedText>
                <TouchableOpacity onPress={() => setAdModalVisible(false)} hitSlop={8} activeOpacity={0.7}>
                  <ThemedText style={{ fontSize: 18, fontWeight: '700', color: theme.textSecondary }}>✕</ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <ThemedText style={s.sectionLabel}>CONTEÚDO</ThemedText>
                <ThemedView type="backgroundElement" style={s.card}>
                  <TextInput
                    style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={aTitle}
                    onChangeText={setATitle}
                    placeholder="Título"
                    placeholderTextColor={theme.textSecondary}
                    maxLength={80}
                  />
                  <TextInput
                    style={[s.replyInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={aDescription}
                    onChangeText={setADescription}
                    placeholder="Descrição (opcional)"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />

                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TouchableOpacity
                      style={[s.modeBtn, aMediaType === 'image' && s.modeBtnActive]}
                      onPress={() => setAMediaType('image')}
                      activeOpacity={0.8}>
                      <ThemedText style={[s.modeBtnText, aMediaType === 'image' && s.modeBtnTextActive]}>🖼️ Imagem</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.modeBtn, aMediaType === 'video' && s.modeBtnActive]}
                      onPress={() => setAMediaType('video')}
                      activeOpacity={0.8}>
                      <ThemedText style={[s.modeBtnText, aMediaType === 'video' && s.modeBtnTextActive]}>🎬 Vídeo</ThemedText>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                    {aMediaUrl ? <Image source={{ uri: aMediaUrl }} style={s.adThumb} /> : null}
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aMediaUrl}
                      onChangeText={setAMediaUrl}
                      placeholder="URL da mídia principal (obrigatório)"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                  {aMediaType === 'image' ? (
                    <TouchableOpacity
                      style={s.galleryBtn}
                      onPress={handlePickMediaImage}
                      disabled={aUploadingMedia}
                      activeOpacity={0.8}>
                      {aUploadingMedia
                        ? <ActivityIndicator size="small" color={C.purple} />
                        : <ThemedText style={s.galleryBtnText}>📁 Escolher 1 foto da galeria</ThemedText>}
                    </TouchableOpacity>
                  ) : (
                    <ThemedText themeColor="textSecondary" style={s.fieldHint}>
                      Vídeo: cole o link do arquivo já hospedado (upload de vídeo não é feito por aqui).
                    </ThemedText>
                  )}

                  <ThemedText themeColor="textSecondary" style={[s.fieldHint, { marginTop: Spacing.one }]}>
                    Carrossel (opcional): se tiver mais de 1 foto, o anúncio vira uma galeria deslizável — até 6 imagens.
                  </ThemedText>
                  <TextInput
                    style={[s.replyInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={aMediaUrls}
                    onChangeText={setAMediaUrls}
                    placeholder={'URLs do carrossel — uma por linha, até 6 (opcional)'}
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={s.galleryBtn}
                    onPress={handlePickCarouselImages}
                    disabled={aUploadingCarousel}
                    activeOpacity={0.8}>
                    {aUploadingCarousel
                      ? <ActivityIndicator size="small" color={C.purple} />
                      : <ThemedText style={s.galleryBtnText}>📁 Escolher várias fotos da galeria</ThemedText>}
                  </TouchableOpacity>

                  <ThemedText themeColor="textSecondary" style={[s.fieldHint, { marginTop: Spacing.one }]}>
                    Miniatura (opcional): capa mostrada enquanto a mídia principal carrega — mais usada em vídeo.
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                    {aThumbUrl ? <Image source={{ uri: aThumbUrl }} style={s.adThumb} /> : null}
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aThumbUrl}
                      onChangeText={setAThumbUrl}
                      placeholder="URL da miniatura (opcional)"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                  <TouchableOpacity
                    style={s.galleryBtn}
                    onPress={handlePickThumbImage}
                    disabled={aUploadingThumb}
                    activeOpacity={0.8}>
                    {aUploadingThumb
                      ? <ActivityIndicator size="small" color={C.purple} />
                      : <ThemedText style={s.galleryBtnText}>📁 Escolher 1 foto da galeria</ThemedText>}
                  </TouchableOpacity>
                </ThemedView>

                <ThemedText style={s.sectionLabel}>BOTÃO DE AÇÃO</ThemedText>
                <ThemedView type="backgroundElement" style={s.card}>
                  <TextInput
                    style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={aCtaText}
                    onChangeText={setACtaText}
                    placeholder="Texto do botão"
                    placeholderTextColor={theme.textSecondary}
                    maxLength={30}
                  />
                  <TextInput
                    style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={aCtaUrl}
                    onChangeText={setACtaUrl}
                    placeholder="Link do botão (opcional)"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </ThemedView>

                <ThemedText style={s.sectionLabel}>COMPORTAMENTO</ThemedText>
                <ThemedView type="backgroundElement" style={s.card}>
                  <ThemedText themeColor="textSecondary" style={s.fieldHint}>
                    Duração: quanto tempo o anúncio fica na tela. Pular após: a partir de quantos
                    segundos o botão de pular aparece (tem que ser menor que a duração).
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aDuration}
                      onChangeText={t => setADuration(t.replace(/\D/g, ''))}
                      placeholder="Duração (s)"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                    />
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aSkipAfter}
                      onChangeText={t => setASkipAfter(t.replace(/\D/g, ''))}
                      placeholder="Pular após (s)"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>

                  <ThemedText themeColor="textSecondary" style={[s.fieldHint, { marginTop: Spacing.one }]}>
                    Moedas: quanto o usuário ganha ao assistir até o fim. Peso: prioridade do
                    anúncio no sorteio — peso 2 aparece o dobro de um anúncio com peso 1.
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aCoins}
                      onChangeText={t => setACoins(t.replace(/\D/g, ''))}
                      placeholder="Moedas de recompensa"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                    />
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aWeight}
                      onChangeText={t => setAWeight(t.replace(/\D/g, ''))}
                      placeholder="Peso (frequência)"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>
                </ThemedView>

                <ThemedText style={s.sectionLabel}>PERÍODO DE EXIBIÇÃO (OPCIONAL)</ThemedText>
                <ThemedView type="backgroundElement" style={s.card}>
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                    Deixe em branco para exibir sem data de início/fim definida.
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aStartDate}
                      onChangeText={t => setAStartDate(formatDateInput(t))}
                      placeholder="Início: DD/MM/AAAA"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aStartTime}
                      onChangeText={t => setAStartTime(formatTimeInput(t))}
                      placeholder="HH:MM"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aEndDate}
                      onChangeText={t => setAEndDate(formatDateInput(t))}
                      placeholder="Fim: DD/MM/AAAA"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={aEndTime}
                      onChangeText={t => setAEndTime(formatTimeInput(t))}
                      placeholder="HH:MM"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </ThemedView>

                <ThemedView type="backgroundElement" style={[s.card, s.playerRow, { justifyContent: 'space-between' }]}>
                  <ThemedText type="smallBold">Ativo</ThemedText>
                  <Switch
                    value={aActive}
                    onValueChange={setAActive}
                    trackColor={{ false: '#3a3a5c', true: C.purple }}
                    thumbColor="#ffffff"
                  />
                </ThemedView>

                <TouchableOpacity
                  style={[s.sendNotifBtn, adSaving && { opacity: 0.6 }]}
                  onPress={handleSaveAd}
                  disabled={adSaving}
                  activeOpacity={0.85}>
                  {adSaving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (
                      <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                        {adEditingId ? 'Salvar alterações' : 'Cadastrar anúncio'}
                      </ThemedText>
                    )}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </ThemedView>
      </Modal>

      <Modal
        visible={bannerModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBannerModalVisible(false)}>
        <ThemedView style={s.fill}>
          <SafeAreaView style={s.fill} edges={['top']}>
            <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={[s.header, { borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <ThemedText style={s.headerTitle}>{bannerEditingId ? 'Editar anúncio' : 'Novo anúncio'}</ThemedText>
                <TouchableOpacity onPress={() => setBannerModalVisible(false)} hitSlop={8} activeOpacity={0.7}>
                  <ThemedText style={{ fontSize: 18, fontWeight: '700', color: theme.textSecondary }}>✕</ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <ThemedView type="backgroundElement" style={s.card}>
                  <TextInput
                    style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={bAnunciante}
                    onChangeText={setBAnunciante}
                    placeholder="Anunciante"
                    placeholderTextColor={theme.textSecondary}
                    maxLength={60}
                  />
                  <TextInput
                    style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={bTitulo}
                    onChangeText={setBTitulo}
                    placeholder="Título"
                    placeholderTextColor={theme.textSecondary}
                    maxLength={60}
                  />
                  <TextInput
                    style={[s.replyInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={bDescricao}
                    onChangeText={setBDescricao}
                    placeholder="Descrição (opcional)"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={2}
                    maxLength={80}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={s.galleryBtn}
                    onPress={handleSuggestBannerDescricao}
                    disabled={bSuggestingDesc}
                    activeOpacity={0.8}>
                    {bSuggestingDesc
                      ? <ActivityIndicator size="small" color={C.purple} />
                      : <ThemedText style={s.galleryBtnText}>✨ Sugerir descrição com IA</ThemedText>}
                  </TouchableOpacity>
                  <TextInput
                    style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={bLink}
                    onChangeText={setBLink}
                    placeholder="Link (aberto no navegador ao tocar em Saiba mais)"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                    {(bImagemPendingAsset?.uri || bImagemUrl) ? (
                      <Image source={{ uri: bImagemPendingAsset?.uri || bImagemUrl }} style={s.adThumb} />
                    ) : null}
                    <TextInput
                      style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={bImagemPendingAsset ? '' : bImagemUrl}
                      onChangeText={t => { setBImagemPendingAsset(null); setBImagemUrl(t); }}
                      placeholder={bImagemPendingAsset ? 'Imagem selecionada (enviada ao salvar)' : 'Imagem URL (opcional — sem imagem usa ✝️)'}
                      placeholderTextColor={theme.textSecondary}
                      editable={!bImagemPendingAsset}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                  <TouchableOpacity
                    style={s.galleryBtn}
                    onPress={handlePickBannerImage}
                    disabled={bPickingImagem}
                    activeOpacity={0.8}>
                    {bPickingImagem
                      ? <ActivityIndicator size="small" color={C.purple} />
                      : <ThemedText style={s.galleryBtnText}>📁 Escolher foto da galeria</ThemedText>}
                  </TouchableOpacity>
                  {bTipo === 'comercial' && (
                    <ThemedText themeColor="textSecondary" style={s.fieldHint}>
                      ⚠️ A imagem deve ser a logo do anunciante (fundo liso ou transparente), não uma foto — logos ficam nítidos no espaço pequeno do banner.
                    </ThemedText>
                  )}

                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TouchableOpacity
                      style={[s.modeBtn, bTipo === 'comercial' && s.modeBtnActive]}
                      onPress={() => setBTipo('comercial')}
                      activeOpacity={0.8}>
                      <ThemedText style={[s.modeBtnText, bTipo === 'comercial' && s.modeBtnTextActive]}>💼 Comercial</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.modeBtn, bTipo === 'evento' && { backgroundColor: C.green, borderColor: C.green }]}
                      onPress={() => setBTipo('evento')}
                      activeOpacity={0.8}>
                      <ThemedText style={[s.modeBtnText, bTipo === 'evento' && s.modeBtnTextActive]}>📅 Evento</ThemedText>
                    </TouchableOpacity>
                  </View>

                  {bTipo === 'evento' && (
                    <>
                      <ThemedText style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 4 }}>
                        CATEGORIA
                      </ThemedText>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                        {CATEGORIAS_EVENTO.map(cat => {
                          const cores = CORES_CATEGORIA[cat.value];
                          const ativa = bCategoria === cat.value;
                          return (
                            <TouchableOpacity
                              key={cat.value}
                              style={[
                                s.modeBtn,
                                { borderColor: ativa ? cores.label : C.border, backgroundColor: ativa ? cores.fundo : 'transparent' },
                              ]}
                              onPress={() => setBCategoria(cat.value)}
                              activeOpacity={0.8}>
                              <ThemedText style={[s.modeBtnText, { color: ativa ? cores.label : theme.textSecondary }]}>
                                {cat.label}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <DateField label="Data do evento" value={bDataEvento} onChange={setBDataEvento} />
                      <TextInput
                        style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                        value={bLocalEvento}
                        onChangeText={setBLocalEvento}
                        placeholder="Local do evento"
                        placeholderTextColor={theme.textSecondary}
                        maxLength={80}
                      />
                    </>
                  )}

                  <ThemedText style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 4 }}>
                    PERÍODO DE EXIBIÇÃO NO APP{bTipo === 'comercial' ? ' (opcional)' : ''}
                  </ThemedText>
                  <DateField label="De" value={bPeriodoInicio} onChange={setBPeriodoInicio} />
                  <DateField
                    label="Até"
                    value={bPeriodoFim}
                    onChange={setBPeriodoFim}
                    minimumDate={bPeriodoInicio ? isoToLocalDate(bPeriodoInicio) : undefined}
                  />

                  <ThemedText style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 4 }}>
                    ALCANCE GEOGRÁFICO
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    {(['nacional', 'estado', 'cidade'] as const).map(opcao => (
                      <TouchableOpacity
                        key={opcao}
                        style={[s.modeBtn, bAlcance === opcao && s.modeBtnActive]}
                        onPress={() => setBAlcance(opcao)}
                        activeOpacity={0.8}>
                        <ThemedText style={[s.modeBtnText, bAlcance === opcao && s.modeBtnTextActive]}>
                          {opcao === 'nacional' ? '🇧🇷 Nacional' : opcao === 'estado' ? '📍 Estado' : '🏙️ Cidade'}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {bAlcance === 'estado' && (
                    <TextInput
                      style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={bEstados}
                      onChangeText={setBEstados}
                      placeholder="Estados (sigla, separados por vírgula) — ex.: SP, RJ"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="characters"
                    />
                  )}
                  {bAlcance === 'cidade' && (
                    <TextInput
                      style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={bCidades}
                      onChangeText={setBCidades}
                      placeholder="Cidades, separadas por vírgula — ex.: São Paulo, Campinas"
                      placeholderTextColor={theme.textSecondary}
                    />
                  )}
                  {bAlcance !== 'nacional' && (
                    <ThemedText themeColor="textSecondary" style={s.fieldHint}>
                      Só aparece pra usuários cuja localização (perfil/GPS) bater com um dos valores informados. Sem localização disponível, o usuário só vê banners nacionais.
                    </ThemedText>
                  )}
                </ThemedView>

                <ThemedView type="backgroundElement" style={[s.card, s.playerRow, { justifyContent: 'space-between' }]}>
                  <ThemedText type="smallBold">Ativo</ThemedText>
                  <Switch
                    value={bAtivo}
                    onValueChange={setBAtivo}
                    trackColor={{ false: '#3a3a5c', true: C.purple }}
                    thumbColor="#ffffff"
                  />
                </ThemedView>

                <TouchableOpacity
                  style={[s.sendNotifBtn, bannerSaving && { opacity: 0.6 }]}
                  onPress={handleSaveBanner}
                  disabled={bannerSaving}
                  activeOpacity={0.85}>
                  {bannerSaving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (
                      <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                        {bannerEditingId ? 'Salvar alterações' : 'Cadastrar anúncio'}
                      </ThemedText>
                    )}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </ThemedView>
      </Modal>

      <SafeAreaView style={s.fill} edges={['top']}>
        <KeyboardAvoidingView
          style={s.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Admin</ThemedText>
        </View>

        {/* Seletor de seção */}
        <View style={[s.sectionRow, { borderBottomColor: C.border, backgroundColor: theme.backgroundElement }]}>
          {([
            { key: 'contests',      label: 'Contestações', icon: '✋' },
            { key: 'support',       label: 'Suporte',       icon: '💬' },
            { key: 'trilhas',       label: 'Trilhas',       icon: '🔓' },
            { key: 'notifications', label: 'Notificar',     icon: '🔔' },
            { key: 'ads',           label: 'Anúncios',      icon: '📢' },
            { key: 'banners',       label: 'Banners',       icon: '🪧' },
            { key: 'eventos',       label: 'Eventos',       icon: '🎪' },
            { key: 'config',        label: 'Config',        icon: '⚙️' },
          ] as { key: AdminSection; label: string; icon: string }[]).map(({ key, label, icon }) => {
            const active = section === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.sectionBtn, active && { borderBottomWidth: 2.5, borderBottomColor: C.purple }]}
                onPress={() => setSection(key)}
                activeOpacity={0.7}>
                <ThemedText style={{ fontSize: 20, lineHeight: 24 }}>{icon}</ThemedText>
                <ThemedText style={[s.sectionTxt, { color: active ? C.purple : theme.textSecondary }]}>
                  {label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ══ SEÇÃO: CONTESTAÇÕES ══ */}
        {section === 'contests' && (
          <>
            {/* Sub-filtros */}
            <View style={[s.filterRow, { borderBottomColor: C.border }]}>
              {(['pending', 'approved', 'rejected'] as FilterStatus[]).map(f => {
                const active = filter === f;
                const color  = active ? STATUS_COLOR[f] : theme.textSecondary;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[s.filterBtn, active && { borderBottomWidth: 2, borderBottomColor: STATUS_COLOR[f] }]}
                    onPress={() => setFilter(f)}
                    activeOpacity={0.7}>
                    <ThemedText style={{ fontSize: 16, lineHeight: 20 }}>{STATUS_ICON[f]}</ThemedText>
                    <ThemedText style={[s.filterTxt, { color }]}>{STATUS_LABEL[f]}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {cLoading ? (
              <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
            ) : cError ? (
              <ErrorState message={cError} onRetry={() => fetchContests()} />
            ) : (
              <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={cRefresh}
                    onRefresh={() => { setCRefresh(true); fetchContests(true); }}
                    tintColor={C.purple}
                  />
                }>
                {contests.length === 0 ? (
                  <EmptyState icon={STATUS_ICON[filter]} color={STATUS_COLOR[filter]}
                    title={filter === 'pending' ? 'Nenhuma pendente' : filter === 'approved' ? 'Nenhuma aprovada' : 'Nenhuma rejeitada'}
                    subtitle={filter === 'pending' ? 'Todas as contestações já foram revisadas.' : 'Nenhuma contestação encontrada neste filtro.'} />
                ) : contests.map(c => {
                  const isActing    = acting === c.id;
                  const statusColor = STATUS_COLOR[c.status] ?? theme.textSecondary;
                  return (
                    <ThemedView key={c.id} type="backgroundElement" style={s.card}>
                      <View style={s.playerRow}>
                        <AvatarImage value={c.profiles?.avatar_emoji ?? '👤'} size={36} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold" numberOfLines={1}>{c.profiles?.name ?? 'Usuário desconhecido'}</ThemedText>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                            {c.game_mode === 'online' ? '🌐 Online' : '🎲 Solo'} · {new Date(c.created_at).toLocaleDateString('pt-BR')}
                          </ThemedText>
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
                          <ThemedText style={[s.statusTxt, { color: statusColor }]}>
                            {STATUS_ICON[c.status]} {STATUS_LABEL[c.status]}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={[s.answerBox, { backgroundColor: theme.background }]}>
                        <View style={s.answerMeta}>
                          <View style={[s.letterCircle, { backgroundColor: C.purple }]}>
                            <ThemedText style={s.letterTxt}>{c.letter}</ThemedText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={{ fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              {c.category_key}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>{c.answer}</ThemedText>
                          </View>
                          <View style={[s.resultIconWrap, { backgroundColor: theme.backgroundElement }]}>
                            <ThemedText style={{ fontSize: 20, lineHeight: 24 }}>{RESULT_ICON[c.original_result] ?? '❓'}</ThemedText>
                          </View>
                        </View>
                        <View style={[s.verdictBadge, { backgroundColor: statusColor + '1A' }]}>
                          <ThemedText style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>
                            Sistema: {RESULT_LABEL[c.original_result] ?? c.original_result}
                          </ThemedText>
                        </View>
                      </View>

                      {c.status === 'pending' && (
                        <View style={s.actionRow}>
                          <TouchableOpacity style={[s.rejectBtn, isActing && { opacity: 0.5 }]} disabled={isActing} activeOpacity={0.8} onPress={() => handleReject(c)}>
                            {isActing ? <ActivityIndicator size="small" color={C.red} /> : <ThemedText style={s.rejectTxt}>❌  Rejeitar</ThemedText>}
                          </TouchableOpacity>
                          <TouchableOpacity style={[s.approveBtn, isActing && { opacity: 0.5 }]} disabled={isActing} activeOpacity={0.8} onPress={() => handleApprove(c)}>
                            {isActing ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={s.approveTxt}>✅  Aprovar  +10 🪙</ThemedText>}
                          </TouchableOpacity>
                        </View>
                      )}
                      {c.reviewed_at && (
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 10, textAlign: 'right', marginTop: 4 }}>
                          Revisado em {new Date(c.reviewed_at).toLocaleDateString('pt-BR')}
                        </ThemedText>
                      )}
                    </ThemedView>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}

        {/* ══ SEÇÃO: SUPORTE ══ */}
        {section === 'support' && (
          <>
            {/* Sub-filtros */}
            <View style={[s.filterRow, { borderBottomColor: C.border }]}>
              {([
                { key: 'unread', label: 'Não lidas', icon: '🔴' },
                { key: 'all',    label: 'Todas',     icon: '📋' },
              ] as { key: SupportFilter; label: string; icon: string }[]).map(({ key, label, icon }) => {
                const active = sfilt === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[s.filterBtn, active && { borderBottomWidth: 2, borderBottomColor: C.purple }]}
                    onPress={() => setSfilt(key)}
                    activeOpacity={0.7}>
                    <ThemedText style={{ fontSize: 16, lineHeight: 20 }}>{icon}</ThemedText>
                    <ThemedText style={[s.filterTxt, { color: active ? C.purple : theme.textSecondary }]}>{label}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {sLoading ? (
              <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
            ) : sError ? (
              <ErrorState message={sError} onRetry={() => fetchSupport()} />
            ) : (
              <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={sRefresh}
                    onRefresh={() => { setSRefresh(true); fetchSupport(true); }}
                    tintColor={C.purple}
                  />
                }>
                {msgs.length === 0 ? (
                  <EmptyState icon={sfilt === 'unread' ? '✅' : '📭'} color={C.green}
                    title={sfilt === 'unread' ? 'Nenhuma mensagem nova' : 'Nenhuma mensagem encontrada'}
                    subtitle="Puxe para baixo para atualizar." />
                ) : msgs.map(msg => {
                  const isExpanded = expanded === msg.id;
                  const isSending  = sending === msg.id;
                  return (
                    <ThemedView key={msg.id} type="backgroundElement" style={s.card}>
                      {/* Cabeçalho */}
                      <View style={s.playerRow}>
                        <View style={[s.supportAvatar, { backgroundColor: msg.read ? theme.background : C.purple + '22' }]}>
                          <ThemedText style={{ fontSize: 20, lineHeight: 24 }}>👤</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold" numberOfLines={1}>
                            {msg.email ?? 'Anônimo'}
                          </ThemedText>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                            {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </ThemedText>
                        </View>
                        {!msg.read && (
                          <View style={s.unreadDot} />
                        )}
                        {msg.reply && (
                          <View style={[s.statusBadge, { backgroundColor: C.green + '22' }]}>
                            <ThemedText style={[s.statusTxt, { color: C.green }]}>✅ Respondida</ThemedText>
                          </View>
                        )}
                      </View>

                      {/* Mensagem */}
                      <View style={[s.msgBox, { backgroundColor: theme.background }]}>
                        <ThemedText style={{ fontSize: 14, lineHeight: 20, color: theme.text }}>
                          {msg.message}
                        </ThemedText>
                      </View>

                      {/* Resposta já enviada */}
                      {msg.reply && (
                        <View style={[s.replyBox, { borderLeftColor: C.purple }]}>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
                            SUA RESPOSTA · {msg.replied_at ? new Date(msg.replied_at).toLocaleDateString('pt-BR') : ''}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 13, lineHeight: 18, color: theme.text }}>
                            {msg.reply}
                          </ThemedText>
                        </View>
                      )}

                      {/* Ações */}
                      {!msg.reply && (
                        <>
                          {isExpanded ? (
                            <View style={s.replyForm}>
                              <TextInput
                                style={[s.replyInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                                value={replyText}
                                onChangeText={setReplyText}
                                placeholder="Escreva sua resposta..."
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                autoFocus
                              />
                              <View style={s.replyActions}>
                                <TouchableOpacity
                                  style={s.cancelReplyBtn}
                                  onPress={() => { setExpanded(null); setReplyText(''); }}
                                  activeOpacity={0.7}>
                                  <ThemedText themeColor="textSecondary" style={{ fontSize: 13, fontWeight: '600' }}>Cancelar</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[s.sendReplyBtn, (!replyText.trim() || isSending) && { opacity: 0.5 }]}
                                  onPress={() => handleSendReply(msg)}
                                  disabled={!replyText.trim() || isSending}
                                  activeOpacity={0.8}>
                                  {isSending
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <ThemedText style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Enviar resposta</ThemedText>}
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={s.respondBtn}
                              onPress={() => {
                                if (!msg.read) handleMarkRead(msg.id);
                                setExpanded(msg.id);
                                setReplyText('');
                              }}
                              activeOpacity={0.8}>
                              <ThemedText style={{ color: C.purple, fontSize: 13, fontWeight: '800' }}>💬 Responder</ThemedText>
                            </TouchableOpacity>
                          )}
                        </>
                      )}

                      {/* Rodapé: marcar lida + excluir */}
                      <View style={s.msgFooter}>
                        {!msg.reply && !isExpanded && !msg.read && (
                          <TouchableOpacity onPress={() => handleMarkRead(msg.id)} activeOpacity={0.7}>
                            <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                              Marcar como lida
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity onPress={() => handleDeleteMsg(msg.id)} activeOpacity={0.7} hitSlop={8}>
                          <ThemedText style={{ fontSize: 11, color: C.red, fontWeight: '600' }}>🗑 Excluir</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </ThemedView>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}

        {/* ══ SEÇÃO: TRILHAS ══ */}
        {section === 'trilhas' && (
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            {!selectedUser && (
              <>
                <ThemedView type="backgroundElement" style={s.card}>
                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TextInput
                      style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={uQuery}
                      onChangeText={setUQuery}
                      placeholder="Nome ou e-mail do usuário"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      returnKeyType="search"
                      onSubmitEditing={handleSearchUsers}
                    />
                    <TouchableOpacity
                      style={[s.searchBtn, uLoading && { opacity: 0.6 }]}
                      onPress={handleSearchUsers}
                      disabled={uLoading}
                      activeOpacity={0.8}>
                      {uLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Buscar</ThemedText>}
                    </TouchableOpacity>
                  </View>
                </ThemedView>

                {uError ? (
                  <ErrorState message={uError} onRetry={handleSearchUsers} />
                ) : uResults.length === 0 ? (
                  <EmptyState icon="🔍" color={C.purple}
                    title="Buscar usuário"
                    subtitle="Digite o nome ou e-mail e toque em Buscar para liberar trilhas premium." />
                ) : uResults.map(u => (
                  <TouchableOpacity key={u.id} onPress={() => handleSelectUser(u)} activeOpacity={0.75}>
                    <ThemedView type="backgroundElement" style={[s.card, s.playerRow]}>
                      <AvatarImage value={u.avatar_emoji} size={40} />
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {u.name}{u.is_admin ? '  👑' : ''}
                        </ThemedText>
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }} numberOfLines={1}>
                          {u.email}
                        </ThemedText>
                      </View>
                      <ThemedText style={{ color: C.purple, fontWeight: '700' }}>Ver →</ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {selectedUser && (
              <>
                <TouchableOpacity onPress={handleBackToSearch} activeOpacity={0.7} style={s.backToSearch}>
                  <ThemedText style={{ color: C.purple, fontWeight: '700' }}>← Voltar para busca</ThemedText>
                </TouchableOpacity>

                <ThemedView type="backgroundElement" style={[s.card, s.playerRow]}>
                  <AvatarImage value={selectedUser.avatar_emoji} size={44} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">{selectedUser.name}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>{selectedUser.email}</ThemedText>
                  </View>
                </ThemedView>

                <ThemedText style={s.sectionLabel}>TRILHAS PREMIUM</ThemedText>

                {tLoading ? (
                  <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
                ) : TRILHAS_PREMIUM.map(trilha => {
                  const unlocked   = userTrilhas.has(trilha.id);
                  const isToggling = toggling === trilha.id;
                  return (
                    <ThemedView key={trilha.id} type="backgroundElement" style={[s.card, s.playerRow]}>
                      <TrilhaIcon icone={trilha.icone} size={22} />
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{trilha.titulo}</ThemedText>
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                          {unlocked ? 'Liberada' : 'Bloqueada'}
                        </ThemedText>
                      </View>
                      {isToggling ? (
                        <ActivityIndicator size="small" color={C.purple} />
                      ) : (
                        <Switch
                          value={unlocked}
                          onValueChange={() => handleToggleTrilha(trilha.id, unlocked)}
                          trackColor={{ false: '#3a3a5c', true: C.purple }}
                          thumbColor="#ffffff"
                        />
                      )}
                    </ThemedView>
                  );
                })}
              </>
            )}
          </ScrollView>
        )}

        {/* ══ SEÇÃO: NOTIFICAÇÕES ══ */}
        {section === 'notifications' && (
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            {/* Modo: geral ou direto */}
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <TouchableOpacity
                style={[s.modeBtn, nMode === 'geral' && s.modeBtnActive]}
                onPress={() => setNMode('geral')}
                activeOpacity={0.8}>
                <ThemedText style={[s.modeBtnText, nMode === 'geral' && s.modeBtnTextActive]}>📢 Geral</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modeBtn, nMode === 'direto' && s.modeBtnActive]}
                onPress={() => setNMode('direto')}
                activeOpacity={0.8}>
                <ThemedText style={[s.modeBtnText, nMode === 'direto' && s.modeBtnTextActive]}>👤 Direto</ThemedText>
              </TouchableOpacity>
            </View>

            {nMode === 'direto' && (
              <ThemedView type="backgroundElement" style={s.card}>
                {!nSelectedUser ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                      <TextInput
                        style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                        value={nQuery}
                        onChangeText={setNQuery}
                        placeholder="Nome ou e-mail do usuário"
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize="none"
                        returnKeyType="search"
                        onSubmitEditing={handleSearchNUsers}
                      />
                      <TouchableOpacity
                        style={[s.searchBtn, nSearching && { opacity: 0.6 }]}
                        onPress={handleSearchNUsers}
                        disabled={nSearching}
                        activeOpacity={0.8}>
                        {nSearching
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Buscar</ThemedText>}
                      </TouchableOpacity>
                    </View>
                    {nResults.map(u => (
                      <TouchableOpacity
                        key={u.id}
                        onPress={() => { setNSelectedUser(u); setNResults([]); }}
                        activeOpacity={0.75}
                        style={[s.playerRow, { marginTop: Spacing.two }]}>
                        <AvatarImage value={u.avatar_emoji} size={36} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold" numberOfLines={1}>{u.name}</ThemedText>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }} numberOfLines={1}>{u.email}</ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <View style={s.playerRow}>
                    <AvatarImage value={nSelectedUser.avatar_emoji} size={36} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold" numberOfLines={1}>{nSelectedUser.name}</ThemedText>
                      <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }} numberOfLines={1}>{nSelectedUser.email}</ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => setNSelectedUser(null)} activeOpacity={0.7}>
                      <ThemedText style={{ color: C.red, fontWeight: '700', fontSize: 12 }}>Trocar</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </ThemedView>
            )}

            <ThemedView type="backgroundElement" style={s.card}>
              <TextInput
                style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                value={nTitle}
                onChangeText={setNTitle}
                placeholder="Título (ex: 🎉 Nova trilha disponível!)"
                placeholderTextColor={theme.textSecondary}
                maxLength={80}
              />
              <TextInput
                style={[s.replyInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border, marginTop: Spacing.two }]}
                value={nBody}
                onChangeText={setNBody}
                placeholder="Mensagem..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
            </ThemedView>

            <ThemedText style={s.sectionLabel}>QUANDO ENVIAR</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
              {([
                { key: 'now',        label: 'Agora' },
                { key: '1h',         label: '+1 hora' },
                { key: 'tomorrow9',  label: 'Amanhã 9h' },
                { key: 'custom',     label: 'Escolher data' },
              ] as { key: NotifSchedule; label: string }[]).map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[s.scheduleBtn, nSchedule === key && s.scheduleBtnActive]}
                  onPress={() => setNSchedule(key)}
                  activeOpacity={0.8}>
                  <ThemedText style={[s.scheduleBtnText, nSchedule === key && s.scheduleBtnTextActive]}>{label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {nSchedule === 'custom' && (
              <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                <TextInput
                  style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                  value={nCustomDate}
                  onChangeText={t => setNCustomDate(formatDateInput(t))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <TextInput
                  style={[s.searchInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                  value={nCustomTime}
                  onChangeText={t => setNCustomTime(formatTimeInput(t))}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            )}

            <TouchableOpacity
              style={[s.sendNotifBtn, nSending && { opacity: 0.6 }]}
              onPress={handleSendNotification}
              disabled={nSending}
              activeOpacity={0.85}>
              {nSending
                ? <ActivityIndicator size="small" color="#fff" />
                : (
                  <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                    {nSchedule === 'now' ? '📤 Enviar agora' : '🕒 Agendar'}
                  </ThemedText>
                )}
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ══ SEÇÃO: ANÚNCIOS ══ */}
        {section === 'ads' && (
          <>
            <View style={s.newAdBtnWrap}>
              <TouchableOpacity style={s.newAdBtn} onPress={handleOpenCreateAd} activeOpacity={0.85}>
                <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Novo anúncio</ThemedText>
              </TouchableOpacity>
            </View>

            {adsLoading ? (
              <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
            ) : adsError ? (
              <ErrorState message={adsError} onRetry={() => fetchAds()} />
            ) : (
              <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={adsRefresh}
                    onRefresh={() => { setAdsRefresh(true); fetchAds(true); }}
                    tintColor={C.purple}
                  />
                }>
                {ads.length === 0 ? (
                  <EmptyState icon="📢" color={C.purple}
                    title="Nenhum anúncio"
                    subtitle="Toque em “+ Novo anúncio” para cadastrar o primeiro." />
                ) : ads.map(ad => {
                  const status      = getAdStatus(ad);
                  const isToggling  = adToggling === ad.id;
                  const isDeleting  = adDeleting === ad.id;
                  return (
                    <ThemedView key={ad.id} type="backgroundElement" style={s.card}>
                      <View style={s.playerRow}>
                        {ad.thumb_url || ad.media_url ? (
                          <Image source={{ uri: ad.thumb_url || ad.media_url }} style={s.adThumb} />
                        ) : (
                          <View style={[s.adThumb, s.adThumbPlaceholder]}>
                            <ThemedText style={{ fontSize: 20 }}>{ad.media_type === 'video' ? '🎬' : '🖼️'}</ThemedText>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold" numberOfLines={1}>{ad.title}</ThemedText>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }} numberOfLines={1}>
                            {ad.coins}🪙 · peso {ad.weight}
                          </ThemedText>
                        </View>
                        {isToggling ? (
                          <ActivityIndicator size="small" color={C.purple} />
                        ) : (
                          <Switch
                            value={ad.active}
                            onValueChange={() => handleToggleAdActive(ad)}
                            trackColor={{ false: '#3a3a5c', true: C.purple }}
                            thumbColor="#ffffff"
                          />
                        )}
                      </View>

                      <View style={[s.statusBadge, { alignSelf: 'flex-start', backgroundColor: status.color + '22' }]}>
                        <ThemedText style={[s.statusTxt, { color: status.color }]}>{status.label.toUpperCase()}</ThemedText>
                      </View>

                      {(ad.start_date || ad.end_date) && (
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                          {ad.start_date ? `De ${new Date(ad.start_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} ` : ''}
                          {ad.end_date ? `até ${new Date(ad.end_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
                        </ThemedText>
                      )}

                      <View style={s.msgFooter}>
                        <TouchableOpacity onPress={() => handleOpenEditAd(ad)} activeOpacity={0.7}>
                          <ThemedText style={{ fontSize: 12, color: C.purple, fontWeight: '700' }}>✏️ Editar</ThemedText>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={C.red} />
                        ) : (
                          <TouchableOpacity onPress={() => handleDeleteAd(ad)} activeOpacity={0.7} hitSlop={8}>
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

        {/* ══ SEÇÃO: BANNERS DO FEED ══ */}
        {section === 'banners' && (
          <>
            <View style={s.newAdBtnWrap}>
              <TouchableOpacity style={s.newAdBtn} onPress={handleOpenCreateBanner} activeOpacity={0.85}>
                <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Novo anúncio</ThemedText>
              </TouchableOpacity>
            </View>

            {bannersLoading ? (
              <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
            ) : bannersError ? (
              <ErrorState message={bannersError} onRetry={() => fetchBanners()} />
            ) : (
              <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={bannersRefresh}
                    onRefresh={() => { setBannersRefresh(true); fetchBanners(true); }}
                    tintColor={C.purple}
                  />
                }>
                {banners.length === 0 ? (
                  <EmptyState icon="🪧" color={C.purple}
                    title="Nenhum banner"
                    subtitle="Toque em “+ Novo anúncio” para cadastrar o primeiro." />
                ) : banners.map(b => {
                  const isToggling = bannerToggling === b.id;
                  const isDeleting = bannerDeleting === b.id;
                  return (
                    <ThemedView key={b.id} type="backgroundElement" style={s.card}>
                      <View style={s.playerRow}>
                        {b.imagem_url ? (
                          <Image source={{ uri: b.imagem_url }} style={s.adThumb} />
                        ) : (
                          <View style={[s.adThumb, s.adThumbPlaceholder]}>
                            <ThemedText style={{ fontSize: 20 }}>✝️</ThemedText>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold" numberOfLines={1}>{b.titulo}</ThemedText>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }} numberOfLines={1}>
                            {b.anunciante} · 👁 {b.impressoes} · 🖱 {b.cliques}
                          </ThemedText>
                        </View>
                        {isToggling ? (
                          <ActivityIndicator size="small" color={C.purple} />
                        ) : (
                          <Switch
                            value={b.ativo}
                            onValueChange={() => handleToggleBannerActive(b)}
                            trackColor={{ false: '#3a3a5c', true: C.purple }}
                            thumbColor="#ffffff"
                          />
                        )}
                      </View>

                      <View style={s.msgFooter}>
                        <TouchableOpacity onPress={() => handleOpenEditBanner(b)} activeOpacity={0.7}>
                          <ThemedText style={{ fontSize: 12, color: C.purple, fontWeight: '700' }}>✏️ Editar</ThemedText>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={C.red} />
                        ) : (
                          <TouchableOpacity onPress={() => handleDeleteBanner(b)} activeOpacity={0.7} hitSlop={8}>
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

        {/* ══ SEÇÃO: EVENTOS PATROCINADOS ══ */}
        {section === 'eventos' && (
          <>
            <Modal
              visible={rejeitarModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setRejeitarModalVisible(false)}>
              <View style={s.motivoOverlay}>
                <View style={[s.motivoBox, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">Motivo da rejeição</ThemedText>
                  <ThemedText themeColor="textSecondary" style={s.fieldHint}>
                    O usuário verá esse motivo e o valor será reembolsado automaticamente.
                  </ThemedText>
                  <TextInput
                    style={[s.replyInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                    value={motivoRejeicao}
                    onChangeText={setMotivoRejeicao}
                    placeholder="Ex.: Conteúdo não relacionado à fé católica"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={s.replyActions}>
                    <TouchableOpacity
                      style={s.cancelReplyBtn}
                      onPress={() => setRejeitarModalVisible(false)}
                      disabled={rejeitando}
                      activeOpacity={0.7}>
                      <ThemedText style={{ fontSize: 13 }}>Cancelar</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.sendReplyBtn, { backgroundColor: C.red }, rejeitando && { opacity: 0.6 }]}
                      onPress={handleConfirmarRejeitar}
                      disabled={rejeitando}
                      activeOpacity={0.8}>
                      {rejeitando
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <ThemedText style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Rejeitar e reembolsar</ThemedText>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <View style={[s.filterRow, { borderBottomColor: C.border }]}>
              {(['pendentes', 'historico'] as EventosSub[]).map(f => {
                const active = eventosSub === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[s.filterBtn, active && { borderBottomWidth: 2, borderBottomColor: C.purple }]}
                    onPress={() => setEventosSub(f)}
                    activeOpacity={0.7}>
                    <ThemedText style={{ fontSize: 16, lineHeight: 20 }}>{f === 'pendentes' ? '⏳' : '📜'}</ThemedText>
                    <ThemedText style={[s.filterTxt, { color: active ? C.purple : theme.textSecondary }]}>
                      {f === 'pendentes' ? 'Pendentes' : 'Histórico'}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {eventosLoading ? (
              <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
            ) : eventosError ? (
              <ErrorState message={eventosError} onRetry={() => fetchEventos()} />
            ) : (
              <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={eventosRefresh}
                    onRefresh={() => { setEventosRefresh(true); fetchEventos(true); }}
                    tintColor={C.purple}
                  />
                }>
                {(eventosSub === 'pendentes' ? eventosPendentes : eventosHistorico).length === 0 ? (
                  <EmptyState icon="🎪" color={C.purple}
                    title={eventosSub === 'pendentes' ? 'Nenhum pendente' : 'Nenhum registro'}
                    subtitle={eventosSub === 'pendentes' ? 'Todos os eventos já foram revisados.' : 'Nenhum evento encontrado neste histórico.'} />
                ) : (eventosSub === 'pendentes' ? eventosPendentes : eventosHistorico).map(evento => {
                  const isActing = eventoActing === evento.id;
                  const statusColor = evento.status === 'rejeitado' ? C.red
                    : evento.status === 'encerrado' ? theme.textSecondary
                    : C.green;
                  return (
                    <ThemedView key={evento.id} type="backgroundElement" style={s.card}>
                      <View style={s.playerRow}>
                        {evento.imagem_url ? (
                          <Image source={{ uri: evento.imagem_url }} style={s.adThumb} />
                        ) : (
                          <View style={[s.adThumb, s.adThumbPlaceholder]}>
                            <ThemedText style={{ fontSize: 20 }}>🎪</ThemedText>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ThemedText type="smallBold" numberOfLines={1} style={{ flexShrink: 1 }}>{evento.titulo}</ThemedText>
                            <View style={[s.categoriaBadge, { backgroundColor: CORES_CATEGORIA[evento.categoria ?? 'outro'].fundo, borderColor: CORES_CATEGORIA[evento.categoria ?? 'outro'].borda }]}>
                              <ThemedText style={{ fontSize: 10, fontWeight: '700', color: CORES_CATEGORIA[evento.categoria ?? 'outro'].label }}>
                                {CATEGORIAS_EVENTO.find(c => c.value === (evento.categoria ?? 'outro'))?.label ?? 'Outro'}
                              </ThemedText>
                            </View>
                          </View>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }} numberOfLines={1}>
                            {ALCANCE_LABELS[evento.alcance]} · {evento.periodo} dias · R$ {(evento.valor_pago ?? 0).toFixed(2).replace('.', ',')}
                          </ThemedText>
                        </View>
                        {eventosSub === 'historico' && (
                          <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
                            <ThemedText style={[s.statusTxt, { color: statusColor }]}>
                              {evento.status === 'rejeitado' ? '❌ Rejeitado' : evento.status === 'encerrado' ? '⚫ Encerrado' : '✅ No ar'}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }} numberOfLines={3}>
                        {evento.descricao}
                      </ThemedText>
                      {evento.local_evento ? (
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>📍 {evento.local_evento}</ThemedText>
                      ) : null}
                      {evento.link_externo ? (
                        <ThemedText style={{ fontSize: 11, color: C.purple }} numberOfLines={1}>🔗 {evento.link_externo}</ThemedText>
                      ) : null}
                      {evento.motivo_rejeicao ? (
                        <ThemedText style={{ fontSize: 11, color: C.red }}>Motivo: {evento.motivo_rejeicao}</ThemedText>
                      ) : null}

                      {eventosSub === 'pendentes' && (
                        <View style={s.actionRow}>
                          <TouchableOpacity style={[s.rejectBtn, isActing && { opacity: 0.5 }]} disabled={isActing} activeOpacity={0.8} onPress={() => handleAbrirRejeitar(evento)}>
                            <ThemedText style={s.rejectTxt}>❌  Rejeitar</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity style={[s.approveBtn, isActing && { opacity: 0.5 }]} disabled={isActing} activeOpacity={0.8} onPress={() => handleAprovarEvento(evento)}>
                            {isActing ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={s.approveTxt}>✅  Aprovar</ThemedText>}
                          </TouchableOpacity>
                        </View>
                      )}
                    </ThemedView>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}

        {/* ══ SEÇÃO: CONFIGURAÇÕES ══ */}
        {section === 'config' && (
          <ScrollView contentContainerStyle={s.scroll}>
            <ThemedView type="backgroundElement" style={[s.card, s.playerRow, { justifyContent: 'space-between' }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="smallBold">Banner de anúncios ativo</ThemedText>
                <ThemedText themeColor="textSecondary" style={s.fieldHint}>
                  Quando desligado, o banner some do app para todos os usuários imediatamente.
                </ThemedText>
              </View>
              {configLoading ? (
                <ActivityIndicator size="small" color={C.purple} />
              ) : (
                <Switch
                  value={configBannerAtivo}
                  onValueChange={handleToggleConfigBannerAtivo}
                  disabled={configSaving}
                  trackColor={{ false: '#3a3a5c', true: C.purple }}
                  thumbColor="#ffffff"
                />
              )}
            </ThemedView>

            <ThemedView type="backgroundElement" style={[s.card, s.playerRow, { justifyContent: 'space-between' }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="smallBold">🎪 Eventos patrocinados</ThemedText>
                <ThemedText themeColor="textSecondary" style={s.fieldHint}>
                  Permite que usuários criem e paguem para divulgar eventos no banner.
                </ThemedText>
              </View>
              {configLoading ? (
                <ActivityIndicator size="small" color={C.purple} />
              ) : (
                <Switch
                  value={configEventosAtivo}
                  onValueChange={handleToggleConfigEventosAtivo}
                  disabled={configEventosSaving}
                  trackColor={{ false: '#3a3a5c', true: C.purple }}
                  thumbColor="#ffffff"
                />
              )}
            </ThemedView>
          </ScrollView>
        )}

        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function EmptyState({ icon, color, title, subtitle }: { icon: string; color: string; title: string; subtitle: string }) {
  return (
    <View style={s.emptyWrap}>
      <View style={[s.emptyIconWrap, { backgroundColor: color + '18' }]}>
        <ThemedText style={s.emptyIcon}>{icon}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={[s.center, { color }]}>{title}</ThemedText>
      <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>{subtitle}</ThemedText>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={s.centerFlex}>
      <ThemedText style={{ fontSize: 36, lineHeight: 44 }}>⚠️</ThemedText>
      <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>{message}</ThemedText>
      <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={s.retryBtn}>
        <ThemedText style={{ color: C.purple, fontWeight: '700', fontSize: 14 }}>Tentar novamente</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill:       { flex: 1 },
  center:     { textAlign: 'center' },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },

  header: {
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderBottomWidth: 1, minHeight: 56, justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },

  // Seletor de seção
  sectionRow: { flexDirection: 'row', borderBottomWidth: 1 },
  sectionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  sectionTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Sub-filtros
  filterRow: { flexDirection: 'row', borderBottomWidth: 1 },
  filterBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, gap: 3 },
  filterTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  scroll:    { padding: Spacing.three, gap: Spacing.two },
  emptyWrap: { alignItems: 'center', gap: Spacing.two, paddingTop: 60, paddingHorizontal: Spacing.four },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  emptyIcon: { fontSize: 40, lineHeight: 52 },
  retryBtn:  { marginTop: Spacing.one, paddingVertical: 10, paddingHorizontal: 24, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.purple },

  // Card geral
  card:        { borderRadius: C.radius.lg, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: C.border },
  playerRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: C.radius.pill },
  categoriaBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: C.radius.pill, borderWidth: 1 },
  statusTxt:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Contestações
  answerBox:    { borderRadius: C.radius.md, padding: Spacing.two, gap: Spacing.one },
  answerMeta:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  letterCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  letterTxt:    { fontSize: 24, fontWeight: '900', color: '#fff', includeFontPadding: false },
  resultIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  verdictBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: C.radius.pill },
  actionRow:    { flexDirection: 'row', gap: Spacing.two, marginTop: 4 },
  rejectBtn:    { flex: 1, paddingVertical: 10, borderRadius: C.radius.pill, alignItems: 'center', borderWidth: 1.5, borderColor: C.red + '88' },
  rejectTxt:    { fontSize: 13, fontWeight: '800', color: C.red },
  approveBtn:   { flex: 1, paddingVertical: 10, borderRadius: C.radius.pill, alignItems: 'center', backgroundColor: C.green },
  approveTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Suporte
  supportAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  unreadDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  msgBox:        { borderRadius: C.radius.md, padding: Spacing.two },
  replyBox:      { borderLeftWidth: 3, paddingLeft: Spacing.two, gap: 2 },
  replyForm:     { gap: Spacing.two },
  replyInput:    { borderWidth: 1.5, borderRadius: C.radius.md, padding: Spacing.two, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  replyActions:  { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
  cancelReplyBtn:{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.border },
  sendReplyBtn:  { paddingVertical: 8, paddingHorizontal: 20, borderRadius: C.radius.pill, backgroundColor: C.purple },
  respondBtn:    { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.purple + '88' },
  msgFooter:     { flexDirection: 'row', alignItems: 'center', marginTop: 2 },

  // Trilhas
  sectionLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#9B97D4', textTransform: 'uppercase', marginTop: Spacing.one },
  searchInput:   { flex: 1, borderWidth: 1.5, borderRadius: C.radius.pill, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  searchBtn:     { paddingHorizontal: 20, borderRadius: C.radius.pill, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  backToSearch:  { alignSelf: 'flex-start', marginBottom: Spacing.one },

  // Notificações
  modeBtn:            { flex: 1, paddingVertical: 10, borderRadius: C.radius.pill, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  modeBtnActive:       { backgroundColor: C.purple, borderColor: C.purple },
  modeBtnText:         { fontSize: 13, fontWeight: '700' },
  modeBtnTextActive:   { color: '#fff' },
  scheduleBtn:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.border },
  scheduleBtnActive:   { backgroundColor: C.purple, borderColor: C.purple },
  scheduleBtnText:     { fontSize: 12, fontWeight: '700' },
  scheduleBtnTextActive: { color: '#fff' },
  sendNotifBtn:        { marginTop: Spacing.two, paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', backgroundColor: C.purple },

  // Anúncios
  newAdBtnWrap:      { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  newAdBtn:          { paddingVertical: 12, borderRadius: C.radius.pill, alignItems: 'center', backgroundColor: C.purple },
  adThumb:           { width: 44, height: 44, borderRadius: C.radius.md },
  adThumbPlaceholder:{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.15)' },
  galleryBtn:        { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.purple + '88' },
  galleryBtnText:    { fontSize: 12, fontWeight: '700', color: C.purple },
  fieldHint:         { fontSize: 11, lineHeight: 15 },

  // Eventos patrocinados — modal de motivo de rejeição
  motivoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  motivoBox:     { width: '100%', maxWidth: 380, borderRadius: C.radius.lg, padding: Spacing.three, gap: Spacing.two },
});
