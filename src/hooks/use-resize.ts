import { useStdout } from 'ink';
import { useEffect } from 'react';

const useResize = (callback: () => void) => {
  const { stdout } = useStdout();

  useEffect(() => {
    stdout.addListener('resize', callback);

    return () => {
      stdout.removeListener('resize', callback);
    };
  }, [stdout, callback]);

  return {
    stdout,
  };
};

export default useResize;
