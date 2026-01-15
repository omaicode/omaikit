/**
 * Configuration interface and types
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
