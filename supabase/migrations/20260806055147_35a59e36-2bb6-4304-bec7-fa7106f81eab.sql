
alter table public.profiles add column if not exists name_changes timestamptz[] not null default '{}';
alter table public.creator_pages add column if not exists name_changed_at timestamptz;
alter table public.creator_pages add column if not exists gifts_enabled boolean not null default false;
alter table public.creator_pages add column if not exists ads_enabled boolean not null default false;
alter table public.posts add column if not exists watch_seconds bigint not null default 0;

create or replace function public.enforce_profile_name_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent timestamptz[];
begin
  if new.display_name is distinct from old.display_name then
    select coalesce(array_agg(t), '{}') into recent
      from unnest(coalesce(old.name_changes,'{}'::timestamptz[])) t
      where t > now() - interval '90 days';
    if array_length(recent,1) >= 2 then
      raise exception 'You can only change your name twice every 90 days';
    end if;
    new.name_changes := recent || now();
  else
    new.name_changes := old.name_changes;
  end if;
  return new;
end; $$;

drop trigger if exists profiles_name_limit on public.profiles;
create trigger profiles_name_limit before update on public.profiles
for each row execute function public.enforce_profile_name_limit();

create or replace function public.enforce_page_name_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.name is distinct from old.name then
    if old.name_changed_at is not null and old.name_changed_at > now() - interval '90 days' then
      raise exception 'A Creator Page name can only be changed once every 90 days';
    end if;
    new.name_changed_at := now();
  else
    new.name_changed_at := old.name_changed_at;
  end if;
  return new;
end; $$;

drop trigger if exists creator_pages_name_limit on public.creator_pages;
create trigger creator_pages_name_limit before update on public.creator_pages
for each row execute function public.enforce_page_name_limit();

do $$ begin
  create type public.monetization_program as enum ('gifts','ads');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.monetization_applications (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  program public.monetization_program not null,
  status public.application_status not null default 'pending',
  note text not null default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, program)
);

grant select, insert, update, delete on public.monetization_applications to authenticated;
grant all on public.monetization_applications to service_role;
alter table public.monetization_applications enable row level security;

create policy "own or admin applications" on public.monetization_applications
  for select to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "apply for own page" on public.monetization_applications
  for insert to authenticated with check (owner_id = auth.uid());
create policy "admins review applications" on public.monetization_applications
  for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "withdraw own application" on public.monetization_applications
  for delete to authenticated using (owner_id = auth.uid() and status = 'pending');

create trigger monetization_applications_updated before update on public.monetization_applications
for each row execute function public.set_updated_at();
