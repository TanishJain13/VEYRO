import { describe, it, expect } from 'vitest';
import { typescriptParser } from './typescript-parser';
import { pythonParser } from './python-parser';
import { jsonParser } from './json-parser';
import { cssParser } from './css-parser';
import { fallbackParser } from './fallback-parser';

describe('TypeScript Parser', () => {
  it('extracts imports, exports, and symbols accurately', () => {
    const code = `
      import React, { useState, useEffect } from 'react';
      import type { User } from './types';
      import * as utils from './utils';

      export interface Config {
        id: string;
      }

      export const DEFAULT_COUNT = 42;

      export function calculate(a: number, b: number): number {
        return a + b;
      }

      export default class Engine {
        start() {}
      }
    `;

    const result = typescriptParser.parse({
      filePath: 'src/engine.ts',
      source: code,
      language: 'typescript',
    });

    expect(result.parseStatus).toBe('success');
    expect(result.lineCount).toBeGreaterThan(10);

    // Imports
    const specifiers = result.imports.map((i) => i.specifier);
    expect(specifiers).toContain('react');
    expect(specifiers).toContain('./types');
    expect(specifiers).toContain('./utils');

    // Exports
    const exportNames = result.exports.map((e) => e.name);
    expect(exportNames).toContain('Config');
    expect(exportNames).toContain('DEFAULT_COUNT');
    expect(exportNames).toContain('calculate');
    expect(exportNames).toContain('default');

    // Symbols
    const symbolNames = result.symbols.map((s) => s.name);
    expect(symbolNames).toContain('Config');
    expect(symbolNames).toContain('DEFAULT_COUNT');
    expect(symbolNames).toContain('calculate');
    expect(symbolNames).toContain('Engine');
  });
});

describe('Python Parser', () => {
  it('extracts imports, classes, and functions from Python source', () => {
    const pyCode = `
import os
import sys
from collections import defaultdict, OrderedDict
from .helpers import sanitize_path

class ModelEvaluator:
    def __init__(self, name):
        self.name = name

    def evaluate(self, data):
        return len(data)

def train_model(epochs=10):
    pass
`;

    const result = pythonParser.parse({
      filePath: 'analysis/model.py',
      source: pyCode,
      language: 'python',
    });

    expect(result.parseStatus).toBe('success');

    // Imports
    const specifiers = result.imports.map((i) => i.specifier);
    expect(specifiers).toContain('os');
    expect(specifiers).toContain('sys');
    expect(specifiers).toContain('collections');
    expect(specifiers).toContain('.helpers');

    // Symbols
    const symbolNames = result.symbols.map((s) => s.name);
    expect(symbolNames).toContain('ModelEvaluator');
    expect(symbolNames).toContain('evaluate');
    expect(symbolNames).toContain('train_model');

    // Exported symbols (public names)
    const exportNames = result.exports.map((e) => e.name);
    expect(exportNames).toContain('ModelEvaluator');
    expect(exportNames).toContain('train_model');
  });
});

describe('JSON Parser', () => {
  it('extracts package.json dependencies and scripts as symbols', () => {
    const pkgJson = JSON.stringify({
      name: 'test-app',
      version: '1.0.0',
      dependencies: {
        react: '^19.0.0',
        zustand: '^5.0.0',
      },
      devDependencies: {
        vitest: '^5.0.0',
      },
      scripts: {
        build: 'next build',
      },
    });

    const result = jsonParser.parse({
      filePath: 'package.json',
      source: pkgJson,
      language: 'json',
    });

    expect(result.parseStatus).toBe('success');
    expect(result.imports.map((i) => i.specifier)).toEqual(
      expect.arrayContaining(['react', 'zustand', 'vitest'])
    );
    expect(result.symbols.some((s) => s.name === 'test-app')).toBe(true);
  });
});

describe('CSS Parser', () => {
  it('extracts @import declarations', () => {
    const css = `
      @import './variables.css';
      @import url("https://fonts.googleapis.com/css2?family=Inter");
      @use 'theme' as t;

      .card {
        color: var(--primary);
      }
    `;

    const result = cssParser.parse({
      filePath: 'src/styles/main.css',
      source: css,
      language: 'css',
    });

    expect(result.parseStatus).toBe('success');
    const specifiers = result.imports.map((i) => i.specifier);
    expect(specifiers).toContain('./variables.css');
    expect(specifiers).toContain('https://fonts.googleapis.com/css2?family=Inter');
    expect(specifiers).toContain('theme');
  });
});

describe('Fallback Parser', () => {
  it('returns valid metadata without errors for plain text or unsupported languages', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const result = fallbackParser.parse({
      filePath: 'notes.txt',
      source: text,
      language: 'unknown',
    });

    expect(result.parseStatus).toBe('unsupported');
    expect(result.lineCount).toBe(3);
    expect(result.imports).toEqual([]);
    expect(result.symbols).toEqual([]);
  });
});
