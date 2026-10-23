/**
 * Deterministic sample repository fixture.
 * Used for testing and for the "Try sample repository" feature.
 */
import type { ResolvedRepository } from '@/lib/github/repository';
import type { RepositoryTreeNode } from '@/types/repository';

export const SAMPLE_REPO_OWNER = 'veyro-sample';
export const SAMPLE_REPO_NAME = 'fixture';
export const SAMPLE_REPO_URL = `https://github.com/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`;
export const SAMPLE_COMMIT_SHA = 'sample0000000000000000000000000000fixture';

export const SAMPLE_FILES: Record<string, string> = {
  // 1. Entry point module
  'src/index.ts': `import { authenticate } from './services/auth';
import { getUser } from './services/user';

export function main() {
  const user = authenticate('admin', 'secret');
  return getUser(user.id);
}
`,

  // 2. Auth service (participates in cycle with user)
  'src/services/auth.ts': `import { getUserProfile } from './user';
import { generateToken } from './token';

export function authenticate(u: string, p: string) {
  const token = generateToken(u);
  return { id: 'u1', profile: getUserProfile('u1'), token };
}
`,

  // 3. User service (participates in cycle with auth)
  'src/services/user.ts': `import { authenticate } from './auth';

export function getUser(id: string) {
  return { id, name: 'Alice' };
}

export function getUserProfile(id: string) {
  return { id, verified: true };
}
`,

  // 4. Token service (imports crypto and an unresolved relative import)
  'src/services/token.ts': `import { hashSecret } from '../utils/crypto';
import { nonexistentHelper } from './missing-helper';

export function generateToken(id: string) {
  return hashSecret(id);
}
`,

  // 5. Crypto utility (imports node stdlib and external package)
  'src/utils/crypto.ts': `import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}
`,

  // 6. File with syntax error
  'src/broken.ts': `export function broken( {
  const x = ;
  return ;
`,

  // 7. Unsupported / markdown file
  'README.md': `# Sample Fixture Repository
This is a test fixture repository demonstrating VEYRO's dependency analysis, cycle detection, and error diagnostics.
`,

  // 8. Package.json configuration file
  'package.json': JSON.stringify(
    {
      name: 'fixture-repo',
      version: '1.0.0',
      dependencies: {
        bcrypt: '^5.0.0',
      },
    },
    null,
    2
  ),
};

export const SAMPLE_RESOLVED_REPO: ResolvedRepository = {
  metadata: {
    owner: SAMPLE_REPO_OWNER,
    name: SAMPLE_REPO_NAME,
    fullName: `${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`,
    description: 'Deterministic sample repository for architectural exploration and testing',
    defaultBranch: 'main',
    primaryLanguage: 'TypeScript',
    isPrivate: false,
    visibility: 'public',
    stars: 128,
    forks: 32,
    url: SAMPLE_REPO_URL,
  },
  branch: 'main',
  commitSha: SAMPLE_COMMIT_SHA,
  rateLimit: null,
};

export function getSampleTreeNodes(): RepositoryTreeNode[] {
  return Object.keys(SAMPLE_FILES).map((path) => {
    const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
    const lang =
      ext === '.ts' ? 'typescript' : ext === '.json' ? 'json' : ext === '.md' ? 'markdown' : null;
    return {
      path,
      name: path.split('/').pop() || path,
      type: 'file',
      size: SAMPLE_FILES[path].length,
      language: lang,
    };
  });
}

export interface ShowcaseNode {
  id: string;
  label: string;
  language: string;
  inDegree: number;
  outDegree: number;
}

export const SAMPLE_SHOWCASE_METRICS = {
  totalFilesDiscovered: 8,
  totalFilesAnalyzed: 6,
  coveragePercentage: 83.3,
  nodes: [
    { id: 'src/index.ts', label: 'src/index.ts', language: 'typescript', inDegree: 0, outDegree: 2 },
    { id: 'src/services/auth.ts', label: 'src/services/auth.ts', language: 'typescript', inDegree: 2, outDegree: 2 },
    { id: 'src/services/user.ts', label: 'src/services/user.ts', language: 'typescript', inDegree: 2, outDegree: 1 },
    { id: 'src/services/token.ts', label: 'src/services/token.ts', language: 'typescript', inDegree: 1, outDegree: 2 },
    { id: 'src/utils/crypto.ts', label: 'src/utils/crypto.ts', language: 'typescript', inDegree: 1, outDegree: 2 },
    { id: 'package.json', label: 'package.json', language: 'json', inDegree: 0, outDegree: 1 },
  ] as ShowcaseNode[],
};
