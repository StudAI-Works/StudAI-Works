import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string | undefined

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

// Default service-role client (bypasses RLS); recommended for backend
const supabase = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : (() => { throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY; add it to .env for backend usage') })()

// Per-request DB client: prefer service role; otherwise anon with user token to satisfy RLS policies
export function getDbClient(userToken?: string): SupabaseClient {
  if (SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  }
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY; cannot create DB client')
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: userToken ? { headers: { Authorization: `Bearer ${userToken}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export default supabase
