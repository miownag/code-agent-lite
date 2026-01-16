#!/usr/bin/env node
import { render } from 'ink';
import meow from 'meow';
import App from '@/app.js';

const cli = meow(
  `
	Usage
	  $ code-lite
`,
  {
    importMeta: import.meta,
    flags: {
      mode: {
        type: 'string',
        default: 'normal',
      },
    },
  },
);

render(<App mode={cli.flags.mode} />);
