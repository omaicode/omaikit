/**
 * Base agent implementation
 */

export abstract class Agent {
  abstract execute(): Promise<void>;
}
