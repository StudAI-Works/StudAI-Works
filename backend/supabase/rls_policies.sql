-- Supabase RLS policies for StudAI Works
-- Where to run: Supabase Dashboard → SQL Editor (paste and run the whole file)

-- Projects table: owners only
alter table if exists public.projects enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_select_own'
  ) then
    create policy projects_select_own on public.projects
      for select to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_insert_own'
  ) then
    create policy projects_insert_own on public.projects
      for insert to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_update_own'
  ) then
    create policy projects_update_own on public.projects
      for update to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_delete_own'
  ) then
    create policy projects_delete_own on public.projects
      for delete to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

-- Versions table: access via owning project
alter table if exists public.versions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'versions_select_own' and tablename='versions') then
    create policy versions_select_own on public.versions
      for select to authenticated
      using (exists (
        select 1 from public.projects p where p.id = versions.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'versions_insert_own' and tablename='versions') then
    create policy versions_insert_own on public.versions
      for insert to authenticated
      with check (exists (
        select 1 from public.projects p where p.id = versions.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'versions_update_own' and tablename='versions') then
    create policy versions_update_own on public.versions
      for update to authenticated
      using (exists (
        select 1 from public.projects p where p.id = versions.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'versions_delete_own' and tablename='versions') then
    create policy versions_delete_own on public.versions
      for delete to authenticated
      using (exists (
        select 1 from public.projects p where p.id = versions.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

-- Artifacts table: access via owning project
alter table if exists public.artifacts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'artifacts_select_own' and tablename='artifacts') then
    create policy artifacts_select_own on public.artifacts
      for select to authenticated
      using (exists (
        select 1 from public.projects p where p.id = artifacts.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'artifacts_insert_own' and tablename='artifacts') then
    create policy artifacts_insert_own on public.artifacts
      for insert to authenticated
      with check (exists (
        select 1 from public.projects p where p.id = artifacts.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'artifacts_update_own' and tablename='artifacts') then
    create policy artifacts_update_own on public.artifacts
      for update to authenticated
      using (exists (
        select 1 from public.projects p where p.id = artifacts.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'artifacts_delete_own' and tablename='artifacts') then
    create policy artifacts_delete_own on public.artifacts
      for delete to authenticated
      using (exists (
        select 1 from public.projects p where p.id = artifacts.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

-- Edits metadata: access via owning project
alter table if exists public.edits enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'edits_select_own' and tablename='edits') then
    create policy edits_select_own on public.edits
      for select to authenticated
      using (exists (
        select 1 from public.projects p where p.id = edits.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'edits_insert_own' and tablename='edits') then
    create policy edits_insert_own on public.edits
      for insert to authenticated
      with check (exists (
        select 1 from public.projects p where p.id = edits.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'edits_update_own' and tablename='edits') then
    create policy edits_update_own on public.edits
      for update to authenticated
      using (exists (
        select 1 from public.projects p where p.id = edits.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'edits_delete_own' and tablename='edits') then
    create policy edits_delete_own on public.edits
      for delete to authenticated
      using (exists (
        select 1 from public.projects p where p.id = edits.project_id and p.user_id = auth.uid()
      ));
  end if;
end $$;
