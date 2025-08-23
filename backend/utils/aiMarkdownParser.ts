import crypto from 'crypto'

export interface ParsedFile {
    path: string
    content: string
    sha256: string
}

// Normalize common root-level files to frontend/backend folders
const fixPath = (path: string): string => {
    const p = path.trim().replace(/^'|'$/g, '')
    if (/^(vite\.config\.(ts|js)|tsconfig(\.json|\.app\.json|\.node\.json)|tailwind\.config\.(js|cjs|ts)|postcss\.config\.(js|cjs)|package\.json|index\.html)$/i.test(p)) {
        return `frontend/${p}`
    }
    if (/^(requirements\.txt|pyproject\.toml|main\.py|server\.(ts|js))$/i.test(p)) {
        return `backend/${p}`
    }
    return p
}

export function parseAiMarkdown(markdown: string): ParsedFile[] {
    const files: ParsedFile[] = []
    const seen = new Set<string>()
    const codeBlockRegex = /####\s*(.*?)\s*\n```([\w+-]+)?\n([\s\S]*?)```/g
    let match: RegExpExecArray | null

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
        const rawPath = (match[1] || '').trim()
        const content = (match[3] || '').trim()
        if (!rawPath || !content) continue
        const normalized = fixPath(rawPath)
        if (seen.has(normalized)) continue
        seen.add(normalized)
        const sha256 = crypto.createHash('sha256').update(content).digest('hex')
        files.push({ path: normalized, content, sha256 })
    }

    // Fallback: return entire markdown if nothing parsed
    if (files.length === 0) {
        const sha256 = crypto.createHash('sha256').update(markdown).digest('hex')
        files.push({ path: 'response.md', content: markdown, sha256 })
    }
    return files
}
