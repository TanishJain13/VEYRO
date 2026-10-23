/**
 * Parser registry — maps languages to their parser adapters.
 */
import type { ParserAdapter } from './types';
import { typescriptParser } from './typescript-parser';
import { pythonParser } from './python-parser';
import { jsonParser } from './json-parser';
import { cssParser } from './css-parser';
import { fallbackParser } from './fallback-parser';

const registry = new Map<string, ParserAdapter>();

function register(parser: ParserAdapter) {
  for (const lang of parser.supportedLanguages) {
    registry.set(lang, parser);
  }
}

// Register all parsers
register(typescriptParser);
register(pythonParser);
register(jsonParser);
register(cssParser);

/**
 * Get the parser for a given language.
 * Returns the fallback parser if no dedicated parser exists.
 */
export function getParser(language: string): ParserAdapter {
  return registry.get(language) || fallbackParser;
}

/**
 * Check if a language has dedicated parser support.
 */
export function hasParserSupport(language: string): boolean {
  return registry.has(language);
}

/**
 * Get all registered parser IDs and their supported languages.
 */
export function getRegisteredParsers(): Array<{ id: string; languages: string[] }> {
  const seen = new Set<string>();
  const result: Array<{ id: string; languages: string[] }> = [];

  for (const [lang, parser] of registry.entries()) {
    if (!seen.has(parser.id)) {
      seen.add(parser.id);
      result.push({ id: parser.id, languages: [lang] });
    } else {
      const entry = result.find((r) => r.id === parser.id);
      if (entry) entry.languages.push(lang);
    }
  }

  return result;
}
