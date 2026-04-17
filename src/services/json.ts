export const tryParseJson = <T>(text: string): T | null => {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

const stripCodeFences = (text: string) =>
  text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

const removeTrailingCommas = (text: string) => text.replace(/,\s*([}\]])/g, '$1');

const findBalancedJson = (text: string, root: 'array' | 'object'): string | null => {
  const open = root === 'array' ? '[' : '{';
  const close = root === 'array' ? ']' : '}';
  const start = text.indexOf(open);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === open) depth++;
    if (ch === close) depth--;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
};

export const parseModelJson = <T>(response: string, root: 'array' | 'object'): T | null => {
  const cleaned = removeTrailingCommas(stripCodeFences(response));

  const direct = tryParseJson<T>(cleaned);
  if (direct) return direct;

  const balanced = findBalancedJson(cleaned, root);
  if (!balanced) return null;

  return tryParseJson<T>(removeTrailingCommas(balanced));
};
