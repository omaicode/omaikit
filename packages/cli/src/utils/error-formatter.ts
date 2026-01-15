import { error as colorError, bold } from './colors';

export interface FormattedError {
  code: string;
  message: string;
  suggestion?: string;
  details?: string;
}

const errorCodes: Record<string, { message: string; suggestion: string }> = {
  AGENT_INIT_FAILED: {
    message: 'Failed to initialize agent',
    suggestion: 'Check agent configuration and API keys.',
  },
  AGENT_EXECUTION_FAILED: {
    message: 'Agent execution failed',
    suggestion: 'Review agent logs and input parameters.',
  },
  PROVIDER_ERROR: {
    message: 'AI provider error',
    suggestion: 'Check API key and provider availability.',
  },
  PARSE_FAILURE: {
    message: 'Failed to parse response',
    suggestion: 'Verify response format and structure.',
  },
};

export function formatError(code: string, message: string, details?: string): FormattedError {
  const entry = errorCodes[code];
  return {
    code,
    message: entry?.message ?? message,
    suggestion: entry?.suggestion,
    details,
  };
}

export function printError(err: FormattedError): void {
  console.error(colorError(`✗ [${err.code}] ${err.message}`));
  if (err.details) {
    console.error(`  Details: ${err.details}`);
  }
  if (err.suggestion) {
    console.error(`  Suggestion: ${err.suggestion}`);
  }
}

export function printSuccess(message: string): void {
  console.log(`✓ ${message}`);
}

export function printWarning(message: string): void {
  console.warn(`⚠ ${message}`);
}
