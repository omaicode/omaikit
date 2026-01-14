export interface AIProviderOptions {
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  onProgress?: (chunk: string) => void;
}

export interface AIProvider {
  init?(config?: Record<string, unknown>): Promise<void> | void;
  generate(prompt: string, options?: AIProviderOptions): Promise<string>;
  close?(): Promise<void> | void;
}
