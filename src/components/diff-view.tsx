import React from 'react';
import { Box, Text } from 'ink';
import * as Diff from 'diff';
import type { DiffData, ThemeColors } from '@/types';
import useSafeWidth from '@/hooks/use-safe-width';

interface DiffViewProps {
  diff: DiffData;
  colors: ThemeColors;
}

// Truncate text to fit within max width
const truncateLine = (text: string, maxWidth: number): string => {
  if (text.length <= maxWidth) return text;
  return text.slice(0, maxWidth - 3) + '...';
};

export function DiffView({ diff, colors }: DiffViewProps) {
  const safeWidth = useSafeWidth(4); // Reserve 4 chars for borders/padding
  const changes = Diff.diffLines(diff.oldContent, diff.newContent);

  // Calculate widths for side-by-side view
  // Total width minus divider space, split between two sides
  const totalWidth = safeWidth ?? 80;
  const halfWidth = Math.floor((totalWidth - 2) / 2); // -2 for borders
  // Line number takes 4 chars (3 digits + 1 space), prefix takes 2 chars
  const contentWidth = halfWidth - 6;

  const renderSideBySide = () => {
    const oldLines: Array<{ lineNum: number; content: string; type: string }> =
      [];
    const newLines: Array<{ lineNum: number; content: string; type: string }> =
      [];

    let oldLineNum = 1;
    let newLineNum = 1;

    for (const change of changes) {
      const lines = change.value.split('\n').filter((line, idx, arr) => {
        return idx < arr.length - 1 || line !== '';
      });

      if (change.added) {
        for (const line of lines) {
          newLines.push({
            lineNum: newLineNum++,
            content: line,
            type: 'added',
          });
        }
      } else if (change.removed) {
        for (const line of lines) {
          oldLines.push({
            lineNum: oldLineNum++,
            content: line,
            type: 'removed',
          });
        }
      } else {
        for (const line of lines) {
          oldLines.push({
            lineNum: oldLineNum++,
            content: line,
            type: 'unchanged',
          });
          newLines.push({
            lineNum: newLineNum++,
            content: line,
            type: 'unchanged',
          });
        }
      }
    }

    const maxLines = Math.max(oldLines.length, newLines.length);
    const rows: React.ReactNode[] = [];

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      rows.push(
        <Box key={i}>
          <Box width={halfWidth} overflow="hidden">
            {oldLine ? (
              <Box gap={1} flexWrap="nowrap">
                <Text color={colors.muted} dimColor>
                  {oldLine.lineNum.toString().padStart(3)}
                </Text>
                <Text
                  color={
                    oldLine.type === 'removed' ? colors.error : colors.text
                  }
                  backgroundColor={
                    oldLine.type === 'removed' ? '#3D0000' : undefined
                  }
                  wrap="truncate"
                >
                  {oldLine.type === 'removed' ? '- ' : '  '}
                  {truncateLine(oldLine.content, contentWidth)}
                </Text>
              </Box>
            ) : (
              <Text> </Text>
            )}
          </Box>
          <Box width={halfWidth} overflow="hidden">
            {newLine ? (
              <Box gap={1} flexWrap="nowrap">
                <Text color={colors.muted} dimColor>
                  {newLine.lineNum.toString().padStart(3)}
                </Text>
                <Text
                  color={
                    newLine.type === 'added' ? colors.success : colors.text
                  }
                  backgroundColor={
                    newLine.type === 'added' ? '#003D00' : undefined
                  }
                  wrap="truncate"
                >
                  {newLine.type === 'added' ? '+ ' : '  '}
                  {truncateLine(newLine.content, contentWidth)}
                </Text>
              </Box>
            ) : (
              <Text> </Text>
            )}
          </Box>
        </Box>,
      );
    }

    return rows;
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
      marginY={0}
      paddingBottom={1}
      width={totalWidth}
    >
      <Box overflow="hidden">
        <Text bold color={colors.primary} wrap="truncate">
          📝 {truncateLine(diff.filePath, totalWidth - 6)}
        </Text>
      </Box>
      <Box marginTop={1} marginBottom={1}>
        <Box width={halfWidth} paddingLeft={1}>
          <Text bold color={colors.error}>
            Before
          </Text>
        </Box>
        <Box width={halfWidth} paddingLeft={1}>
          <Text bold color={colors.success}>
            After
          </Text>
        </Box>
      </Box>
      <Box flexDirection="column">{renderSideBySide()}</Box>
    </Box>
  );
}
