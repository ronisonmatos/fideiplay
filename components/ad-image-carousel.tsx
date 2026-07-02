import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  images: string[];
  dotsBottomOffset?: number;
}

export function AdImageCarousel({ images, dotsBottomOffset = 130 }: Props) {
  const [index, setIndex]  = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(images.length - 1, next));
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    setIndex(clamped);
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(Math.max(0, Math.min(images.length - 1, i)));
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${i}-${uri}`}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width: SCREEN_W, height: '100%' }} resizeMode="contain" />
        )}
      />

      {/* Setas discretas — só aparecem quando há próxima/anterior */}
      {index > 0 && (
        <TouchableOpacity
          style={[s.arrow, s.arrowLeft]}
          onPress={() => goTo(index - 1)}
          activeOpacity={0.7}
          hitSlop={10}>
          <ThemedText style={s.arrowText}>‹</ThemedText>
        </TouchableOpacity>
      )}
      {index < images.length - 1 && (
        <TouchableOpacity
          style={[s.arrow, s.arrowRight]}
          onPress={() => goTo(index + 1)}
          activeOpacity={0.7}
          hitSlop={10}>
          <ThemedText style={s.arrowText}>›</ThemedText>
        </TouchableOpacity>
      )}

      {/* Bolinhas de posição */}
      <View style={[s.dots, { bottom: dotsBottomOffset }]} pointerEvents="none">
        {images.map((_, i) => (
          <View key={i} style={[s.dot, i === index && s.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  arrowLeft:  { left: 10 },
  arrowRight: { right: 10 },
  arrowText:  { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: -2 },

  dots: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    zIndex: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
});
