import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeLiturgQuestions } from '@/hooks/use-game-packs';

type Difficulty = 'facil' | 'medio' | 'dificil';
type Phase = 'idle' | 'difficulty' | 'playing' | 'result';

interface LiturgQuestion {
  question: string;
  options: string[];
  correct: number;
  hint: string;
  difficulty: Difficulty;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; emoji: string; desc: string; time: number }> = {
  facil:   { label: 'Fácil',   color: C.green, emoji: '🌿', desc: 'Cores, tempos e sacramentos básicos', time: 90 },
  medio:   { label: 'Médio',   color: C.gold,  emoji: '✝️', desc: 'Semana Santa, ritos e datas litúrgicas', time: 75 },
  dificil: { label: 'Difícil', color: C.red,   emoji: '📿', desc: 'Preces, Triduum, história e documentos', time: 60 },
};

const ALL_QUESTIONS: LiturgQuestion[] = [
  // ── FÁCIL ───────────────────────────────────────────────────────────────────
  {
    question: 'Qual é a cor litúrgica do Tempo do Advento?',
    options: ['Branco/Dourado', 'Vermelho', 'Roxo (Violeta)', 'Verde'],
    correct: 2,
    hint: 'Tempo de penitência, espera e conversão.',
    difficulty: 'facil',
  },
  {
    question: 'Qual é a cor litúrgica do Tempo de Natal?',
    options: ['Vermelho', 'Branco/Dourado', 'Roxo', 'Verde'],
    correct: 1,
    hint: 'Celebração e alegria pelo nascimento do Senhor.',
    difficulty: 'facil',
  },
  {
    question: 'Qual é a cor litúrgica da Quaresma?',
    options: ['Branco', 'Verde', 'Azul', 'Roxo (Violeta)'],
    correct: 3,
    hint: '40 dias de jejum, oração e conversão.',
    difficulty: 'facil',
  },
  {
    question: 'Qual é a cor litúrgica do Tempo Pascal (Páscoa)?',
    options: ['Vermelho', 'Roxo', 'Verde', 'Branco/Dourado'],
    correct: 3,
    hint: 'Ressurreição, glória e alegria do Cristo vivo.',
    difficulty: 'facil',
  },
  {
    question: 'Qual é a cor litúrgica do Tempo Comum?',
    options: ['Azul', 'Verde', 'Branco', 'Amarelo'],
    correct: 1,
    hint: 'Crescimento e esperança na caminhada da fé.',
    difficulty: 'facil',
  },
  {
    question: 'Qual é a cor usada em Pentecostes e nas festas de mártires?',
    options: ['Roxo', 'Laranja', 'Vermelho', 'Dourado'],
    correct: 2,
    hint: 'Fogo do Espírito Santo e sangue dos mártires.',
    difficulty: 'facil',
  },
  {
    question: 'Quantos sacramentos existem na Igreja Católica?',
    options: ['5', '6', '7', '10'],
    correct: 2,
    hint: 'Batismo, Crisma, Eucaristia, Confissão, Unção, Ordem e Matrimônio.',
    difficulty: 'facil',
  },
  {
    question: 'Qual é o primeiro sacramento da iniciação cristã?',
    options: ['Eucaristia', 'Crisma', 'Batismo', 'Penitência'],
    correct: 2,
    hint: 'Por ele nascemos para a vida em Cristo.',
    difficulty: 'facil',
  },
  {
    question: 'Qual período litúrgico precede diretamente a Páscoa?',
    options: ['Advento', 'Natal', 'Quaresma', 'Pentecostes'],
    correct: 2,
    hint: 'Quarenta dias de preparação para a maior festa cristã.',
    difficulty: 'facil',
  },
  {
    question: 'A Solenidade de Corpus Christi celebra o quê?',
    options: ['A Ressurreição', 'A Eucaristia', 'O Espírito Santo', 'A Natividade'],
    correct: 1,
    hint: '"Corpo de Cristo" em latim — o Santíssimo Sacramento.',
    difficulty: 'facil',
  },
  {
    question: 'Qual é a maior festa do ano litúrgico?',
    options: ['Natal', 'Páscoa', 'Pentecostes', 'Corpus Christi'],
    correct: 1,
    hint: 'A festa das festas — a Ressurreição do Senhor.',
    difficulty: 'facil',
  },
  {
    question: 'Em que dia da semana a Igreja celebra o Dia do Senhor?',
    options: ['Sexta-feira', 'Sábado', 'Domingo', 'Segunda-feira'],
    correct: 2,
    hint: 'Dia em que Cristo ressuscitou dos mortos.',
    difficulty: 'facil',
  },
  {
    question: 'Qual é o sacramento celebrado na Missa?',
    options: ['Batismo', 'Crisma', 'Eucaristia', 'Matrimônio'],
    correct: 2,
    hint: 'Fonte e cume de toda a vida cristã.',
    difficulty: 'facil',
  },
  {
    question: 'Qual sacramento fortalece a fé e concede o dom pleno do Espírito Santo?',
    options: ['Batismo', 'Eucaristia', 'Crisma', 'Penitência'],
    correct: 2,
    hint: 'Sacramento da confirmação e maturidade na fé.',
    difficulty: 'facil',
  },
  {
    question: 'O Advento é um tempo de preparação para qual festa?',
    options: ['Páscoa', 'Pentecostes', 'Natal', 'Corpus Christi'],
    correct: 2,
    hint: 'Espera pela vinda do Senhor — Deus que se fez homem.',
    difficulty: 'facil',
  },

  // ── MÉDIO ───────────────────────────────────────────────────────────────────
  {
    question: 'Quantas semanas dura o Tempo do Advento?',
    options: ['2', '3', '4', '6'],
    correct: 2,
    hint: 'Quatro domingos de espera e preparação.',
    difficulty: 'medio',
  },
  {
    question: 'Quando começa o ano litúrgico católico?',
    options: ['1º de janeiro', 'No primeiro Domingo do Advento', 'Na Quarta-feira de Cinzas', 'No Domingo de Páscoa'],
    correct: 1,
    hint: 'O ano litúrgico abre com a espera pelo Senhor.',
    difficulty: 'medio',
  },
  {
    question: 'Em qual dia da Semana Santa se celebra a Última Ceia do Senhor?',
    options: ['Quarta-feira', 'Quinta-feira Santa', 'Sexta-feira Santa', 'Sábado Santo'],
    correct: 1,
    hint: 'Instituição da Eucaristia e do sacerdócio ministerial.',
    difficulty: 'medio',
  },
  {
    question: 'Em qual dia se celebra liturgicamente a morte de Jesus na Cruz?',
    options: ['Quarta-feira de Cinzas', 'Quinta-feira Santa', 'Sexta-feira Santa', 'Sábado Santo'],
    correct: 2,
    hint: 'Via Sacra, adoração da Cruz e silêncio.',
    difficulty: 'medio',
  },
  {
    question: 'O que caracteriza o Sábado Santo na liturgia?',
    options: ['A morte de Cristo é celebrada', 'Silêncio e vigília antes da Ressurreição', 'A Ceia do Senhor é renovada', 'A vinda do Espírito Santo'],
    correct: 1,
    hint: 'O dia em que Cristo jaz no sepulcro — a grande vigília pascal.',
    difficulty: 'medio',
  },
  {
    question: 'O que é o "Tempo Pascal"?',
    options: ['Os 40 dias da Quaresma', 'Os 50 dias após a Páscoa até Pentecostes', 'O período do Natal ao Batismo do Senhor', 'A Semana Santa'],
    correct: 1,
    hint: 'Cinquenta dias de Aleluia — da Ressurreição ao Espírito Santo.',
    difficulty: 'medio',
  },
  {
    question: 'Em que período litúrgico se suprime o "Aleluia"?',
    options: ['Advento', 'Quaresma', 'Tempo Comum', 'Tempo Pascal'],
    correct: 1,
    hint: 'Tempo de sobriedade — o Aleluia retorna triunfalmente na Páscoa.',
    difficulty: 'medio',
  },
  {
    question: 'Qual é a cor litúrgica especial do 3º Domingo do Advento (Gaudete)?',
    options: ['Roxo', 'Vermelho', 'Rosa', 'Azul'],
    correct: 2,
    hint: '"Gaudete" — Alegrai-vos! Domingo de alegria no meio da penitência.',
    difficulty: 'medio',
  },
  {
    question: 'Qual é o nome do livro litúrgico que contém as orações do sacerdote na Missa?',
    options: ['Breviário', 'Missal Romano', 'Saltério', 'Evangeliário'],
    correct: 1,
    hint: 'Livro fundamental que guia toda a celebração eucarística.',
    difficulty: 'medio',
  },
  {
    question: 'Em qual solenidade se comemora a vinda do Espírito Santo sobre os Apóstolos?',
    options: ['Natal', 'Ascensão', 'Pentecostes', 'Corpus Christi'],
    correct: 2,
    hint: 'Cinquenta dias após a Páscoa — nascimento da Igreja.',
    difficulty: 'medio',
  },
  {
    question: 'O que é a "Quarta-feira de Cinzas"?',
    options: ['Início da Semana Santa', 'Início da Quaresma com imposição de cinzas', 'Encerramento do Advento', 'Vigília pascal'],
    correct: 1,
    hint: '"Lembra-te de que és pó e ao pó voltarás."',
    difficulty: 'medio',
  },
  {
    question: 'A primeira leitura da Missa é geralmente retirada de qual parte da Bíblia?',
    options: ['Novo Testamento', 'Antigo Testamento', 'Evangelho', 'Atos dos Apóstolos'],
    correct: 1,
    hint: 'A Liturgia da Palavra começa com a história da salvação.',
    difficulty: 'medio',
  },
  {
    question: 'O "Pai Nosso" é rezado em qual parte da Missa?',
    options: ['Na abertura', 'Após o Evangelho', 'Antes da Comunhão', 'No encerramento'],
    correct: 2,
    hint: 'Preparação final para receber o Corpo de Cristo.',
    difficulty: 'medio',
  },
  {
    question: 'Qual solenidade mariana é celebrada em 15 de agosto?',
    options: ['Imaculada Conceição', 'Nossa Senhora de Fátima', 'Assunção de Maria', 'Maternidade de Maria'],
    correct: 2,
    hint: 'Maria foi elevada ao Céu em corpo e alma.',
    difficulty: 'medio',
  },
  {
    question: 'O "Tempo Comum" ocorre em quantos períodos no ano litúrgico?',
    options: ['Um', 'Dois', 'Três', 'Quatro'],
    correct: 1,
    hint: 'Um após o Natal e outro após Pentecostes.',
    difficulty: 'medio',
  },

  // ── DIFÍCIL ─────────────────────────────────────────────────────────────────
  {
    question: 'Em que Concílio foi permitida a Missa em vernáculo (língua local)?',
    options: ['Concílio de Trento', 'Concílio de Niceia', 'Concílio Vaticano II', 'Concílio de Calcedônia'],
    correct: 2,
    hint: 'Reforma litúrgica do século XX que abriu a Igreja ao mundo.',
    difficulty: 'dificil',
  },
  {
    question: 'O "Triduum Pascal" compreende quais dias sagrados?',
    options: ['Domingo de Ramos a Domingo de Páscoa', 'Quinta-feira Santa, Sexta-feira Santa e Vigília Pascal', 'Quarta-feira de Cinzas a Sábado Santo', 'Sexta-feira Santa a Segunda-feira de Páscoa'],
    correct: 1,
    hint: 'O coração do ano litúrgico — os três dias que mudam tudo.',
    difficulty: 'dificil',
  },
  {
    question: 'Como se chama a invocação do Espírito Santo sobre os dons eucarísticos na Missa?',
    options: ['Doxologia', 'Anamnese', 'Epiclese', 'Prefácio'],
    correct: 2,
    hint: 'Do grego "epiklesis" — invocar sobre. Pede a transformação do pão e do vinho.',
    difficulty: 'dificil',
  },
  {
    question: 'O "Sanctus" ("Santo, Santo, Santo...") pertence a qual parte da Missa?',
    options: ['Rito de abertura', 'Liturgia da Palavra', 'Prefácio da Prece Eucarística', 'Rito de Comunhão'],
    correct: 2,
    hint: 'Canto de louvor que une a Igreja ao coro dos anjos.',
    difficulty: 'dificil',
  },
  {
    question: 'Quantos anos dura o ciclo de leituras dominicais (Anos A, B e C)?',
    options: ['2', '3', '4', '7'],
    correct: 1,
    hint: 'Ano A: Mateus · Ano B: Marcos · Ano C: Lucas.',
    difficulty: 'dificil',
  },
  {
    question: 'Como se chama o pano branco sobre o qual repousam o cálice e a patena durante a Missa?',
    options: ['Purificador', 'Pala', 'Corporal', 'Véu do cálice'],
    correct: 2,
    hint: 'Simboliza o sudário que envolveu o Corpo de Cristo.',
    difficulty: 'dificil',
  },
  {
    question: 'Em qual parte da Missa se proclama o Evangelho?',
    options: ['Liturgia Eucarística', 'Liturgia da Palavra', 'Rito de Abertura', 'Rito de Envio'],
    correct: 1,
    hint: 'A assembleia fica de pé em honra ao Senhor que fala.',
    difficulty: 'dificil',
  },
  {
    question: 'Qual é o nome da mais antiga Prece Eucarística da Missa romana?',
    options: ['Prece Eucarística II', 'Cânon Romano (Prece Eucarística I)', 'Prece Eucarística III', 'Prece Eucarística IV'],
    correct: 1,
    hint: 'Remonta ao século IV — patrimônio precioso da liturgia latina.',
    difficulty: 'dificil',
  },
  {
    question: 'O que é a "Anamnese" na Missa?',
    options: ['Oração de abertura da Missa', 'Oração do Ofertório', 'Memorial proclamado após a Consagração', 'Cântico de encerramento'],
    correct: 2,
    hint: '"Anunciamos a vossa morte, proclamamos a vossa ressurreição..."',
    difficulty: 'dificil',
  },
  {
    question: 'Qual solenidade é celebrada no domingo imediatamente após Pentecostes?',
    options: ['Corpus Christi', 'Sagrado Coração de Jesus', 'Santíssima Trindade', 'Cristo Rei'],
    correct: 2,
    hint: 'Mistério central da fé cristã — Pai, Filho e Espírito Santo.',
    difficulty: 'dificil',
  },
  {
    question: 'O que contém o "Lecionário"?',
    options: ['As orações do sacerdote na Missa', 'As leituras bíblicas para as Missas', 'Os Salmos da Liturgia das Horas', 'Os rituais dos sacramentos'],
    correct: 1,
    hint: 'Da Escritura proclamada nasce a homilia e a fé do povo.',
    difficulty: 'dificil',
  },
  {
    question: 'Qual é o nome do rito pelo qual o sacerdote lava as mãos durante o Ofertório?',
    options: ['Ablução', 'Lavabo', 'Purificação', 'Aspersão'],
    correct: 1,
    hint: '"Lavai-me da minha culpa, purificai-me do meu pecado" (Salmo 51).',
    difficulty: 'dificil',
  },
  {
    question: 'A "Liturgia das Horas" é composta por quantas Horas canônicas?',
    options: ['3', '5', '7', '12'],
    correct: 2,
    hint: 'Laudes, Terça, Sexta, Nona, Vésperas, Completas... santificando todo o dia.',
    difficulty: 'dificil',
  },
  {
    question: 'Qual é o nome do último domingo do ano litúrgico?',
    options: ['Domingo de Cristo Rei', 'Último Domingo do Advento', 'Domingo após Pentecostes', 'Festa de Todos os Santos'],
    correct: 0,
    hint: 'O ano litúrgico se fecha com a solenidade do Reinado de Cristo.',
    difficulty: 'dificil',
  },
  {
    question: 'Como se chama a parte da Missa em que o pão e o vinho se tornam o Corpo e Sangue de Cristo?',
    options: ['Ofertório', 'Consagração', 'Comunhão', 'Pós-comunhão'],
    correct: 1,
    hint: 'Pelas palavras da instituição, Cristo se faz realmente presente.',
    difficulty: 'dificil',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleQuestion(q: LiturgQuestion): LiturgQuestion {
  const correctAnswer = q.options[q.correct];
  const shuffled = shuffle(q.options);
  return { ...q, options: shuffled, correct: shuffled.indexOf(correctAnswer) };
}

export default function DesafioLiturgicoScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const { packs } = useGamePacks('liturgico');
  const [phase, setPhase] = useState<Phase>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [questions, setQuestions] = useState<LiturgQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reported = useRef(false);
  const finalTimeRef = useRef(60);

  const cfg = DIFFICULTY_CONFIG[difficulty];

  useEffect(() => {
    if (phase === 'result' && !reported.current) {
      reported.current = true;
      reportResult({
        gameId: 'desafio-liturgico',
        score: score * 10,
        liturgyTimeLeft: finalTimeRef.current,
      });
    }
    if (phase === 'playing') {
      reported.current = false;
      finalTimeRef.current = cfg.time;
    }
  }, [phase, score, cfg.time, reportResult]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const endGame = useCallback((remainingTime?: number) => {
    stopTimer();
    if (remainingTime !== undefined) finalTimeRef.current = remainingTime;
    setPhase('result');
  }, [stopTimer]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { endGame(0); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, endGame, stopTimer]);

  const startWithDifficulty = useCallback((diff: Difficulty) => {
    const totalTime = DIFFICULTY_CONFIG[diff].time;
    const allQ = mergeLiturgQuestions(ALL_QUESTIONS, packs);
    const filtered = shuffle(allQ.filter(q => q.difficulty === diff)).map(shuffleQuestion);
    setDifficulty(diff);
    setQuestions(filtered);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setTimeLeft(totalTime);
    finalTimeRef.current = totalTime;
    setPhase('playing');
  }, []);

  const q = questions[index];

  const handleSelect = useCallback(
    (i: number) => {
      if (!q || selected !== null) return;
      setSelected(i);
      if (i === q.correct) setScore(s => s + 1);
    },
    [selected, q],
  );

  const next = useCallback(() => {
    setSelected(null);
    if (index + 1 < questions.length) { setIndex(ix => ix + 1); }
    else { endGame(timeLeft); }
  }, [index, questions.length, timeLeft, endGame]);

  const timerPct = questions.length > 0 ? (timeLeft / cfg.time) * 100 : 100;
  const timerColor = timeLeft > cfg.time * 0.33 ? C.green : timeLeft > cfg.time * 0.17 ? C.gold : C.red;

  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Desafio Litúrgico" subtitle="LITURGIA" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <Image source={require('@/assets/images/desafio_calendário_liturgico.png')} style={styles.gameIcon} resizeMode="contain" />
            <ThemedText type="subtitle" style={styles.textCenter}>Desafio Litúrgico</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              45 questões sobre o calendário litúrgico.{'\n'}Escolha o nível e teste seu conhecimento!
            </ThemedText>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>ESCOLHER NÍVEL</ThemedText>
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
          <GameHeader title="Desafio Litúrgico" subtitle="ESCOLHA O NÍVEL" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three }]}>
            <ThemedText type="subtitle" style={styles.textCenter}>Qual nível deseja jogar?</ThemedText>
            {(['facil', 'medio', 'dificil'] as Difficulty[]).map(diff => {
              const dc = DIFFICULTY_CONFIG[diff];
              return (
                <TouchableOpacity
                  key={diff}
                  style={[styles.diffBtn, { borderColor: dc.color }]}
                  onPress={() => startWithDifficulty(diff)}
                  activeOpacity={0.8}>
                  <ThemedView type="backgroundElement" style={styles.diffBtnInner}>
                    <View style={[styles.diffBadge, { backgroundColor: dc.color + '22' }]}>
                      <ThemedText style={[styles.diffBadgeText, { color: dc.color }]}>{dc.emoji} {dc.label}</ThemedText>
                    </View>
                    <ThemedText themeColor="textSecondary" style={styles.diffDesc}>{dc.desc}</ThemedText>
                    <ThemedText style={[styles.diffCount, { color: dc.color }]}>15 questões · ⏱ {dc.time}s</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'result') {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const medal = pct >= 80 ? '🏆' : pct >= 50 ? '✝️' : '📿';
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Desafio Litúrgico" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{medal}</ThemedText>
            <View style={[styles.diffBadge, { backgroundColor: cfg.color + '22', alignSelf: 'center' }]}>
              <ThemedText style={[styles.diffBadgeText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
            </View>
            <ThemedText type="subtitle">{score}/{questions.length} acertos</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {pct >= 80 ? 'Excelente! Você domina a liturgia!' : pct >= 50 ? 'Bom resultado! Continue aprendendo.' : 'Estude mais sobre o calendário litúrgico!'}
            </ThemedText>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: cfg.color }]} onPress={() => startWithDifficulty(difficulty)} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>JOGAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: cfg.color }]} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={[styles.outlineBtnText, { color: cfg.color }]}>MUDAR NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!q) return null;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Desafio Litúrgico"
          right={
            <ThemedText type="smallBold" style={{ color: timerColor, fontSize: 18 }}>
              {timeLeft}s
            </ThemedText>
          }
        />
        <ScrollView
          contentContainerStyle={[
            styles.playScroll,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}>
          <View style={[styles.timerBar, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.timerFill, { width: `${timerPct}%`, backgroundColor: timerColor }]} />
          </View>
          <View style={styles.progressRow}>
            <ThemedText themeColor="textSecondary" style={styles.smallText}>
              {index + 1}/{questions.length}
            </ThemedText>
            <View style={[styles.diffBadge, { backgroundColor: cfg.color + '22' }]}>
              <ThemedText style={[styles.diffBadgeSmall, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
            </View>
            <ThemedText style={{ color: cfg.color, fontWeight: '600', fontSize: 13 }}>
              {score} acertos
            </ThemedText>
          </View>
          <ThemedText style={styles.questionText}>{q.question}</ThemedText>
          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const revealed = selected !== null;
              const isCorrect = i === q.correct;
              const isSelected = i === selected;
              let bg: string = theme.backgroundElement;
              let textColor: string = theme.text;
              let borderColor: string = C.border;
              if (revealed) {
                if (isCorrect) { bg = C.green; textColor = '#fff'; borderColor = C.green; }
                else if (isSelected) { bg = C.red; textColor = '#fff'; borderColor = C.red; }
              }
              return (
                <TouchableOpacity
                  key={i}
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
            <>
              <ThemedView type="backgroundElement" style={styles.hintBox}>
                <ThemedText themeColor="textSecondary" style={styles.hintLabel}>💡 DICA</ThemedText>
                <ThemedText style={styles.hintText}>{q.hint}</ThemedText>
              </ThemedView>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: cfg.color }]} onPress={next} activeOpacity={0.8}>
                <ThemedText style={styles.btnText}>
                  {index + 1 === questions.length ? 'VER RESULTADO' : 'PRÓXIMA →'}
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
  textCenter: { textAlign: 'center' },
  bigEmoji: { fontSize: 64, lineHeight: 76 },
  gameIcon: { width: 96, height: 96 },
  desc: { fontSize: 15, lineHeight: 22 },
  primaryBtn: {
    backgroundColor: C.red,
    paddingHorizontal: Spacing.five,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: Spacing.one,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
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
  diffBtnInner: { padding: Spacing.three, gap: Spacing.one },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: C.radius.pill,
  },
  diffBadgeText: { fontSize: 13, fontWeight: '700' },
  diffBadgeSmall: { fontSize: 11, fontWeight: '700' },
  diffDesc: { fontSize: 13, lineHeight: 18 },
  diffCount: { fontSize: 12, fontWeight: '600' },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  timerBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: 8, borderRadius: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -Spacing.one },
  smallText: { fontSize: 13 },
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
  hintBox: {
    borderRadius: C.radius.md,
    padding: Spacing.three,
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  hintLabel: { fontSize: 11, letterSpacing: 1.1 },
  hintText: { fontSize: 14, fontStyle: 'italic' },
});
