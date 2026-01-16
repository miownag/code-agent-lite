import { Box, Text } from 'ink';
import { ShimmerText } from './shimmer-text';

const AlignedCombinedEmoji = ({
  emoji,
  text,
  color,
  bold = false,
  shimmer = false,
}: {
  emoji: string;
  text: string;
  color?: string;
  bold?: boolean;
  shimmer?: boolean;
}) => {
  const separator = '\u00A0';

  return (
    <Box>
      <Text bold={bold} color={color}>
        {emoji}
        {separator}
      </Text>
      {shimmer ? (
        <ShimmerText>{text}</ShimmerText>
      ) : (
        <Text bold={bold} color={color}>
          {text}
        </Text>
      )}
    </Box>
  );
};

export default AlignedCombinedEmoji;
