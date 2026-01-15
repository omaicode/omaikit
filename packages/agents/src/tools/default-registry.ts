import { ToolRegistry } from './registry';
import { readToolDefinition, readToolHandler } from './read';
import { searchToolDefinition, searchToolHandler } from './search';
import { editToolDefinition, editToolHandler } from './edit';

export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(readToolDefinition, readToolHandler);
  registry.register(searchToolDefinition, searchToolHandler);
  registry.register(editToolDefinition, editToolHandler);
  return registry;
}
