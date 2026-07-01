import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { getAvatarUrl, isSaintAvatar } from '@/constants/avatares';

interface AvatarImageProps {
  value: string;
  size?: number;
  borderColor?: string;
}

export function AvatarImage({ value, size = 56, borderColor }: AvatarImageProps) {
  const style = [
    s.circle,
    { width: size, height: size, borderRadius: size / 2 },
    borderColor ? { borderWidth: 2.5, borderColor } : undefined,
  ];

  if (isSaintAvatar(value)) {
    return (
      <View style={style}>
        <ExpoImage
          source={{ uri: getAvatarUrl(value) }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <Text style={{ fontSize: size * 0.5, lineHeight: size }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
