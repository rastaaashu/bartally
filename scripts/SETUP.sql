-- Kalinka live-sync schema (single site). Run once in Supabase → SQL Editor → Run.
create table if not exists kv_settings (id int primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists categories (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists items      (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists employees  (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists sales      (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists restocks   (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists waste      (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists counts     (id text primary key, data jsonb not null, updated_at timestamptz not null default now());

do $$ declare t text;
begin
  foreach t in array array['kv_settings','categories','items','employees','sales','restocks','waste','counts'] loop
    execute format('alter table %I enable row level security', t);
    begin execute format('create policy site_all on %I for all to anon using (true) with check (true)', t);
    exception when duplicate_object then null; end;
    begin execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;
