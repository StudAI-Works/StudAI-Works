-- Supabase schema for persisting projects, conversations, versions, and artifacts
-- Run this in Supabase SQL editor (one-time).

-- Enable UUID generation (if not already enabled)
create extension if not exists "uuid-ossp";

-- Projects owned by users
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  title text,
  status text not null default 'draft', -- draft | ready | failed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_status on public.projects(status);

-- Conversations per project (refine | generate | edit)
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase text not null check (phase in ('refine','generate','edit')),
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_project_id on public.conversations(project_id);

-- Messages per conversation
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('system','user','assistant')),
  content text not null,
  token_counts jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);

-- Versions per project (1..N)
create table if not exists public.versions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  number int not null,
  summary text,
  created_at timestamptz not null default now(),
  unique(project_id, number)
);

create index if not exists idx_versions_project_id on public.versions(project_id);

-- Artifacts (files) per version
create table if not exists public.artifacts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_id uuid not null references public.versions(id) on delete cascade,
  path text not null,
  content text not null,
  sha256 text,
  created_at timestamptz not null default now(),
  unique(version_id, path)
);

create index if not exists idx_artifacts_project_id on public.artifacts(project_id);
create index if not exists idx_artifacts_version_id on public.artifacts(version_id);

-- Edits metadata (AI edit/fix prompts producing new versions)
create table if not exists public.edits (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_from int not null,
  version_to int not null,
  prompt text,
  diff_summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_edits_project_id on public.edits(project_id);

-- Optional: Row Level Security (enable when using anon keys directly from client)
-- alter table public.projects enable row level security;
-- create policy "Projects are viewable by owner" on public.projects
--   for select using (auth.uid() = user_id);
-- create policy "Projects are insertable by owner" on public.projects
--   for insert with check (auth.uid() = user_id);
-- create policy "Projects are updatable by owner" on public.projects
--   for update using (auth.uid() = user_id);
-- create policy "Projects are deletable by owner" on public.projects
--   for delete using (auth.uid() = user_id);

-- NOTE: Backend uses the service role key and can bypass RLS; keep RLS disabled until exposing read paths to the client.
