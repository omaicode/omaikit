import { AIProvider } from './provider';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { loadConfig } from '@omaikit/config';

export function createProvider(name?: string, config?: Record<string, unknown>): AIProvider {
  const cfg = loadConfig();
  const providerName = (name || cfg.provider || process.env.OMAIKIT_PROVIDER || 'openai').toString().toLowerCase();
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider((config && (config as any).apiKey) as string | undefined ?? cfg.openaiApiKey ?? process.env.OPENAI_API_KEY);
    case 'anthropic':
      return new AnthropicProvider((config && (config as any).apiKey) as string | undefined ?? cfg.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY);
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}
