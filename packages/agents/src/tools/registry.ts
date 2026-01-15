import { ToolDefinition, ToolHandler, ToolResult, ToolContext } from './types';

export class ToolRegistry {
  private definitions = new Map<string, ToolDefinition>();
  private handlers = new Map<string, ToolHandler>();

  register(definition: ToolDefinition, handler: ToolHandler): void {
    this.definitions.set(definition.name, definition);
    this.handlers.set(definition.name, handler);
  }

  getDefinition(name: string): ToolDefinition | undefined {
    return this.definitions.get(name);
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.definitions.values());
  }

  getHandler(name: string): ToolHandler | undefined {
    return this.handlers.get(name);
  }

  async call(
    name: string,
    args: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolResult> {
    const handler = this.handlers.get(name);
    if (!handler) {
      return { ok: false, error: { message: `Tool not found: ${name}`, code: 'TOOL_NOT_FOUND' } };
    }
    try {
      return await handler(args, context);
    } catch (error) {
      const message = (error as Error).message || String(error);
      return { ok: false, error: { message, code: 'TOOL_EXEC_ERROR' } };
    }
  }
}
