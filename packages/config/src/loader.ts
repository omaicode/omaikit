/**
 * Configuration loader utility
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env file if it exists
function loadDotEnv(): void {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  } catch (_e) {
    // Ignore errors loading .env
  }
}

export interface OmaikitConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  provider?: string;
}

export function loadConfig(): OmaikitConfig {
  // Load .env file first
  loadDotEnv();

  const cfg: OmaikitConfig = {};
  if (process.env.OPENAI_API_KEY) cfg.openaiApiKey = process.env.OPENAI_API_KEY;
  if (process.env.ANTHROPIC_API_KEY) cfg.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (process.env.OMAIKIT_PROVIDER) cfg.provider = process.env.OMAIKIT_PROVIDER;

  try {
    const p = path.join(process.cwd(), '.omaikit', 'config.json');
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const parsed = JSON.parse(raw) as OmaikitConfig;
      return { ...parsed, ...cfg };
    }
  } catch (_e) {
    // ignore
  }

  return cfg;
}
