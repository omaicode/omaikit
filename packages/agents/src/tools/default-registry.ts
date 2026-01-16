import { ToolRegistry } from './registry';
import { readFileToolDefinition, readFileToolHandler } from './read-file';
import { searchToolDefinition, searchToolHandler } from './search';
import { editFileToolDefinition, editFileToolHandler } from './edit-file';
import { applyPatchToolDefinition, applyPatchToolHandler } from './apply-patch';
import { listFilesToolDefinition, listFilesToolHandler } from './list-files';

export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(readFileToolDefinition, readFileToolHandler);
  registry.register(searchToolDefinition, searchToolHandler);
  registry.register(editFileToolDefinition, editFileToolHandler);
  registry.register(applyPatchToolDefinition, applyPatchToolHandler);
  registry.register(listFilesToolDefinition, listFilesToolHandler);
  return registry;
}
