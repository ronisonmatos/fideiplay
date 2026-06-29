import { Image, StyleSheet, Text, View } from 'react-native';
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
        <Image
          source={{ uri: getAvatarUrl(value) }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <Text style={{ fontSize: size * 0.5, lineHeight: size * 0.65 }}>{value}</Text>
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
