// /frontend/src/utils/parseAIResponse.ts
export interface GeneratedFile {
  path: string;
  content: string;
  name: string;
}

export const parseAIResponse = (response: string): GeneratedFile[] => {
  const files: GeneratedFile[] = [];

  // 1) New format: #### path followed by fenced code
  const headerBlockRegex = /####\s+(.+?)\s*\n+```[\w-]*\n([\s\S]*?)\n```/g;
  let m: RegExpExecArray | null;
  while ((m = headerBlockRegex.exec(response)) !== null) {
    const rawPath = m[1].trim();
    const code = m[2];
    const normalized = normalizePath(rawPath);
    files.push({ path: normalized, content: code, name: basename(normalized) });
  }

  // 2) Legacy format: code fence with // path: /foo/bar
  const legacyRegex = /```[a-zA-Z-]*\s*\n\s*\/\/\s*path:\s*(.+?)\n([\s\S]*?)\n```/g;
  while ((m = legacyRegex.exec(response)) !== null) {
    const rawPath = m[1].trim();
    const code = m[2];
    const normalized = normalizePath(rawPath);
    files.push({ path: normalized, content: code, name: basename(normalized) });
  }

  // 3) Fallback: if nothing parsed, save as response.md for debugging
  if (files.length === 0 && response.trim()) {
    files.push({ path: '/response.md', content: response, name: 'response.md' });
  }

  // Small helper: ensure root files live under /app when likely Next.js or Vite app
  return files.map(f => ({ ...f, path: normalizeRootFile(f.path) }));
};

function basename(p: string): string {
  const parts = p.split('/')
    .filter(Boolean);
  return parts[parts.length - 1] || p;
}

function normalizePath(p: string): string {
  let out = p.replace(/\\/g, '/');
  if (!out.startsWith('/')) out = '/' + out;
  // collapse duplicate slashes
  out = out.replace(/\/+/g, '/');
  return out;
}

function normalizeRootFile(p: string): string {
  // if looks like a root file without directories (e.g., README.md or package.json), keep as-is
  const parts = p.split('/').filter(Boolean);
  if (parts.length <= 1) return p;
  return p;
}
