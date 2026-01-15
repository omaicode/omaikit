export interface CodeFile {
  path: string;
  language: string;
  content: string;
  dependencies?: string[];
}

export interface CodeGeneration {
  id: string;
  taskId: string;
  prompt: string;
  files: CodeFile[];
  metadata?: {
    model?: string;
    tokensUsed?: number;
    generatedAt?: string;
  };
}
