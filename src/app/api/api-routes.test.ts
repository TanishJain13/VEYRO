import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as handleRepository } from './repository/route';
import { GET as handleTree } from './tree/route';
import { GET as handleFile } from './file/route';
import { POST as handleAnalyze } from './analyze/route';

describe('API Route Handlers', () => {
  it('POST /api/repository rejects missing or invalid URLs', async () => {
    const req = new NextRequest('http://localhost:3000/api/repository', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://gitlab.com/owner/repo' }),
    });

    const res = await handleRepository(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/tree validates query parameters', async () => {
    const req = new NextRequest('http://localhost:3000/api/tree?owner=&repo=test&sha=123');
    const res = await handleTree(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/file rejects path traversal attempts', async () => {
    const req = new NextRequest('http://localhost:3000/api/file?owner=test&repo=repo&sha=123&path=../../etc/passwd');
    const res = await handleFile(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('VALIDATION_ERROR');
    expect(json.error?.details).toContain('Path traversal not allowed');
  });

  it('POST /api/analyze validates required schema parameters', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ owner: 'test' }), // Missing repo, sha, branch
    });

    const res = await handleAnalyze(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('VALIDATION_ERROR');
  });
});
