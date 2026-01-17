import { Text } from 'ink';
import { useEffect, useRef, useState } from 'react';
import { ShimmerText } from './shimmer-text';

const TypeWriter = ({
  text,
  speed = 100,
  loop = false,
  textColor = 'white',
  textBold = false,
  shimmer = false,
}: {
  text: string;
  speed?: number;
  loop?: boolean;
  textColor?: string;
  textBold?: boolean;
  shimmer?: boolean;
}) => {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        if (prevIndex >= text.length) {
          return loop ? 0 : prevIndex;
        }
        return prevIndex + 1;
      });
    }, speed);

    intervalRef.current = interval;

    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, [speed, loop, text]);

  useEffect(() => {
    if (index >= text.length && !loop && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [index, text.length, loop]);

  // empty string to layout the space
  const showText = index > 0 ? text.slice(0, index) : ' ';

  return (
    <Text color={textColor} bold={textBold}>
      {shimmer ? (
        <ShimmerText bold={textBold}>{showText}</ShimmerText>
      ) : (
        showText
      )}
    </Text>
  );
};

export default TypeWriter;
