import React from 'react';
import { Box, Text } from 'ink';
import * as Diff from 'diff';
import type { DiffData, ThemeColors } from '@/types';

interface DiffViewProps {
  diff: DiffData;
  colors: ThemeColors;
}

export function DiffView({ diff, colors }: DiffViewProps) {
  const changes = Diff.diffLines(diff.oldContent, diff.newContent);

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
          <Box width="50%">
            {oldLine ? (
              <Box gap={1}>
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
                >
                  {oldLine.type === 'removed' ? '- ' : '  '}
                  {oldLine.content}
                </Text>
              </Box>
            ) : (
              <Text> </Text>
            )}
          </Box>
          <Box width="50%">
            {newLine ? (
              <Box gap={1}>
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
                >
                  {newLine.type === 'added' ? '+ ' : '  '}
                  {newLine.content}
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
    >
      <Box>
        <Text bold color={colors.primary}>
          📝 {diff.filePath}
        </Text>
      </Box>
      <Box marginTop={1} marginBottom={1}>
        <Box width="50%" paddingLeft={1}>
          <Text bold color={colors.error}>
            Before
          </Text>
        </Box>
        <Box width="50%" paddingLeft={1}>
          <Text bold color={colors.success}>
            After
          </Text>
        </Box>
      </Box>
      <Box flexDirection="column">{renderSideBySide()}</Box>
    </Box>
  );
}
