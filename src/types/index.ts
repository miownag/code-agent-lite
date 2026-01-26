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

// 消息内容块类型
export type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; toolCall: ToolCall };

export interface Message {
  id: string;
  role: MessageRole;
  parts: MessagePart[]; // 替换原来的 content: string
  timestamp: number;
  isStreaming?: boolean;
  hasFirstChunk?: boolean;
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
  shimmer: string[];
  gradient: string[];
}

export interface FileItem {
  path: string;
  name: string;
}

// Re-export MCP types
export * from './mcp';

// Re-export Provider types
export * from './provider';
