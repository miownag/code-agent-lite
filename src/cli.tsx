#!/usr/bin/env node
import { render } from 'ink';
import meow from 'meow';
import App from '@/app.js';

const cli = meow(
  `
	Usage
	  $ code-agent-lite

	Options
		--name  Your name

	Examples
	  $ code-agent-lite --name=Jane
	  Hello, Jane
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
