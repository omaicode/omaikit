/**
 * Configuration loader utility
 */
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
export declare function loadConfig(): OmaikitConfig;
export declare function saveConfig(
  config: OmaikitConfig,
  scope?: 'global' | 'local',
  cwd?: string,
): string;
export declare function getGlobalConfigPath(): string;
export declare function getLocalConfigPath(cwd?: string): string;
//# sourceMappingURL=loader.d.ts.map
