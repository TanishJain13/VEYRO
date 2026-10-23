/**
 * Parser adapter interface — shared contract for all language parsers.
 */
import type {
  FileImport,
  FileExport,
  SymbolRecord,
  ParseStatus,
  ParseDiagnostic,
} from '@/types/repository';

export interface ParseInput {
  filePath: string;
  source: string;
  language: string;
}

export interface ParseResult {
  imports: FileImport[];
  exports: FileExport[];
  symbols: SymbolRecord[];
  parseStatus: ParseStatus;
  lineCount: number;
  errors: ParseDiagnostic[];
  warnings: ParseDiagnostic[];
  parserId: string;
}

export interface ParserAdapter {
  /** Unique parser identifier */
  id: string;

  /** Languages this parser supports */
  supportedLanguages: string[];

  /** Parse the source and extract relationships */
  parse(input: ParseInput): ParseResult;
}
