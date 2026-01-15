/**
 * Configuration loader utility
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
  managerModel?: string;
  plannerModel?: string;
  coderModel?: string;
  testerModel?: string;
  reviewerModel?: string;
}

function readConfigFile(filePath: string): OmaikitConfig {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as OmaikitConfig;
    }
  } catch (_e) {
    // ignore
  }
  return {};
}

export function getGlobalConfigPath(): string {
  return path.join(os.homedir(), '.omaikit', 'config.json');
}

export function getLocalConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, '.omaikit', 'config.json');
}

export function saveConfig(
  config: OmaikitConfig,
  scope: 'global' | 'local' = 'global',
  cwd: string = process.cwd(),
): string {
  const targetPath = scope === 'global' ? getGlobalConfigPath() : getLocalConfigPath(cwd);
  const dirPath = path.dirname(targetPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), 'utf-8');
  return targetPath;
}

export function loadConfig(): OmaikitConfig {
  // Load .env file first
  loadDotEnv();

  const envCfg: OmaikitConfig = {
    managerModel: process.env.OMAIKIT_MANAGER_MODEL || 'gpt-5-mini',
    plannerModel: process.env.OMAIKIT_PLANNER_MODEL || 'gpt-5-mini',
    coderModel: process.env.OMAIKIT_CODER_MODEL || 'gpt-5.1',
    testerModel: process.env.OMAIKIT_TESTER_MODEL || 'gpt-5-mini',
    reviewerModel: process.env.OMAIKIT_REVIEWER_MODEL || 'gpt-5-mini',
  };

  if (process.env.OPENAI_API_KEY) envCfg.openaiApiKey = process.env.OPENAI_API_KEY;
  if (process.env.ANTHROPIC_API_KEY) envCfg.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (process.env.OMAIKIT_PROVIDER) envCfg.provider = process.env.OMAIKIT_PROVIDER;

  const globalCfg = readConfigFile(getGlobalConfigPath());
  const localCfg = readConfigFile(getLocalConfigPath());

  return { ...globalCfg, ...localCfg, ...envCfg };
}
