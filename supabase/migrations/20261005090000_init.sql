-- 1 Yıl Meydan Okuması: ilk şema
-- profiller, gruplar, üyelikler, kayıtlar, beğeniler + RLS

create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------- tablolar

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 24),
  color text not null default '#C8F04A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  body_weight numeric(5, 1) check (body_weight between 30 and 300),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique,
  require_approval boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('active', 'pending')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_id_idx on public.group_members (user_id);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  exercise text not null check (exercise in ('squat', 'deadlift', 'bench', 'ohp', 'pushup', 'pullup', 'bulgarian', 'farmer', 'row')),
  weight numeric(6, 2) not null default 0 check (weight between 0 and 1000),
  reps integer not null default 1 check (reps between 0 and 1000),
  distance integer not null default 0 check (distance between 0 and 10000),
  is_start boolean not null default false,
  performed_on date not null default ((now() at time zone 'Europe/Istanbul')::date),
  edited boolean not null default false,
  created_at timestamptz not null default now()
);
create index entries_user_exercise_idx on public.entries (user_id, exercise);
create index entries_created_at_idx on public.entries (created_at desc);

create table public.likes (
  entry_id uuid not null references public.entries (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);
create index likes_user_id_idx on public.likes (user_id);

-- ---------------------------------------------------------------- yeni kullanıcıya profil

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------- yetki yardımcıları

create function private.is_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = (select auth.uid()) and status = 'active'
  );
$$;

create function private.has_membership(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = (select auth.uid())
  );
$$;

create function private.is_admin(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = (select auth.uid()) and status = 'active' and role = 'admin'
  );
$$;

-- aynı aktif grupta mıyız? (kayıtlar için)
create function private.shares_group(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select uid = (select auth.uid()) or exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = (select auth.uid()) and a.status = 'active'
      and b.user_id = uid and b.status = 'active'
  );
$$;

-- profil görünürlüğü: bekleyen üyelerin adı da grup üyelerine görünür
create function private.can_see_profile(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select uid = (select auth.uid()) or exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = (select auth.uid()) and a.status = 'active'
      and b.user_id = uid
  );
$$;

grant execute on function private.is_member(uuid), private.has_membership(uuid), private.is_admin(uuid),
  private.shares_group(uuid), private.can_see_profile(uuid) to authenticated;

-- ---------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.entries enable row level security;
alter table public.likes enable row level security;

create policy "profiles: grup arkadaşları görür" on public.profiles
  for select to authenticated using (private.can_see_profile(id));
create policy "profiles: kendini günceller" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "groups: üyeler görür" on public.groups
  for select to authenticated using (private.has_membership(id));
create policy "groups: yönetici günceller" on public.groups
  for update to authenticated using (private.is_admin(id)) with check (private.is_admin(id));
create policy "groups: yönetici siler" on public.groups
  for delete to authenticated using (private.is_admin(id));

create policy "group_members: grup görür" on public.group_members
  for select to authenticated using (user_id = (select auth.uid()) or private.is_member(group_id));
create policy "group_members: yönetici günceller" on public.group_members
  for update to authenticated using (private.is_admin(group_id)) with check (private.is_admin(group_id));
create policy "group_members: ayrıl ya da yönetici çıkarır" on public.group_members
  for delete to authenticated using (user_id = (select auth.uid()) or private.is_admin(group_id));

create policy "entries: grup arkadaşları görür" on public.entries
  for select to authenticated using (private.shares_group(user_id));
create policy "entries: kendi kaydını ekler" on public.entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "entries: kendi kaydını düzenler" on public.entries
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "entries: kendi kaydını siler" on public.entries
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "likes: görünen kayıtlarınki görünür" on public.likes
  for select to authenticated using (exists (select 1 from public.entries e where e.id = entry_id));
create policy "likes: kendi beğenisi" on public.likes
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (select 1 from public.entries e where e.id = entry_id)
  );
create policy "likes: beğeniyi geri al" on public.likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- RPC'ler

create function private.new_invite_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    select string_agg(substr(alphabet, (floor(random() * length(alphabet)) + 1)::int, 1), '')
      into code from generate_series(1, 6);
    exit when not exists (select 1 from public.groups where invite_code = code);
  end loop;
  return code;
end;
$$;

create function public.create_group(p_name text)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.groups;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.groups (name, invite_code, created_by)
  values (trim(p_name), private.new_invite_code(), (select auth.uid()))
  returning * into g;
  insert into public.group_members (group_id, user_id, role, status)
  values (g.id, (select auth.uid()), 'admin', 'active');
  return g;
end;
$$;

create function public.join_group(p_code text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.groups;
  st text;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;
  select * into g from public.groups where invite_code = upper(trim(p_code));
  if not found then
    raise exception 'invalid_code';
  end if;
  st := case when g.require_approval then 'pending' else 'active' end;
  insert into public.group_members (group_id, user_id, role, status)
  values (g.id, (select auth.uid()), 'member', st)
  on conflict (group_id, user_id) do nothing;
  select status into st from public.group_members where group_id = g.id and user_id = (select auth.uid());
  return json_build_object('group_id', g.id, 'name', g.name, 'status', st);
end;
$$;

create function public.regenerate_invite_code(p_group uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  code text;
begin
  if not private.is_admin(p_group) then
    raise exception 'not_admin';
  end if;
  code := private.new_invite_code();
  update public.groups set invite_code = code where id = p_group;
  return code;
end;
$$;

revoke execute on function public.create_group(text), public.join_group(text), public.regenerate_invite_code(uuid) from public, anon;
grant execute on function public.create_group(text), public.join_group(text), public.regenerate_invite_code(uuid) to authenticated;
