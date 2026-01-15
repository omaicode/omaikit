export type JSONSchema = {
  type: string | string[];
  description?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: Array<string | number | boolean | null>;
  additionalProperties?: boolean | JSONSchema;
};

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
}

export interface ToolInvocation {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: { message: string; code?: string };
}

export interface ToolContext {
  rootPath?: string;
  cwd?: string;
  logger?: {
    info?: (message: string, meta?: Record<string, unknown>) => void;
    warn?: (message: string, meta?: Record<string, unknown>) => void;
    error?: (message: string, meta?: Record<string, unknown>) => void;
  };
}

export type ToolHandler = (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult> | ToolResult;

