-- DebtVision: profilo finanziario per utente (Fase 13)
-- Esegui nel SQL Editor del progetto Supabase DebtVision.

create table if not exists public.financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  financial_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_profiles_user_id_key unique (user_id)
);

create index if not exists financial_profiles_user_id_idx
  on public.financial_profiles (user_id);

alter table public.financial_profiles enable row level security;

create policy "financial_profiles_select_own"
  on public.financial_profiles
  for select
  using (auth.uid() = user_id);

create policy "financial_profiles_insert_own"
  on public.financial_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "financial_profiles_update_own"
  on public.financial_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "financial_profiles_delete_own"
  on public.financial_profiles
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_financial_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists financial_profiles_updated_at on public.financial_profiles;

create trigger financial_profiles_updated_at
  before update on public.financial_profiles
  for each row
  execute function public.set_financial_profiles_updated_at();
