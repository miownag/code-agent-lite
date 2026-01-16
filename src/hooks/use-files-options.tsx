import { useMemo } from 'react';
import path from 'path';
import fs from 'fs';

export interface FileOption {
  label: string;
  value: string;
  type: 'file' | 'directory';
}

const useFilesOptions = ({
  currentPath,
}: {
  currentPath: string;
}): FileOption[] => {
  const workDir = process.cwd();
  const curDir = path.join(workDir, currentPath);

  const fileItems = useMemo(() => {
    try {
      if (!fs.existsSync(curDir)) {
        return [];
      }

      const entries = fs.readdirSync(curDir, { withFileTypes: true });

      const options: FileOption[] = entries
        .filter((entry) => !entry.name.startsWith('.'))
        .map((entry) => ({
          label: entry.isDirectory() ? `${entry.name}/` : entry.name,
          value: `${path.join(currentPath, entry.name)}${entry.isDirectory() ? '/' : ''}`,
          type: entry.isDirectory()
            ? ('directory' as const)
            : ('file' as const),
        }))
        .sort((a, b) => {
          if (a.type === b.type) {
            return a.label.localeCompare(b.label);
          }
          return a.type === 'directory' ? -1 : 1;
        });

      return options;
    } catch {
      return [];
    }
  }, [curDir, currentPath]);

  return fileItems;
};

export default useFilesOptions;
