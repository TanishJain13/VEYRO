/**
 * Python parser — extracts imports, functions, classes from Python source.
 * Uses conservative regex-based parsing since we can't run a Python AST in Node.
 */
import type {
  FileImport,
  FileExport,
  SymbolRecord,
  SymbolKind,
  ParseDiagnostic,
} from '@/types/repository';
import type { ParserAdapter, ParseInput, ParseResult } from './types';

function createSymbolId(filePath: string, name: string, line: number): string {
  return `${filePath}:${name}:${line}`;
}

export const pythonParser: ParserAdapter = {
  id: 'veyro-python-v1',
  supportedLanguages: ['python'],

  parse(input: ParseInput): ParseResult {
    const imports: FileImport[] = [];
    const exports: FileExport[] = [];
    const symbols: SymbolRecord[] = [];
    const errors: ParseDiagnostic[] = [];
    const warnings: ParseDiagnostic[] = [];

    const lines = input.source.split('\n');
    const lineCount = lines.length;

    // Track indentation for scope detection
    let currentClassId: string | null = null;
    let currentClassIndent = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trimStart();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.length - trimmed.length;

      // Reset class context if outdented
      if (indent <= currentClassIndent) {
        currentClassId = null;
        currentClassIndent = -1;
      }

      try {
        // from X import Y, Z
        const fromImportMatch = trimmed.match(
          /^from\s+(\.{0,3}[a-zA-Z0-9_.]*)\s+import\s+(.+?)$/
        );
        if (fromImportMatch) {
          const moduleName = fromImportMatch[1];
          const namesStr = fromImportMatch[2];

          // Handle multiline imports (parenthesized)
          let fullNames = namesStr;
          if (namesStr.includes('(') && !namesStr.includes(')')) {
            let j = i + 1;
            while (j < lines.length && !lines[j].includes(')')) {
              fullNames += ' ' + lines[j].trim();
              j++;
            }
            if (j < lines.length) {
              fullNames += ' ' + lines[j].trim();
            }
          }

          fullNames = fullNames.replace(/[()]/g, '').trim();
          if (fullNames.endsWith('\\')) {
            fullNames = fullNames.slice(0, -1).trim();
          }

          const importedNames = fullNames
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean)
            .map((n) => {
              const asMatch = n.match(/^(\S+)\s+as\s+(\S+)$/);
              if (asMatch) {
                return {
                  name: asMatch[1],
                  alias: asMatch[2],
                  isDefault: false,
                  isNamespace: false,
                };
              }
              return {
                name: n,
                alias: null,
                isDefault: false,
                isNamespace: n === '*',
              };
            });

          imports.push({
            specifier: moduleName,
            kind: 'python-from-import',
            names: importedNames,
            line: lineNum,
            column: 1,
            isDynamic: false,
          });
          continue;
        }

        // import X, Y
        const importMatch = trimmed.match(/^import\s+(.+?)$/);
        if (importMatch) {
          const modules = importMatch[1]
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean);

          for (const mod of modules) {
            const asMatch = mod.match(/^(\S+)\s+as\s+(\S+)$/);
            const specifier = asMatch ? asMatch[1] : mod;
            const alias = asMatch ? asMatch[2] : null;

            imports.push({
              specifier,
              kind: 'python-import',
              names: [
                {
                  name: specifier,
                  alias,
                  isDefault: false,
                  isNamespace: false,
                },
              ],
              line: lineNum,
              column: 1,
              isDynamic: false,
            });
          }
          continue;
        }

        // Class definition
        const classMatch = trimmed.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (classMatch) {
          const name = classMatch[1];
          const endLine = findBlockEnd(lines, i, indent);

          const symbolId = createSymbolId(input.filePath, name, lineNum);
          symbols.push({
            id: symbolId,
            name,
            kind: 'class',
            filePath: input.filePath,
            startLine: lineNum,
            endLine: endLine + 1,
            startColumn: indent + 1,
            endColumn: null,
            isExported: indent === 0, // Top-level classes are considered exported
            parentSymbolId: null,
            confidence: 'high',
            extractionMethod: 'lexical',
          });

          if (indent === 0) {
            currentClassId = symbolId;
            currentClassIndent = indent;
          }
          continue;
        }

        // Function/method definition
        const funcMatch = trimmed.match(
          /^(async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)/
        );
        if (funcMatch) {
          const isAsync = Boolean(funcMatch[1]);
          const name = funcMatch[2];
          const endLine = findBlockEnd(lines, i, indent);

          let kind: SymbolKind = isAsync ? 'function' : 'function';
          let parentId: string | null = null;

          // Method if indented inside a class
          if (indent > 0 && currentClassId && indent > currentClassIndent) {
            kind = 'method';
            parentId = currentClassId;
          }

          // Suppress unused isAsync warning
          void isAsync;

          symbols.push({
            id: createSymbolId(input.filePath, name, lineNum),
            name,
            kind,
            filePath: input.filePath,
            startLine: lineNum,
            endLine: endLine + 1,
            startColumn: indent + 1,
            endColumn: null,
            isExported: indent === 0,
            parentSymbolId: parentId,
            confidence: 'high',
            extractionMethod: 'lexical',
          });
          continue;
        }

        // Top-level variable assignment (conservative)
        if (indent === 0) {
          const varMatch = trimmed.match(
            /^([A-Z_][A-Z0-9_]*)\s*[:=]/
          );
          if (varMatch) {
            symbols.push({
              id: createSymbolId(input.filePath, varMatch[1], lineNum),
              name: varMatch[1],
              kind: 'constant',
              filePath: input.filePath,
              startLine: lineNum,
              endLine: lineNum,
              startColumn: 1,
              endColumn: null,
              isExported: true,
              parentSymbolId: null,
              confidence: 'medium',
              extractionMethod: 'lexical',
            });
          }
        }
      } catch {
        errors.push({
          message: `Failed to parse line ${lineNum}`,
          line: lineNum,
          column: null,
          severity: 'warning',
          code: null,
        });
      }
    }

    // Python modules implicitly export all top-level names
    for (const sym of symbols) {
      if (sym.isExported && !sym.name.startsWith('_')) {
        exports.push({
          name: sym.name,
          kind: 'named',
          line: sym.startLine,
          isDefault: false,
          isReExport: false,
          sourceSpecifier: null,
        });
      }
    }

    // Check for __all__ definition
    const allMatch = input.source.match(/__all__\s*=\s*\[([^\]]*)\]/s);
    if (allMatch) {
      warnings.push({
        message: '__all__ detected; export list may be narrower than inferred',
        line: null,
        column: null,
        severity: 'info',
        code: 'PYTHON_ALL_DEFINED',
      });
    }

    return {
      imports,
      exports,
      symbols,
      parseStatus: errors.length > 0 ? 'partial' : 'success',
      lineCount,
      errors,
      warnings,
      parserId: pythonParser.id,
    };
  },
};

/**
 * Find the end of an indented block.
 */
function findBlockEnd(lines: string[], startIndex: number, baseIndent: number): number {
  let endLine = startIndex;

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      endLine = i;
      continue;
    }

    const indent = line.length - trimmed.length;
    if (indent <= baseIndent) break;
    endLine = i;
  }

  return endLine;
}
