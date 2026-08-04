
-- ENUMS
create type public.app_role as enum ('admin','moderator','user');
create type public.post_kind as enum ('clip','image');
create type public.post_visibility as enum ('friends','public');
create type public.video_format as enum ('short','long');
create type public.request_status as enum ('pending','accepted','declined');
create type public.ad_status as enum ('pending','approved','rejected');

-- UPDATED AT
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  avatar_url text,
  bio text default '',
  private_account boolean not null default true,
  friends_only_comments boolean not null default true,
  show_online boolean not null default true,
  last_seen timestamptz not null default now(),
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select to anon, authenticated using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- NEW USER TRIGGER
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email,'user'),'@',1)), '[^a-z0-9_]', '', 'g'));
  if base is null or base = '' then base := 'user'; end if;
  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, base || '_' || substr(new.id::text,1,6),
    coalesce(new.raw_user_meta_data->>'display_name', base),
    new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- CREATOR PAGES
create table public.creator_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  handle text unique not null,
  name text not null,
  avatar_url text,
  cover_url text,
  bio text default '',
  link_url text,
  verified boolean not null default false,
  featured boolean not null default false,
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.creator_pages to authenticated;
grant select on public.creator_pages to anon;
grant all on public.creator_pages to service_role;
alter table public.creator_pages enable row level security;
create policy "creator pages public" on public.creator_pages for select to anon, authenticated using (true);
create policy "create own page" on public.creator_pages for insert to authenticated with check (owner_id = auth.uid());
create policy "update own page" on public.creator_pages for update to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (true);
create policy "delete own page" on public.creator_pages for delete to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger creator_pages_updated before update on public.creator_pages for each row execute function public.set_updated_at();

-- FRIENDSHIPS
create table public.friendships (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);
grant select, delete on public.friendships to authenticated;
grant all on public.friendships to service_role;
alter table public.friendships enable row level security;
create policy "see own friendships" on public.friendships for select to authenticated using (user_id = auth.uid() or friend_id = auth.uid());
create policy "remove own friendships" on public.friendships for delete to authenticated using (user_id = auth.uid() or friend_id = auth.uid());

create or replace function public.are_friends(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friendships where user_id = _a and friend_id = _b);
$$;

-- FRIEND REQUESTS
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (from_user, to_user)
);
grant select, insert, update, delete on public.friend_requests to authenticated;
grant all on public.friend_requests to service_role;
alter table public.friend_requests enable row level security;
create policy "see own requests" on public.friend_requests for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());
create policy "send requests" on public.friend_requests for insert to authenticated with check (from_user = auth.uid() and to_user <> auth.uid());
create policy "respond to requests" on public.friend_requests for update to authenticated using (to_user = auth.uid()) with check (to_user = auth.uid());
create policy "cancel requests" on public.friend_requests for delete to authenticated using (from_user = auth.uid() or to_user = auth.uid());

-- BLOCKS
create table public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
grant select, insert, delete on public.blocks to authenticated;
grant all on public.blocks to service_role;
alter table public.blocks enable row level security;
create policy "own blocks" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "create block" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "remove block" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

-- ACCEPT REQUEST RPC
create or replace function public.accept_friend_request(_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.friend_requests;
begin
  select * into r from public.friend_requests where id = _request_id;
  if r is null or r.to_user <> auth.uid() then raise exception 'Not allowed'; end if;
  update public.friend_requests set status = 'accepted' where id = _request_id;
  insert into public.friendships (user_id, friend_id) values (r.from_user, r.to_user), (r.to_user, r.from_user)
    on conflict do nothing;
  insert into public.notifications (user_id, actor_id, kind, body)
    values (r.from_user, r.to_user, 'friend_accepted', 'accepted your friend request');
end; $$;

create or replace function public.remove_friend(_other uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.friendships where (user_id = auth.uid() and friend_id = _other) or (user_id = _other and friend_id = auth.uid());
  delete from public.friend_requests where (from_user = auth.uid() and to_user = _other) or (from_user = _other and to_user = auth.uid());
end; $$;

-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  creator_page_id uuid references public.creator_pages(id) on delete cascade,
  kind public.post_kind not null default 'clip',
  visibility public.post_visibility not null default 'friends',
  format public.video_format,
  media_url text not null,
  poster_url text,
  caption text default '',
  hashtags text[] not null default '{}',
  duration_seconds numeric,
  trim_start numeric not null default 0,
  trim_end numeric,
  views_count integer not null default 0,
  removed boolean not null default false,
  created_at timestamptz not null default now()
);
create index posts_public_idx on public.posts (visibility, created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "public posts readable" on public.posts for select to anon, authenticated using (visibility = 'public' and removed = false);
create policy "friend posts readable" on public.posts for select to authenticated using (
  author_id = auth.uid() or (visibility = 'friends' and removed = false and public.are_friends(auth.uid(), author_id))
);
create policy "create own posts" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "update own posts" on public.posts for update to authenticated using (author_id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (true);
create policy "delete own posts" on public.posts for delete to authenticated using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.post_visible(_post_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts p where p.id = _post_id and p.removed = false and (
      p.visibility = 'public' or p.author_id = auth.uid() or public.are_friends(auth.uid(), p.author_id)
    )
  );
$$;

create or replace function public.increment_post_view(_post_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set views_count = views_count + 1 where id = _post_id;
$$;

-- LIKES / SAVES / COMMENTS
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select, insert, delete on public.post_likes to authenticated;
grant select on public.post_likes to anon;
grant all on public.post_likes to service_role;
alter table public.post_likes enable row level security;
create policy "likes readable" on public.post_likes for select to anon, authenticated using (true);
create policy "like own" on public.post_likes for insert to authenticated with check (user_id = auth.uid() and public.post_visible(post_id));
create policy "unlike own" on public.post_likes for delete to authenticated using (user_id = auth.uid());

create table public.post_saves (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select, insert, delete on public.post_saves to authenticated;
grant all on public.post_saves to service_role;
alter table public.post_saves enable row level security;
create policy "own saves" on public.post_saves for select to authenticated using (user_id = auth.uid());
create policy "save own" on public.post_saves for insert to authenticated with check (user_id = auth.uid() and public.post_visible(post_id));
create policy "unsave own" on public.post_saves for delete to authenticated using (user_id = auth.uid());

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.comments to authenticated;
grant select on public.comments to anon;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "comments readable" on public.comments for select to anon, authenticated using (true);
create policy "comment own" on public.comments for insert to authenticated with check (user_id = auth.uid() and public.post_visible(post_id));
create policy "delete own comment" on public.comments for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- FOLLOWS
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, page_id)
);
grant select, insert, delete on public.follows to authenticated;
grant select on public.follows to anon;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "follows readable" on public.follows for select to anon, authenticated using (true);
create policy "follow own" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "unfollow own" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text,
  image_url text,
  audio_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_pair_idx on public.messages (sender_id, recipient_id, created_at);
grant select, insert, update on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "own messages" on public.messages for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "send to friends" on public.messages for insert to authenticated with check (sender_id = auth.uid() and public.are_friends(auth.uid(), recipient_id));
create policy "mark read" on public.messages for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
alter publication supabase_realtime add table public.messages;

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete cascade,
  kind text not null,
  body text not null default '',
  post_id uuid references public.posts(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "create notification as actor" on public.notifications for insert to authenticated with check (actor_id = auth.uid());
create policy "update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());
alter publication supabase_realtime add table public.notifications;

-- ADS
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  advertiser text not null,
  title text not null,
  media_url text not null,
  poster_url text,
  cta_label text not null default 'Learn more',
  cta_url text not null,
  allow_engagement boolean not null default true,
  status public.ad_status not null default 'pending',
  impressions integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.ads to anon, authenticated;
grant insert, update, delete on public.ads to authenticated;
grant all on public.ads to service_role;
alter table public.ads enable row level security;
create policy "approved ads readable" on public.ads for select to anon, authenticated using (status = 'approved' or public.has_role(auth.uid(),'admin'));
create policy "admins manage ads" on public.ads for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- REPORTS
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  reported_user uuid references auth.users(id) on delete cascade,
  reason text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "own or admin reports" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "file report" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "admins resolve reports" on public.reports for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- PLATFORM SETTINGS
create table public.platform_settings (
  id boolean primary key default true,
  ad_frequency integer not null default 6,
  gift_revenue_share integer not null default 70,
  ad_revenue_share integer not null default 55,
  updated_at timestamptz not null default now(),
  constraint single_row check (id)
);
grant select on public.platform_settings to anon, authenticated;
grant update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "settings readable" on public.platform_settings for select to anon, authenticated using (true);
create policy "admins update settings" on public.platform_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.platform_settings (id) values (true);
