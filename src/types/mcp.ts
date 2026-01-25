// MCP 传输方式
export type MCPTransport = 'stdio' | 'http';

// stdio 配置
export interface MCPStdioConfig {
  id: string;
  name: string;
  transport: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  enabled: boolean;
}

// HTTP 配置
export interface MCPHttpConfig {
  id: string;
  name: string;
  transport: 'http';
  url: string;
  headers?: Record<string, string>;
  enabled: boolean;
}

// 联合类型
export type MCPServerConfig = MCPStdioConfig | MCPHttpConfig;

// 连接状态
export type MCPServerStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface MCPServerState {
  status: MCPServerStatus;
  error?: string;
  toolCount?: number;
}

// 表单数据 (用于 UI)
export interface MCPFormData {
  name: string;
  transport: MCPTransport;
  // stdio fields
  command: string;
  args: string; // JSON 字符串，用户输入
  env: string; // JSON 字符串
  cwd: string;
  // http fields
  url: string;
  headers: string; // JSON 字符串
}

// 配置文件结构
export interface MCPConfigFile {
  servers: MCPServerConfig[];
}

// 默认表单数据
export const DEFAULT_FORM_DATA: MCPFormData = {
  name: '',
  transport: 'stdio',
  command: '',
  args: '',
  env: '',
  cwd: '',
  url: '',
  headers: '',
};

// 表单验证错误
export interface MCPFormErrors {
  name?: string;
  command?: string;
  args?: string;
  env?: string;
  url?: string;
  headers?: string;
}
