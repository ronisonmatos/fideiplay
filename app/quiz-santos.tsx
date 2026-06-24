import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type Difficulty = 'facil' | 'medio' | 'dificil';
type Phase = 'idle' | 'difficulty' | 'playing' | 'result';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; emoji: string; desc: string }> = {
  facil:   { label: 'Fácil',   color: C.green,  emoji: '🌱', desc: 'Conhecimentos básicos da fé católica' },
  medio:   { label: 'Médio',   color: C.gold,   emoji: '✝️', desc: 'Santos, sacramentos e doutrina' },
  dificil: { label: 'Difícil', color: C.red,    emoji: '📖', desc: 'Teologia, concílios e história da Igreja' },
};

const ALL_QUESTIONS = [
  // ── FÁCIL ───────────────────────────────────────────────────────────────────
  {
    topic: 'Maria',
    question: 'Quem é a mãe de Jesus Cristo?',
    options: ['Maria Madalena', 'Maria, a Virgem', 'Isabel', 'Ana'],
    correct: 1,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Bíblia',
    question: 'Qual é o primeiro livro da Bíblia?',
    options: ['Êxodo', 'Salmos', 'Gênesis', 'Mateus'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Jesus',
    question: 'Em que cidade Jesus nasceu?',
    options: ['Nazaré', 'Jerusalém', 'Belém', 'Cafarnaum'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Apóstolos',
    question: 'Quantos apóstolos Jesus escolheu?',
    options: ['7', '10', '12', '14'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Apóstolos',
    question: 'Qual apóstolo negou Jesus três vezes antes do canto do galo?',
    options: ['João', 'Tiago', 'André', 'Pedro'],
    correct: 3,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Apóstolos',
    question: 'Qual apóstolo traiu Jesus por trinta moedas de prata?',
    options: ['Tomé', 'Judas Iscariotes', 'Simão', 'Felipe'],
    correct: 1,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Jesus',
    question: 'Qual foi o primeiro milagre de Jesus, segundo o Evangelho de João?',
    options: ['Multiplicação dos pães', 'Cura de um cego', 'Água transformada em vinho', 'Ressurreição de Lázaro'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'João Batista',
    question: 'Quem batizou Jesus no Rio Jordão?',
    options: ['São Pedro', 'São Paulo', 'João Batista', 'São José'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Nossa Senhora Aparecida',
    question: 'Nossa Senhora Aparecida é padroeira de qual país?',
    options: ['Portugal', 'Argentina', 'México', 'Brasil'],
    correct: 3,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Bíblia',
    question: 'Quantos livros tem a Bíblia Católica?',
    options: ['66', '73', '72', '80'],
    correct: 1,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Sacramentos',
    question: 'Qual é o primeiro sacramento que um cristão recebe?',
    options: ['Eucaristia', 'Crisma', 'Batismo', 'Confissão'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'São José',
    question: 'Qual era a profissão de São José, pai adotivo de Jesus?',
    options: ['Pescador', 'Comerciante', 'Carpinteiro', 'Pastor'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Jesus',
    question: 'Em qual dia da semana Jesus ressuscitou?',
    options: ['Sexta-feira', 'Sábado', 'Domingo', 'Segunda-feira'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'São Paulo',
    question: 'Qual era o nome de São Paulo antes de sua conversão?',
    options: ['Simão', 'Barnabé', 'Saulo', 'Matias'],
    correct: 2,
    difficulty: 'facil' as Difficulty,
  },
  {
    topic: 'Oração',
    question: 'Qual oração Jesus ensinou diretamente aos seus discípulos?',
    options: ['Ave Maria', 'Pai Nosso', 'Credo', 'Salve Rainha'],
    correct: 1,
    difficulty: 'facil' as Difficulty,
  },
  // ── MÉDIO ───────────────────────────────────────────────────────────────────
  {
    topic: 'São Francisco de Assis',
    question: 'São Francisco de Assis fundou qual ordem religiosa?',
    options: ['Dominicanos', 'Jesuítas', 'Franciscanos', 'Beneditinos'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Santa Teresa de Ávila',
    question: 'Santa Teresa de Ávila pertencia a qual ordem religiosa?',
    options: ['Franciscanas', 'Carmelitas', 'Dominicanas', 'Beneditinas'],
    correct: 1,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Doutrina',
    question: 'Qual é o significado da palavra "Eucaristia"?',
    options: ['Sacrifício Santo', 'Ação de Graças', 'Corpo de Cristo', 'Pão do Céu'],
    correct: 1,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'São Tomás de Aquino',
    question: 'Quem escreveu a "Suma Teológica", obra fundamental da teologia católica?',
    options: ['Santo Agostinho', 'São Boaventura', 'São Tomás de Aquino', 'São Bernardo'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'São Domingos',
    question: 'São Domingos de Gusmão fundou qual ordem religiosa?',
    options: ['Franciscanos', 'Jesuítas', 'Dominicanos', 'Carmelitas'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Fátima',
    question: 'Em que ano ocorreram as aparições de Nossa Senhora em Fátima, Portugal?',
    options: ['1910', '1917', '1920', '1929'],
    correct: 1,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Sacramentos',
    question: 'Qual sacramento fortalece a fé e une o cristão à Igreja através do Espírito Santo?',
    options: ['Eucaristia', 'Ordem', 'Matrimônio', 'Crisma'],
    correct: 3,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Liturgia',
    question: 'O "Advento" é o período litúrgico preparatório para qual festa?',
    options: ['Páscoa', 'Pentecostes', 'Natal', 'Corpus Christi'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Bíblia',
    question: 'Quantos livros tem o Novo Testamento?',
    options: ['22', '25', '27', '39'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'São Pedro',
    question: 'Quem foi o primeiro papa da Igreja Católica?',
    options: ['São Paulo', 'São Pedro', 'São João', 'São Tiago'],
    correct: 1,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Doutrina',
    question: 'Qual sacramento apaga os pecados cometidos após o Batismo?',
    options: ['Eucaristia', 'Unção dos Enfermos', 'Confissão', 'Crisma'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Nossa Senhora de Lourdes',
    question: 'Em qual cidade francesa apareceu Nossa Senhora a Santa Bernadette Soubirous?',
    options: ['Paris', 'Lyon', 'Lourdes', 'Versailles'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'São João Bosco',
    question: 'São João Bosco é o patrono de qual grupo?',
    options: ['Sacerdotes', 'Pescadores', 'Jovens', 'Enfermos'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'Doutrina',
    question: 'Qual dogma proclamado em 1854 afirma que Maria foi concebida sem pecado original?',
    options: ['Assunção de Maria', 'Imaculada Conceição', 'Maternidade Divina', 'Perpétua Virgindade'],
    correct: 1,
    difficulty: 'medio' as Difficulty,
  },
  {
    topic: 'São Nicolau',
    question: 'São Nicolau de Bari inspirou qual personagem popular do Natal?',
    options: ['Os Reis Magos', 'São Valentim', 'Papai Noel', 'Anjo do Natal'],
    correct: 2,
    difficulty: 'medio' as Difficulty,
  },
  // ── DIFÍCIL ─────────────────────────────────────────────────────────────────
  {
    topic: 'Concílio de Niceia',
    question: 'Qual Concílio (325 d.C.) combateu o arianismo definindo que o Filho é "da mesma substância" que o Pai?',
    options: ['Concílio de Éfeso', 'Concílio de Calcedônia', 'Concílio de Niceia I', 'Concílio de Constantinopla I'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Santo Agostinho',
    question: 'Quem escreveu as "Confissões" e "A Cidade de Deus", pilares da patrística ocidental?',
    options: ['São Jerônimo', 'Santo Agostinho', 'São Gregório Magno', 'Tertuliano'],
    correct: 1,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Grande Cisma',
    question: 'Em que ano ocorreu o Grande Cisma que dividiu a Igreja em Católica Romana e Ortodoxa Oriental?',
    options: ['1054', '1095', '1215', '1309'],
    correct: 0,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Heresias',
    question: 'Qual heresia, condenada pelo Concílio de Niceia, negava a plena divindade de Cristo?',
    options: ['Gnosticismo', 'Arianismo', 'Pelagianismo', 'Nestorianismo'],
    correct: 1,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'São Tomás de Aquino',
    question: 'São Tomás de Aquino pertencia a qual ordem religiosa?',
    options: ['Franciscanos', 'Jesuítas', 'Dominicanos', 'Beneditinos'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Concílio Vaticano II',
    question: 'Em que anos foi realizado o Concílio Vaticano II, convocado por João XXIII?',
    options: ['1950–1958', '1958–1962', '1962–1965', '1965–1970'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Santa Catarina de Siena',
    question: 'Santa Catarina de Siena convenceu qual papa a retornar de Avignon para Roma?',
    options: ['Clemente VI', 'Inocêncio VI', 'Gregório XI', 'Urbano VI'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Bíblia',
    question: 'Quantos livros deuterocanônicos a Bíblia Católica possui (ausentes no cânon protestante)?',
    options: ['5', '6', '7', '9'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Mártires',
    question: 'Quem foi o primeiro mártir cristão, apedrejado por pregar o Evangelho em Jerusalém?',
    options: ['São Pedro', 'Santo Estêvão', 'São Tiago', 'São João'],
    correct: 1,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Concílio de Calcedônia',
    question: 'O Concílio de Calcedônia (451 d.C.) definiu que Cristo possui quantas naturezas em uma única Pessoa?',
    options: ['Uma (divina)', 'Uma (humano-divina mista)', 'Duas (divina e humana)', 'Três'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'São Inácio de Loyola',
    question: 'São Inácio de Loyola fundou qual ordem, conhecida por missões, educação e pelo lema "Ad Majorem Dei Gloriam"?',
    options: ['Dominicanos', 'Franciscanos', 'Companhia de Jesus (Jesuítas)', 'Carmelitas Descalços'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Doutrina',
    question: 'O "Filioque" — polêmico no Cisma de 1054 — afirma que o Espírito Santo procede do Pai e de quem?',
    options: ['Da Igreja', 'De Maria', 'Do Filho', 'Dos Apóstolos'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Doutrina Social',
    question: 'Qual encíclica do Papa Leão XIII (1891) é considerada o marco fundador da Doutrina Social da Igreja?',
    options: ['Rerum Novarum', 'Humanae Vitae', 'Evangelii Gaudium', 'Laudato Si'],
    correct: 0,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'Santa Teresa de Lisieux',
    question: 'Santa Teresa do Menino Jesus ficou conhecida por qual "caminho espiritual"?',
    options: ['Via da Contemplação Mística', 'Pequeno Caminho da Infância Espiritual', 'Caminho da Mortificação', 'Via Negativa'],
    correct: 1,
    difficulty: 'dificil' as Difficulty,
  },
  {
    topic: 'São João Paulo II',
    question: 'João Paulo II (1978) foi o primeiro papa não italiano em quantos anos?',
    options: ['100 anos', '250 anos', '455 anos', '600 anos'],
    correct: 2,
    difficulty: 'dificil' as Difficulty,
  },
];

export default function QuizSantosScreen() {
  const theme  = useTheme();
  const scheme = useColorScheme() ?? 'light';
  const { reportResult } = useGameStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [questions, setQuestions] = useState<typeof ALL_QUESTIONS>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const reported = useRef(false);

  useEffect(() => {
    if (phase === 'result' && !reported.current) {
      reported.current = true;
      reportResult({
        gameId: 'quiz-santos',
        score: score * 10,
        perfectQuiz: score === questions.length,
      });
    }
    if (phase === 'playing') reported.current = false;
  }, [phase, score, questions.length, reportResult]);

  const startWithDifficulty = useCallback((diff: Difficulty) => {
    const filtered = ALL_QUESTIONS.filter(q => q.difficulty === diff);
    setDifficulty(diff);
    setQuestions(filtered);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setPhase('playing');
  }, []);

  const handleSelect = useCallback(
    (i: number) => {
      if (selected !== null || questions.length === 0) return;
      setSelected(i);
      if (i === questions[index].correct) setScore(s => s + 1);
    },
    [selected, questions, index],
  );

  const next = useCallback(() => {
    setSelected(null);
    if (index + 1 < questions.length) {
      setIndex(i => i + 1);
    } else {
      setPhase('result');
    }
  }, [index, questions.length]);

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const medal = pct >= 80 ? '🥇' : pct >= 60 ? '🥈' : '🥉';
  const resultMsg =
    pct >= 80
      ? `Excelente! Você domina o nível ${cfg.label.toLowerCase()}!`
      : pct >= 60
        ? 'Bom trabalho! Continue aprendendo a fé católica.'
        : 'Continue estudando — cada pergunta é uma oportunidade de crescer!';

  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Quiz Católico" subtitle="CONHECIMENTO" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <Image source={require('@/assets/images/quiz.png')} style={styles.gameIcon} resizeMode="contain" />
            <ThemedText type="subtitle" style={styles.textCenter}>
              Quiz Católico
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              45 perguntas sobre doutrina, santos e história da Igreja.{'\n'}Escolha seu nível e teste o seu conhecimento!
            </ThemedText>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>ESCOLHER NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'difficulty') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Quiz Católico" subtitle="ESCOLHA O NÍVEL" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three }]}>
            <ThemedText type="subtitle" style={styles.textCenter}>Qual nível deseja jogar?</ThemedText>
            {(['facil', 'medio', 'dificil'] as Difficulty[]).map(diff => {
              const dc = DIFFICULTY_CONFIG[diff];
              return (
                <TouchableOpacity
                  key={diff}
                  style={[styles.diffBtn, { borderColor: dc.color, backgroundColor: theme.backgroundElement }]}
                  onPress={() => startWithDifficulty(diff)}
                  activeOpacity={0.8}>
                  <View style={styles.diffBtnInner}>
                    <View style={[styles.diffBadge, { backgroundColor: dc.color + '22' }]}>
                      <ThemedText style={[styles.diffBadgeText, { color: dc.color }]}>{dc.emoji} {dc.label}</ThemedText>
                    </View>
                    <ThemedText themeColor="textSecondary" style={styles.diffDesc}>{dc.desc}</ThemedText>
                    <ThemedText style={[styles.diffCount, { color: dc.color }]}>15 perguntas</ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'result') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Quiz Católico" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{medal}</ThemedText>
            <View style={[styles.diffBadge, { backgroundColor: cfg.color + '22', alignSelf: 'center' }]}>
              <ThemedText style={[styles.diffBadgeText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
            </View>
            <ThemedText type="subtitle">
              {score}/{questions.length} acertos
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {resultMsg}
            </ThemedText>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: cfg.color }]} onPress={() => startWithDifficulty(difficulty)} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>JOGAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: cfg.color }]} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={[styles.outlineBtnText, { color: cfg.color }]}>MUDAR NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const q = questions[index];
  if (!q) return null;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Quiz Católico"
          right={
            <ThemedText type="smallBold" style={{ color: cfg.color }}>
              {score} pts
            </ThemedText>
          }
        />
        <ScrollView
          contentContainerStyle={[
            styles.playScroll,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundElement }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${((index + 1) / questions.length) * 100}%`, backgroundColor: cfg.color },
              ]}
            />
          </View>
          <ThemedText themeColor="textSecondary" style={styles.progressLabel}>
            {index + 1} de {questions.length}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.topicBadge}>
            <ThemedText style={styles.topicBadgeText}>{cfg.emoji} {q.topic}</ThemedText>
          </ThemedView>

          <ThemedText style={styles.questionText}>{q.question}</ThemedText>

          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const isCorrect  = i === q.correct;
              const isSelected = i === selected;
              const revealed   = selected !== null;

              const defaultBg     = scheme === 'dark' ? theme.backgroundElement : '#FFFFFF';
              const defaultBorder = scheme === 'dark' ? C.border : 'rgba(0,0,0,0.10)';

              let bg          = defaultBg;
              let textColor   = theme.text;
              let borderColor = defaultBorder;

              if (revealed) {
                if (isCorrect)        { bg = C.green; textColor = '#fff'; borderColor = C.green; }
                else if (isSelected)  { bg = C.red;   textColor = '#fff'; borderColor = C.red; }
                else                  { textColor = theme.textSecondary; }
              }

              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelect(i)}
                  activeOpacity={0.75}
                  style={[styles.option, { backgroundColor: bg, borderColor }]}>
                  <ThemedText style={[styles.optLetter, { color: textColor }]}>
                    {String.fromCharCode(65 + i)}
                  </ThemedText>
                  <ThemedText style={[styles.optText, { color: textColor }]}>{opt}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected !== null && (
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: cfg.color }]} onPress={next} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>
                {index + 1 === questions.length ? 'VER RESULTADO' : 'PRÓXIMA →'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  textCenter: { textAlign: 'center' },
  desc: { fontSize: 15, lineHeight: 22 },
  bigEmoji: { fontSize: 64, lineHeight: 76 },
  gameIcon: { width: 96, height: 96 },
  primaryBtn: {
    backgroundColor: C.purple,
    paddingHorizontal: Spacing.five,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    marginTop: Spacing.two,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
  outlineBtn: {
    paddingHorizontal: Spacing.five,
    paddingVertical: 12,
    borderRadius: C.radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  diffBtn: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderRadius: C.radius.lg,
    overflow: 'hidden',
  },
  diffBtnInner: {
    padding: Spacing.three,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: C.radius.pill,
  },
  diffBadgeText: { fontSize: 13, fontWeight: '700' },
  diffDesc: { fontSize: 13, lineHeight: 18 },
  diffCount: { fontSize: 12, fontWeight: '600' },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 13, textAlign: 'right', marginTop: -Spacing.one },
  topicBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: C.radius.pill,
    borderWidth: 1,
    borderColor: C.border,
  },
  topicBadgeText: { fontSize: 13 },
  questionText: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  options: { gap: Spacing.two },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: C.radius.md,
    borderWidth: 1,
    gap: Spacing.two,
  },
  optLetter: { fontSize: 14, fontWeight: '700', width: 22 },
  optText: { flex: 1, fontSize: 15 },
  nextBtn: {
    padding: Spacing.three,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
});
