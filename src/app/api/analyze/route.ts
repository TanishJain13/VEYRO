/**
 * POST /api/analyze
 * Executes end-to-end repository parsing, import resolution, graph generation,
 * metrics, and findings synthesis.
 */
import { NextRequest } from 'next/server';
import { analyzeRequestSchema } from '@/lib/validation/api-schemas';
import { analyzeRepository } from '@/lib/analysis/analyze-repository';
import { createSuccessResponse, handleApiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = analyzeRequestSchema.parse(body);

    const result = await analyzeRepository({
      owner: validated.owner,
      repo: validated.repo,
      commitSha: validated.sha,
      branch: validated.branch,
      signal: req.signal,
    });

    return createSuccessResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
