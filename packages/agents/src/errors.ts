export class AgentError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'AgentError';
  }
}

export const ERROR_CODES = {
  AGENT_INIT_FAILED: 'AGENT_INIT_FAILED',
  AGENT_EXECUTION_FAILED: 'AGENT_EXECUTION_FAILED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
};
