/**
 * TypeScript/JavaScript parser using the TypeScript Compiler API.
 * Extracts imports, exports, and symbols from TS/JS source.
 */
import ts from 'typescript';
import type {
  FileImport,
  FileExport,
  SymbolRecord,
  ImportKind,
  SymbolKind,
  ParseDiagnostic,
} from '@/types/repository';
import type { ParserAdapter, ParseInput, ParseResult } from './types';

function createSymbolId(filePath: string, name: string, line: number): string {
  return `${filePath}:${name}:${line}`;
}

export const typescriptParser: ParserAdapter = {
  id: 'veyro-typescript-v1',
  supportedLanguages: ['typescript', 'javascript'],

  parse(input: ParseInput): ParseResult {
    const imports: FileImport[] = [];
    const exports: FileExport[] = [];
    const symbols: SymbolRecord[] = [];
    const errors: ParseDiagnostic[] = [];
    const warnings: ParseDiagnostic[] = [];
    const lineCount = input.source.split('\n').length;

    let isJsx = false;
    if (input.filePath.endsWith('.tsx') || input.filePath.endsWith('.jsx')) {
      isJsx = true;
    }

    const scriptKind = input.language === 'typescript'
      ? (isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
      : (isJsx ? ts.ScriptKind.JSX : ts.ScriptKind.JS);

    const sourceFile = ts.createSourceFile(
      input.filePath,
      input.source,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );

    // Collect parse errors
    const diagnostics = (sourceFile as unknown as { parseDiagnostics?: ts.DiagnosticWithLocation[] }).parseDiagnostics;
    if (diagnostics) {
      for (const diag of diagnostics) {
        const pos = sourceFile.getLineAndCharacterOfPosition(diag.start || 0);
        errors.push({
          message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
          line: pos.line + 1,
          column: pos.character + 1,
          severity: 'error',
          code: `TS${diag.code}`,
        });
      }
    }

    // Walk the AST
    function visit(node: ts.Node) {
      try {
        // Import declarations: import x from 'y'
        if (ts.isImportDeclaration(node)) {
          extractImportDeclaration(node, sourceFile, input.filePath, imports);
        }
        // Export declarations
        else if (ts.isExportDeclaration(node)) {
          extractExportDeclaration(node, sourceFile, input.filePath, exports, imports);
        }
        // Export assignment: export default ...
        else if (ts.isExportAssignment(node)) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          exports.push({
            name: 'default',
            kind: 'default',
            line: pos.line + 1,
            isDefault: true,
            isReExport: false,
            sourceSpecifier: null,
          });
        }
        // Function declarations
        else if (ts.isFunctionDeclaration(node) && node.name) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
          const isExported = hasExportModifier(node);
          const name = node.name.text;
          const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;

          symbols.push({
            id: createSymbolId(input.filePath, name, pos.line + 1),
            name,
            kind: isAsync ? 'function' : 'function',
            filePath: input.filePath,
            startLine: pos.line + 1,
            endLine: endPos.line + 1,
            startColumn: pos.character + 1,
            endColumn: endPos.character + 1,
            isExported,
            parentSymbolId: null,
            confidence: 'high',
            extractionMethod: 'ast',
          });

          if (isExported) {
            const isDefault = node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) || false;
            exports.push({
              name: isDefault ? 'default' : name,
              kind: isDefault ? 'default' : 'named',
              line: pos.line + 1,
              isDefault,
              isReExport: false,
              sourceSpecifier: null,
            });
          }
        }
        // Class declarations
        else if (ts.isClassDeclaration(node) && node.name) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
          const isExported = hasExportModifier(node);
          const name = node.name.text;

          symbols.push({
            id: createSymbolId(input.filePath, name, pos.line + 1),
            name,
            kind: 'class',
            filePath: input.filePath,
            startLine: pos.line + 1,
            endLine: endPos.line + 1,
            startColumn: pos.character + 1,
            endColumn: endPos.character + 1,
            isExported,
            parentSymbolId: null,
            confidence: 'high',
            extractionMethod: 'ast',
          });

          if (isExported) {
            const isDefault = node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) || false;
            exports.push({
              name: isDefault ? 'default' : name,
              kind: isDefault ? 'default' : 'named',
              line: pos.line + 1,
              isDefault,
              isReExport: false,
              sourceSpecifier: null,
            });
          }
        }
        // Interface declarations
        else if (ts.isInterfaceDeclaration(node)) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
          const isExported = hasExportModifier(node);
          const name = node.name.text;

          symbols.push({
            id: createSymbolId(input.filePath, name, pos.line + 1),
            name,
            kind: 'interface',
            filePath: input.filePath,
            startLine: pos.line + 1,
            endLine: endPos.line + 1,
            startColumn: pos.character + 1,
            endColumn: endPos.character + 1,
            isExported,
            parentSymbolId: null,
            confidence: 'high',
            extractionMethod: 'ast',
          });

          if (isExported) {
            exports.push({
              name,
              kind: 'named',
              line: pos.line + 1,
              isDefault: false,
              isReExport: false,
              sourceSpecifier: null,
            });
          }
        }
        // Type alias declarations
        else if (ts.isTypeAliasDeclaration(node)) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
          const isExported = hasExportModifier(node);
          const name = node.name.text;

          symbols.push({
            id: createSymbolId(input.filePath, name, pos.line + 1),
            name,
            kind: 'type-alias',
            filePath: input.filePath,
            startLine: pos.line + 1,
            endLine: endPos.line + 1,
            startColumn: pos.character + 1,
            endColumn: endPos.character + 1,
            isExported,
            parentSymbolId: null,
            confidence: 'high',
            extractionMethod: 'ast',
          });

          if (isExported) {
            exports.push({
              name,
              kind: 'named',
              line: pos.line + 1,
              isDefault: false,
              isReExport: false,
              sourceSpecifier: null,
            });
          }
        }
        // Enum declarations
        else if (ts.isEnumDeclaration(node)) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
          const isExported = hasExportModifier(node);
          const name = node.name.text;

          symbols.push({
            id: createSymbolId(input.filePath, name, pos.line + 1),
            name,
            kind: 'enum',
            filePath: input.filePath,
            startLine: pos.line + 1,
            endLine: endPos.line + 1,
            startColumn: pos.character + 1,
            endColumn: endPos.character + 1,
            isExported,
            parentSymbolId: null,
            confidence: 'high',
            extractionMethod: 'ast',
          });

          if (isExported) {
            exports.push({
              name,
              kind: 'named',
              line: pos.line + 1,
              isDefault: false,
              isReExport: false,
              sourceSpecifier: null,
            });
          }
        }
        // Variable statements: const/let/var
        else if (ts.isVariableStatement(node)) {
          const isExported = hasExportModifier(node);
          const declarations = node.declarationList.declarations;

          for (const decl of declarations) {
            if (ts.isIdentifier(decl.name)) {
              const name = decl.name.text;
              const pos = sourceFile.getLineAndCharacterOfPosition(decl.getStart());
              const endPos = sourceFile.getLineAndCharacterOfPosition(decl.getEnd());

              // Detect arrow functions assigned to variables
              let kind: SymbolKind = 'variable';
              if (decl.initializer) {
                if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                  kind = 'arrow-function';
                }
              }

              const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
              if (isConst && kind === 'variable') {
                kind = 'constant';
              }

              symbols.push({
                id: createSymbolId(input.filePath, name, pos.line + 1),
                name,
                kind,
                filePath: input.filePath,
                startLine: pos.line + 1,
                endLine: endPos.line + 1,
                startColumn: pos.character + 1,
                endColumn: endPos.character + 1,
                isExported,
                parentSymbolId: null,
                confidence: 'high',
                extractionMethod: 'ast',
              });

              if (isExported) {
                exports.push({
                  name,
                  kind: 'named',
                  line: pos.line + 1,
                  isDefault: false,
                  isReExport: false,
                  sourceSpecifier: null,
                });
              }
            }
          }
        }
        // Detect require() calls: const x = require('y')
        else if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'require' &&
          node.arguments.length === 1 &&
          ts.isStringLiteral(node.arguments[0])
        ) {
          const specifier = node.arguments[0].text;
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());

          imports.push({
            specifier,
            kind: 'commonjs',
            names: [],
            line: pos.line + 1,
            column: pos.character + 1,
            isDynamic: false,
          });
        }
        // Dynamic import(): import('x')
        else if (
          ts.isCallExpression(node) &&
          node.expression.kind === ts.SyntaxKind.ImportKeyword &&
          node.arguments.length === 1 &&
          ts.isStringLiteral(node.arguments[0])
        ) {
          const specifier = node.arguments[0].text;
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());

          imports.push({
            specifier,
            kind: 'esm-dynamic',
            names: [],
            line: pos.line + 1,
            column: pos.character + 1,
            isDynamic: true,
          });
        }
      } catch {
        // Skip problematic nodes silently
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    const hasErrors = errors.length > 0;
    const parseStatus = hasErrors && symbols.length === 0 && imports.length === 0
      ? 'failed'
      : hasErrors
        ? 'partial'
        : 'success';

    return {
      imports,
      exports,
      symbols,
      parseStatus,
      lineCount,
      errors,
      warnings,
      parserId: typescriptParser.id,
    };
  },
};

function extractImportDeclaration(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string,
  imports: FileImport[]
) {
  if (!ts.isStringLiteral(node.moduleSpecifier)) return;

  const specifier = node.moduleSpecifier.text;
  const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const isTypeOnly = node.importClause?.isTypeOnly || false;
  const names: FileImport['names'] = [];

  if (node.importClause) {
    // Default import
    if (node.importClause.name) {
      names.push({
        name: node.importClause.name.text,
        alias: null,
        isDefault: true,
        isNamespace: false,
      });
    }

    // Named or namespace bindings
    if (node.importClause.namedBindings) {
      if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        names.push({
          name: node.importClause.namedBindings.name.text,
          alias: null,
          isDefault: false,
          isNamespace: true,
        });
      } else if (ts.isNamedImports(node.importClause.namedBindings)) {
        for (const el of node.importClause.namedBindings.elements) {
          names.push({
            name: (el.propertyName || el.name).text,
            alias: el.propertyName ? el.name.text : null,
            isDefault: false,
            isNamespace: false,
          });
        }
      }
    }
  }

  const kind: ImportKind = names.length === 0 ? 'side-effect'
    : isTypeOnly ? 'esm-static'
    : 'esm-static';

  // Suppress 'filePath unused' — it's used in the caller
  void filePath;

  imports.push({
    specifier,
    kind,
    names,
    line: pos.line + 1,
    column: pos.character + 1,
    isDynamic: false,
  });
}

function extractExportDeclaration(
  node: ts.ExportDeclaration,
  sourceFile: ts.SourceFile,
  _filePath: string,
  exports: FileExport[],
  imports: FileImport[]
) {
  const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const hasModuleSpecifier = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier);

  if (hasModuleSpecifier) {
    const specifier = (node.moduleSpecifier as ts.StringLiteral).text;

    // Re-export: track as import too
    imports.push({
      specifier,
      kind: 'esm-static',
      names: [],
      line: pos.line + 1,
      column: pos.character + 1,
      isDynamic: false,
    });

    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const el of node.exportClause.elements) {
        exports.push({
          name: el.name.text,
          kind: 're-export',
          line: pos.line + 1,
          isDefault: false,
          isReExport: true,
          sourceSpecifier: specifier,
        });
      }
    } else {
      // export * from 'x'
      exports.push({
        name: '*',
        kind: 'all',
        line: pos.line + 1,
        isDefault: false,
        isReExport: true,
        sourceSpecifier: specifier,
      });
    }
  } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    for (const el of node.exportClause.elements) {
      exports.push({
        name: el.name.text,
        kind: 'named',
        line: pos.line + 1,
        isDefault: false,
        isReExport: false,
        sourceSpecifier: null,
      });
    }
  }
}

function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  return modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) || false;
}
