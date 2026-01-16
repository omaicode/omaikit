import { ToolRegistry } from './registry';
import { readToolDefinition, readToolHandler } from './read';
import { searchToolDefinition, searchToolHandler } from './search';
import { applyPatchToolDefinition, applyPatchToolHandler } from './apply-patch';

export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(readToolDefinition, readToolHandler);
  registry.register(searchToolDefinition, searchToolHandler);
  registry.register(applyPatchToolDefinition, applyPatchToolHandler);
  return registry;
}
