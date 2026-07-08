import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { C } from '@/constants/theme';
import type { Tema } from '@/constants/teste-conhecimento';

interface RadarChartProps {
  temas:  Tema[];
  // Valores 0-100, na mesma ordem de `temas`.
  valores: number[];
  size?:  number;
}

const ANEIS = [1 / 3, 2 / 3, 1];

function ponto(cx: number, cy: number, raio: number, indice: number, total: number) {
  const angulo = (Math.PI * 2 * indice) / total - Math.PI / 2;
  return { x: cx + raio * Math.cos(angulo), y: cy + raio * Math.sin(angulo) };
}

function poligono(cx: number, cy: number, raio: number, total: number, escala = 1) {
  return Array.from({ length: total })
    .map((_, i) => { const p = ponto(cx, cy, raio * escala, i, total); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; })
    .join(' ');
}

// Radar SVG que anima de 0 até os valores reais em 800ms ao montar — usa
// Animated (useNativeDriver: false, já que "points" do SVG não é uma
// propriedade suportada pelo native driver) e um listener pra recalcular o
// polígono em estado comum a cada tick, em vez de interpolar a string direto.
export function RadarChart({ temas, valores, size = 260 }: RadarChartProps) {
  const [progresso, setProgresso] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = anim.addListener(({ value }) => setProgresso(value));
    Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [anim]);

  const cx = size / 2;
  const cy = size / 2;
  const raioMax = size / 2 - 34;
  const total = temas.length;

  const pontosDados = valores
    .map((v, i) => { const p = ponto(cx, cy, raioMax * (Math.max(0, Math.min(100, v)) / 100) * progresso, i, total); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; })
    .join(' ');

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {ANEIS.map(escala => (
          <Polygon
            key={escala}
            points={poligono(cx, cy, raioMax, total, escala)}
            fill="none"
            stroke={C.border}
            strokeWidth={1}
          />
        ))}
        {temas.map((_, i) => {
          const p = ponto(cx, cy, raioMax, i, total);
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.border} strokeWidth={1} />;
        })}
        <Polygon points={pontosDados} fill="rgba(83,74,183,0.25)" stroke={C.purple} strokeWidth={2} />
      </Svg>

      {temas.map((tema, i) => {
        const p = ponto(cx, cy, raioMax + 18, i, total);
        return (
          <View key={tema.id} style={[styles.label, { left: p.x - 22, top: p.y - 12 }]}>
            <ThemedText style={{ fontSize: 16 }}>{tema.icone}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', width: 44, height: 24, alignItems: 'center', justifyContent: 'center' },
});
