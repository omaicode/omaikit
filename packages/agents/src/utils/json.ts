export function parseJsonFromText<T = Record<string, unknown>>(text: string): T {
  const trimmed = text.trim();
  const candidates: string[] = [];
  const fenceStripped = stripCodeFences(trimmed);
  candidates.push(fenceStripped);

  const extracted = extractBalancedJson(fenceStripped);
  if (extracted) {
    candidates.push(extracted);
  }

  for (const candidate of candidates) {
    const normalized = removeTrailingCommas(candidate.trim());
    try {
      return JSON.parse(normalized) as T;
    } catch {
      // continue
    }
  }

  throw new Error('Failed to parse JSON from response');
}

function stripCodeFences(value: string): string {
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(value.trim());
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  return value;
}

function extractBalancedJson(value: string): string | null {
  const start = value.indexOf('{');
  if (start === -1) return null;
  let inString = false;
  let escape = false;
  let depth = 0;
  for (let i = start; i < value.length; i += 1) {
    const ch = value[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return value.slice(start, i + 1);
      }
    }
  }
  return null;
}

function removeTrailingCommas(value: string): string {
  return value.replace(/,\s*([}\]])/g, '$1');
}
