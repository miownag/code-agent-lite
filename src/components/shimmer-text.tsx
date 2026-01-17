import useTheme from '@/hooks/use-theme';
import { Text } from 'ink';
import { useEffect, useState } from 'react';

interface ShimmerTextProps {
  children: string;
  colors?: string[];
  speed?: number;
  bold?: boolean;
}

export function ShimmerText({
  children,
  colors,
  bold = false,
  speed = 100,
}: ShimmerTextProps) {
  const [colorIndex, setColorIndex] = useState(0);
  const { colors: crs } = useTheme();
  const finalColors = colors?.length ? colors : crs.shimmer;

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % finalColors.length);
    }, speed);

    return () => {
      clearInterval(interval);
    };
  }, [finalColors.length, speed]);

  return (
    <Text color={finalColors[colorIndex]} bold={bold}>
      {children}
    </Text>
  );
}
