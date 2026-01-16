import { useStdout } from 'ink';
import { useEffect, useState } from 'react';

const useSafeWidth = () => {
  const { stdout } = useStdout();
  const [safeWidth, setSafeWidth] = useState<number | undefined>(() => {
    const columns = stdout.columns;
    return typeof columns === 'number' ? Math.max(1, columns - 1) : undefined;
  });

  useEffect(() => {
    const columns = stdout.columns;
    if (typeof columns === 'number') {
      setSafeWidth(Math.max(1, columns - 1));
    }

    const handleResize = () => {
      const nextColumns = stdout.columns;
      if (typeof nextColumns === 'number') {
        setSafeWidth(Math.max(1, nextColumns - 1));
      }
    };

    stdout.on('resize', handleResize);
    return () => {
      if (typeof stdout.off === 'function') {
        stdout.off('resize', handleResize);
      } else {
        stdout.removeListener('resize', handleResize);
      }
    };
  }, [stdout]);

  return safeWidth;
};

export default useSafeWidth;
