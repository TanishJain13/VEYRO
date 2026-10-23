/**
 * POST /api/repository
 * Validates repository URL and resolves branch to pinned commit SHA.
 */
import { NextRequest } from 'next/server';
import { repositoryRequestSchema, parseGitHubUrl } from '@/lib/validation/api-schemas';
import { resolveRepository } from '@/lib/github/repository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = repositoryRequestSchema.parse(body);

    const parsed = parseGitHubUrl(validated.url);
    if (!parsed) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid GitHub repository URL', 400);
    }

    const branch = validated.branch || parsed.branch;
    const resolved = await resolveRepository(
      parsed.owner,
      parsed.repo,
      branch,
      req.signal
    );

    return createSuccessResponse(resolved);
  } catch (err) {
    return handleApiError(err);
  }
}
