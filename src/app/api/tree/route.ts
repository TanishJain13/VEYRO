/**
 * GET /api/tree
 * Retrieves and filters the repository file tree for a pinned commit SHA.
 */
import { NextRequest } from 'next/server';
import { treeRequestSchema } from '@/lib/validation/api-schemas';
import { fetchRepositoryTree } from '@/lib/github/tree';
import { createSuccessResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = {
      owner: searchParams.get('owner') || '',
      repo: searchParams.get('repo') || '',
      sha: searchParams.get('sha') || '',
    };

    const validated = treeRequestSchema.parse(query);
    const { tree } = await fetchRepositoryTree(
      validated.owner,
      validated.repo,
      validated.sha,
      req.signal
    );

    return createSuccessResponse(tree);
  } catch (err) {
    return handleApiError(err);
  }
}
