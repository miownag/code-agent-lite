export type MessageRole = 'user' | 'assistant' | 'system';
export type ToolStatus = 'running' | 'success' | 'error';
export type ThemeMode = 'dark' | 'light';

export interface ToolCall {
  id: string;
  name: string;
  status: ToolStatus;
  startTime: number;
  endTime?: number;
  input?: string;
  output?: string;
  icon?: string;
}

export interface DiffData {
  filePath: string;
  oldContent: string;
  newContent: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  diffs?: DiffData[];
  isStreaming?: boolean;
}

export interface Command {
  name: string;
  description: string;
  icon?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  user: string;
  assistant: string;
  success: string;
  error: string;
  warning: string;
  muted: string;
}

export interface FileItem {
  path: string;
  name: string;
}
