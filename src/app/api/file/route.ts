/**
 * GET /api/file
 * Fetches raw content of a specific file from GitHub with path traversal prevention.
 */
import { NextRequest } from 'next/server';
import { fileRequestSchema } from '@/lib/validation/api-schemas';
import { githubFetchRaw } from '@/lib/github/client';
import { createSuccessResponse, handleApiError } from '@/lib/api/response';
import { LANGUAGE_MAP } from '@/lib/config';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = {
      owner: searchParams.get('owner') || '',
      repo: searchParams.get('repo') || '',
      sha: searchParams.get('sha') || '',
      path: searchParams.get('path') || '',
    };

    const validated = fileRequestSchema.parse(query);
    const content = await githubFetchRaw(
      validated.owner,
      validated.repo,
      validated.sha,
      validated.path,
      req.signal
    );

    const ext = validated.path.slice(validated.path.lastIndexOf('.')).toLowerCase();
    const language = LANGUAGE_MAP[ext] || 'text';

    return createSuccessResponse({
      path: validated.path,
      content,
      size: content.length,
      language,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
