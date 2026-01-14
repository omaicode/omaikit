/**
 * Configuration loader utility
 */

import * as fs from 'fs';
import * as path from 'path';

export interface OmaikitConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  provider?: string;
}

export function loadConfig(): OmaikitConfig {
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
