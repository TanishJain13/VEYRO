import { describe, it, expect } from 'vitest';
import { analyzeRepository } from '@/lib/analysis/analyze-repository';

const isLiveTestEnabled = process.env.VEYRO_LIVE_TESTS === '1';
const itLive = isLiveTestEnabled ? it : it.skip;

describe('Live GitHub Smoke Test', () => {
  itLive('connects to GitHub and analyzes octocat/Hello-World', async () => {
    const result = await analyzeRepository({
      owner: 'octocat',
      repo: 'Hello-World',
    });

    expect(result.repository.fullName).toBe('octocat/Hello-World');
    expect(result.repository.commitSha).toHaveLength(40);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.coverage.totalFiles).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);
  }, 20000);
});
