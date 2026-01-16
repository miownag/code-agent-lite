import { Box, Text } from 'ink';

const AlignedCombinedEmoji = ({
  emoji,
  text,
  color,
  bold = false,
}: {
  emoji: string;
  text: string;
  color?: string;
  bold?: boolean;
}) => {
  const separator = '\u00A0';

  return (
    <Box>
      <Text bold={bold} color={color}>
        {emoji}
        {separator}
      </Text>
      <Text bold={bold} color={color}>
        {text}
      </Text>
    </Box>
  );
};

export default AlignedCombinedEmoji;
