import type { ToolCall, DiffData } from '@/types';

export type StreamCallback = (chunk: string) => void;
export type ToolCallback = (tool: ToolCall) => void;
export type DiffCallback = (diff: DiffData) => void;

const MOCK_RESPONSES = [
  {
    text: "I'll help you with that task. Let me start by reading the relevant files.",
    tools: [
      {
        name: 'Read',
        icon: '📖',
        input: 'src/app.tsx',
        output: 'File content loaded successfully.',
      },
    ],
  },
  {
    text: "I've analyzed the code. Now I'll make the necessary changes to implement the feature.",
    tools: [
      {
        name: 'Write',
        icon: '📝',
        input: 'src/app.tsx:15',
        output: 'File updated successfully.',
      },
    ],
    diffs: [
      {
        filePath: 'src/app.tsx',
        oldContent: `export default function App() {
  return (
    <Box>
      <Text>Hello World</Text>
    </Box>
  );
}`,
        newContent: `export default function App() {
  const [count, setCount] = useState(0);

  return (
    <Box flexDirection="column">
      <Text>Hello World</Text>
      <Text>Count: {count}</Text>
      <Button onPress={() => setCount(count + 1)}>
        Increment
      </Button>
    </Box>
  );
}`,
      },
    ],
  },
  {
    text: 'Perfect! The changes have been applied. Let me run the tests to make sure everything works.',
    tools: [
      {
        name: 'Bash',
        icon: '🔧',
        input: 'bun test',
        output: '✓ All tests passed (5/5)',
      },
    ],
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function streamResponse(
  onChunk: StreamCallback,
  onTool?: ToolCallback,
  onDiff?: DiffCallback,
): Promise<void> {
  const response =
    // MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    MOCK_RESPONSES[1];

  if (!response) return;

  // Stream text token by token
  const words = response.text.split(' ');
  for (const word of words) {
    await delay(50 + Math.random() * 50);
    onChunk(word + ' ');
  }

  await delay(500);

  // Execute tools
  if (response.tools && onTool) {
    for (const tool of response.tools) {
      const toolCall: ToolCall = {
        id: Math.random().toString(36).substring(7),
        name: tool.name,
        status: 'running',
        startTime: Date.now(),
        icon: tool.icon,
        input: tool.input,
      };

      onTool(toolCall);
      await delay(1000 + Math.random() * 1000);

      toolCall.status = 'success';
      toolCall.endTime = Date.now();
      toolCall.output = tool.output;
      onTool(toolCall);
    }
  }

  // Show diffs
  if (response.diffs && onDiff) {
    await delay(500);
    for (const diff of response.diffs) {
      onDiff(diff);
    }
  }
}

export const AVAILABLE_COMMANDS = [
  { name: '/help', description: 'Show available commands' },
  { name: '/clear', description: 'Clear chat history' },
  { name: '/mcp', description: 'Configure MCP servers' },
  { name: '/provider', description: 'Configure LLM providers' },
  { name: '/model', description: 'Switch AI model' },
  { name: '/settings', description: 'Open settings' },
  { name: '/theme', description: 'Toggle theme' },
];
