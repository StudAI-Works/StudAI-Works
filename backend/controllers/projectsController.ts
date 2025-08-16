import { Request, Response } from 'express'
import supabase from '../supabase/supabase'
import { parseAiMarkdown } from '../utils/aiMarkdownParser'
import { AuthenticatedRequest } from '../middleware/authMiddleware'
import axios from 'axios'

export const saveGeneratedOutput = async (req: AuthenticatedRequest & Request, res: Response) => {
    try {
        const REQUIRE_AUTH_PROJECTS = (process.env.REQUIRE_AUTH_PROJECTS || 'true').toLowerCase() !== 'false'
        const userId = req.user?.id
        // In dev (REQUIRE_AUTH_PROJECTS=false), allow saving without auth by assigning a fallback user id
        const fallbackUserId = process.env.DEV_FALLBACK_USER_ID || '00000000-0000-0000-0000-000000000000'
        const ownerUserId = (REQUIRE_AUTH_PROJECTS ? userId : (userId || fallbackUserId))
        if (REQUIRE_AUTH_PROJECTS && !userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const projectId = (req.params as any)?.id as string | undefined
        const { markdown, title } = ((req as unknown as Request).body || {}) as { markdown: string; title?: string }
        if (!markdown) {
            res.status(400).json({ error: 'markdown is required' })
            return
        }

        // Ensure project exists and belongs to user (or create if id not provided/new)
        let project
        if (!projectId || projectId === 'new') {
            if (!title) {
                res.status(400).json({ error: 'title is required to create a new project' })
                return
            }
            const create = await supabase.from('projects').insert({ user_id: ownerUserId, title, status: 'draft' }).select('*').single()
            if (create.error) throw create.error
            project = create.data
        } else {
            const existing = await supabase.from('projects').select('*').eq('id', projectId).single()
            if (existing.error) {
                res.status(404).json({ error: 'Project not found' })
                return
            }
            // Enforce ownership only when auth is required
            if (REQUIRE_AUTH_PROJECTS) {
                if (existing.data.user_id !== userId) {
                    res.status(403).json({ error: 'Forbidden' })
                    return
                }
            }
            project = existing.data
        }

        // Determine next version number
        const { data: versions, error: vErr } = await supabase
            .from('versions')
            .select('number')
            .eq('project_id', project.id)
            .order('number', { ascending: false })
            .limit(1)
        if (vErr) throw vErr
        const nextNumber = versions && versions.length > 0 ? (versions[0].number + 1) : 1

        const files = parseAiMarkdown(markdown)

        // Insert new version
        const { data: version, error: iVerErr } = await supabase
            .from('versions')
            .insert({ project_id: project.id, number: nextNumber, summary: `Generated version ${nextNumber}` })
            .select('*')
            .single()
        if (iVerErr) throw iVerErr

        // Insert artifacts
        const artifacts = files.map(f => ({ project_id: project.id, version_id: version.id, path: f.path, content: f.content, sha256: f.sha256 }))
        const { error: artErr } = await supabase.from('artifacts').insert(artifacts)
        if (artErr) throw artErr

        // Update project status and timestamp
        await supabase.from('projects').update({ status: 'ready', updated_at: new Date().toISOString() }).eq('id', project.id)

        res.status(200).json({ project_id: project.id, version: nextNumber, file_count: files.length })
    } catch (err: any) {
        console.error('saveGeneratedOutput error', err)
        res.status(500).json({ error: err.message || 'Failed to save generated output' })
    }
}

// List projects for the authenticated user with latest version number
export const listProjects = async (req: AuthenticatedRequest & Request, res: Response) => {
    try {
        const userId = req.user?.id
        const REQUIRE_AUTH_PROJECTS = (process.env.REQUIRE_AUTH_PROJECTS || 'true').toLowerCase() !== 'false'

        const query = supabase
            .from('projects')
            .select('id, title, status, created_at, updated_at, user_id')
            .order('updated_at', { ascending: false })
            .limit(50)

        if (REQUIRE_AUTH_PROJECTS) {
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' })
                return
            }
            query.eq('user_id', userId)
        }

        const { data: projects, error: projErr } = await query

        if (projErr) throw projErr

        if (!projects || projects.length === 0) {
            res.status(200).json([])
            return
        }

        const projectIds = projects.map(p => p.id)
        const { data: versions, error: verErr } = await supabase
            .from('versions')
            .select('project_id, number')
            .in('project_id', projectIds)
            .order('number', { ascending: false })

        if (verErr) throw verErr

        const latestByProject: Record<string, number> = {}
        for (const v of versions || []) {
            if (latestByProject[v.project_id] == null) {
                latestByProject[v.project_id] = v.number as unknown as number
            }
        }

        const result = projects.map((p: any) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            created_at: p.created_at,
            updated_at: p.updated_at,
            latest_version: latestByProject[p.id] || 0,
        }))

        res.status(200).json(result)
    } catch (err: any) {
        console.error('listProjects error', err)
        res.status(500).json({ error: err.message || 'Failed to list projects' })
    }
}

// Get project detail with versions and latest version artifacts
export const getProjectDetail = async (req: AuthenticatedRequest & Request, res: Response) => {
    try {
        const userId = req.user?.id
        const REQUIRE_AUTH_PROJECTS = (process.env.REQUIRE_AUTH_PROJECTS || 'true').toLowerCase() !== 'false'
        const projectId = (req.params as any)?.id as string | undefined

        if (REQUIRE_AUTH_PROJECTS && !userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }
        if (!projectId) {
            res.status(400).json({ error: 'project id is required' })
            return
        }

        const { data: project, error: projErr } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()
        if (projErr) throw projErr
        if (!project) {
            res.status(404).json({ error: 'Project not found' })
            return
        }
        if (REQUIRE_AUTH_PROJECTS && project.user_id !== userId) {
            res.status(403).json({ error: 'Forbidden' })
            return
        }

        const { data: versions, error: verErr } = await supabase
            .from('versions')
            .select('id, number, summary, created_at')
            .eq('project_id', projectId)
            .order('number', { ascending: false })
        if (verErr) throw verErr

        let artifacts: Array<{ path: string; content: string; sha256: string | null }> = []
        let latest_version = 0

        if (versions && versions.length > 0) {
            latest_version = versions[0].number as unknown as number
            const latestVersionId = versions[0].id
            const { data: arts, error: artErr } = await supabase
                .from('artifacts')
                .select('path, content, sha256')
                .eq('version_id', latestVersionId)
                .order('path', { ascending: true })
            if (artErr) throw artErr
            artifacts = (arts || []) as any
        }

        res.status(200).json({ project: { id: project.id, title: project.title, status: project.status, created_at: project.created_at, updated_at: project.updated_at }, latest_version, versions: versions || [], artifacts })
    } catch (err: any) {
        console.error('getProjectDetail error', err)
        res.status(500).json({ error: err.message || 'Failed to get project detail' })
    }
}

// Helper to resolve FastAPI base like in route.ts
const getFastApiBase = (): string => {
    const RAW_FASTAPI_URL = process.env.FASTAPI_URL;
    const FASTAPI_HOST = process.env.FASTAPI_HOST || 'localhost';
    const FASTAPI_PORT = process.env.FASTAPI_PORT || '8000';
    if (RAW_FASTAPI_URL) return RAW_FASTAPI_URL.replace(/\/$/, '');
    if (/^https?:\/\//i.test(FASTAPI_HOST)) {
        return FASTAPI_HOST.replace(/\/$/, '');
    }
    const hostPart = FASTAPI_HOST.split(':')[0];
    return `http://${hostPart}:${FASTAPI_PORT}`;
}

// Simple heuristics to pick relevant files based on instructions/error
const pickRelevantFiles = (
    files: Array<{ path: string; content: string }>,
    instructions?: string,
    error?: string,
    maxFiles: number = 12
) => {
    const text = `${instructions || ''}\n\n${error || ''}`.toLowerCase();
    const score = new Map<string, number>();

    const bump = (p: string, inc = 1) => score.set(p, (score.get(p) || 0) + inc);

    // 1) Direct filepath mentions in instructions/error
    const pathLike = text.match(/([\w-]+\/(?:[\w.-]+\/)*[\w.-]+\.(?:ts|tsx|js|jsx|css|json|py))/g) || [];
    for (const m of pathLike) {
        const normalized = m.replace(/^\.\//, '').replace(/^\/(frontend|backend)\//, '');
        for (const f of files) {
            if (f.path.toLowerCase().includes(normalized.toLowerCase())) bump(f.path, 10);
        }
    }

    // 2) CSS/styling cues
    const cssCues = /(color|background|shadow|border|font|spacing|theme|dark|light|tailwind|css)/i.test(text);
    if (cssCues) {
        for (const f of files) {
            if (/\.(css)$/.test(f.path) || /globals?\.css|index\.css|app\.css/i.test(f.path)) bump(f.path, 5);
        }
    }

    // 3) Frontend cues
    const feCues = /(component|react|tsx|jsx|ui|button|page|layout|frontend)/i.test(text);
    if (feCues) {
        for (const f of files) {
            if (/frontend\//i.test(f.path) || /\.(tsx|jsx|ts|js|css)$/.test(f.path)) bump(f.path, 2);
        }
    }

    // 4) Backend cues
    const beCues = /(backend|api|server|express|python|fastapi|main\.py)/i.test(text);
    if (beCues) {
        for (const f of files) {
            if (/backend\//i.test(f.path) || /main\.py$/i.test(f.path)) bump(f.path, 2);
        }
    }

    // 5) Error stack paths like /src/...:line
    const stackPaths = text.match(/(frontend|backend)?\/?src\/[\w\/-]+\.(tsx|ts|jsx|js|css|json)/g) || [];
    for (const sp of stackPaths) {
        for (const f of files) {
            if (f.path.toLowerCase().includes(sp.toLowerCase())) bump(f.path, 8);
        }
    }

    // 6) Always give slight preference to entry points
    const entryNames = ['App.tsx', 'App.jsx', 'index.tsx', 'index.jsx', 'main.tsx', 'index.css'];
    for (const f of files) {
        if (entryNames.some(n => f.path.endsWith(n))) bump(f.path, 1);
    }

    // If nothing scored, fallback to a small set of likely important files
    let sorted = [...files]
        .map(f => ({ f, s: score.get(f.path) || 0 }))
        .sort((a, b) => b.s - a.s)
        .map(x => x.f);

    if (!sorted.length || (sorted[0] && (score.get(sorted[0].path) || 0) === 0)) {
        const fallback = files.filter(f =>
            /App\.(tsx|jsx)$/.test(f.path) || /index\.(tsx|jsx|css)$/.test(f.path)
        );
        sorted = fallback.length ? fallback : files.slice(0, Math.min(files.length, maxFiles));
    }

    // Include neighbors from the same folder for top matches (context)
    const picked: Array<{ path: string; content: string }> = [];
    const byDir = new Map<string, Array<{ path: string; content: string }>>();
    for (const f of files) {
        const dir = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : '';
        const list = byDir.get(dir) || [];
        list.push(f);
        byDir.set(dir, list);
    }
    for (const f of sorted) {
        if (picked.length >= maxFiles) break;
        picked.push(f);
        const dir = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : '';
        const siblings = (byDir.get(dir) || []).filter(s => s.path !== f.path);
        for (const s of siblings) {
            if (picked.length >= maxFiles) break;
            // only add sibling if CSS cue or same extension
            if (cssCues || s.path.split('.').pop() === f.path.split('.').pop()) picked.push(s);
        }
    }

    // De-duplicate
    const seen = new Set<string>();
    const unique = picked.filter(p => (seen.has(p.path) ? false : (seen.add(p.path), true)));
    return unique.slice(0, maxFiles);
}

// Edit/Improve current project code by prompting AI and creating a new version
export const editProject = async (req: AuthenticatedRequest & Request, res: Response) => {
    try {
        const userId = req.user?.id
        const REQUIRE_AUTH_PROJECTS = (process.env.REQUIRE_AUTH_PROJECTS || 'true').toLowerCase() !== 'false'
        const projectId = (req.params as any)?.id as string | undefined
        const { instructions, error } = ((req as unknown as Request).body || {}) as { instructions?: string; error?: string }

        if (REQUIRE_AUTH_PROJECTS && !userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }
        if (!projectId) {
            res.status(400).json({ error: 'project id is required' })
            return
        }
        if (!instructions && !error) {
            res.status(400).json({ error: 'instructions or error is required' })
            return
        }

        // Validate ownership
        const { data: project, error: projErr } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()
        if (projErr) throw projErr
        if (!project) {
            res.status(404).json({ error: 'Project not found' })
            return
        }
        if (REQUIRE_AUTH_PROJECTS && project.user_id !== userId) {
            res.status(403).json({ error: 'Forbidden' })
            return
        }

        // Get latest version and its artifacts
        const { data: versions, error: verErr } = await supabase
            .from('versions')
            .select('id, number')
            .eq('project_id', projectId)
            .order('number', { ascending: false })
            .limit(1)
        if (verErr) throw verErr

        if (!versions || versions.length === 0) {
            res.status(400).json({ error: 'No versions found. Please save an initial version before editing.' })
            return
        }
        const latestVersion = versions[0]

        const { data: arts, error: artErr } = await supabase
            .from('artifacts')
            .select('path, content, sha256')
            .eq('version_id', latestVersion.id)
        if (artErr) throw artErr
        const currentFiles = (arts || []).map(a => ({ path: a.path as string, content: a.content as string }))

        // Build a file index (paths only) and pick relevant files to reduce tokens
        const fileIndex = currentFiles.map(f => f.path).sort();
        const relevant = pickRelevantFiles(currentFiles, instructions, error, 12);

        // Call AI edit service with only relevant files + a project file index
        const FAST_API = getFastApiBase()
        const aiRes = await axios.post(`${FAST_API}/edit`, {
            instructions: instructions || '',
            error: error || '',
            files: relevant,
            file_paths: fileIndex,
        }, { headers: { 'Content-Type': 'application/json' } })

        const aiData: any = aiRes.data as any
        const aiMarkdown: string = typeof aiData === 'string' ? (aiData as string) : (aiData?.markdown || '')
        if (!aiMarkdown) {
            res.status(502).json({ error: 'AI edit service returned empty response' })
            return
        }

        // Parse changed files from AI output
        const changedFiles = parseAiMarkdown(aiMarkdown)
        if (!changedFiles || changedFiles.length === 0) {
            res.status(502).json({ error: 'AI did not return any updated files' })
            return
        }

        // Merge: apply changed files over current files
        const fileMap = new Map<string, { path: string; content: string }>()
        for (const f of currentFiles) fileMap.set(f.path, { path: f.path, content: f.content })
        for (const cf of changedFiles) fileMap.set(cf.path, { path: cf.path, content: cf.content })
        const mergedFiles = Array.from(fileMap.values())

        // Compute next version
        const nextNumber = (latestVersion.number as unknown as number) + 1
        const { data: version, error: iVerErr } = await supabase
            .from('versions')
            .insert({ project_id: project.id, number: nextNumber, summary: `Edit: ${instructions?.slice(0, 80) || 'Fix error'}` })
            .select('*')
            .single()
        if (iVerErr) throw iVerErr

        // Insert artifacts for merged files
        const toInsert = mergedFiles.map(f => ({
            project_id: project.id,
            version_id: version.id,
            path: f.path,
            content: f.content,
            sha256: '' as any, // optional; DB column allows null
        }))
        const { error: insErr } = await supabase.from('artifacts').insert(toInsert)
        if (insErr) throw insErr

        // Update project updated_at
        await supabase.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', project.id)

        // Record edit metadata (best-effort)
        await supabase.from('edits').insert({
            project_id: project.id,
            version_from: latestVersion.number,
            version_to: nextNumber,
            prompt: instructions || error || 'edit',
            diff_summary: changedFiles.map(f => f.path).join(', ')
        })

        res.status(200).json({
            project_id: project.id,
            version: nextNumber,
            changed_count: changedFiles.length,
            file_count: mergedFiles.length,
            artifacts: mergedFiles.map(f => ({ path: f.path, content: f.content })),
        })
    } catch (err: any) {
        console.error('editProject error', err)
        const status = err.response?.status || 500
        const message = err.response?.data?.error || err.message || 'Failed to apply edit'
        res.status(status).json({ error: message })
    }
}
