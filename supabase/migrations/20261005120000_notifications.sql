-- 2. sürüm: anlık bildirimler
-- Bir kayıt rekor olduğunda gruptaki arkadaşlara Expo push gönderilir:
--   * "X seni geçti"     (passed)        arkadaşın en iyisini geçince
--   * "X hedefini tamamladı" (friend_goal)
--   * "X yeni rekor kırdı"   (friend_record)
-- Her kullanıcı türleri profiles.notify içinden açıp kapatabilir.

create extension if not exists pg_net with schema extensions;

alter table public.profiles
  add column notify jsonb not null default '{"passed": true, "friend_goal": true, "friend_record": true}'::jsonb;

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);
create index push_tokens_user_id_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;

create policy "push_tokens: kendi jetonlarını görür" on public.push_tokens
  for select to authenticated using (user_id = (select auth.uid()));
create policy "push_tokens: kendi jetonunu siler" on public.push_tokens
  for delete to authenticated using (user_id = (select auth.uid()));

-- Aynı cihazda hesap değişirse jeton yeni kullanıcıya geçer.
create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, (select auth.uid()), p_platform, now())
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;
revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

-- ---------------------------------------------------------------- hareket bilgisi (src/lib/challenge.ts ile aynı)

create function private.entry_value(ex text, w numeric, r integer, d integer)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when ex in ('pushup', 'pullup') then r::numeric
    when ex = 'farmer' then case when d >= 20 then w else 0 end
    else case when r >= 1 then w else 0 end
  end;
$$;

create function private.exercise_goal(ex text)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case ex
    when 'squat' then 120 when 'deadlift' then 160 when 'bench' then 80 when 'ohp' then 60
    when 'pushup' then 20 when 'pullup' then 8 when 'bulgarian' then 20 when 'farmer' then 50
    when 'row' then 80 end::numeric;
$$;

create function private.exercise_name(ex text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case ex
    when 'squat' then 'Squat' when 'deadlift' then 'Deadlift' when 'bench' then 'Bench Press'
    when 'ohp' then 'Overhead Press' when 'pushup' then 'Şınav' when 'pullup' then 'Barfiks'
    when 'bulgarian' then 'Bulgarian Split Squat' when 'farmer' then 'Farmer''s Walk'
    when 'row' then 'Bent Over Row' end;
$$;

create function private.fmt(n numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(case when n = trunc(n) then trunc(n)::text else rtrim(round(n, 2)::text, '0') end, '.', ',');
$$;

-- ---------------------------------------------------------------- mesajları hazırla

create function private.entry_push_messages(e public.entries)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v numeric := private.entry_value(e.exercise, e.weight, e.reps, e.distance);
  goal numeric := private.exercise_goal(e.exercise);
  ex_name text := private.exercise_name(e.exercise);
  unit text := case when e.exercise in ('pushup', 'pullup') then ' tekrar' else ' kg' end;
  prev numeric;
  actor text;
  f record;
  fbest numeric;
  title text;
  body text;
  msgs jsonb := '[]'::jsonb;
begin
  if e.is_start then
    return msgs;
  end if;

  select max(private.entry_value(x.exercise, x.weight, x.reps, x.distance)) into prev
  from public.entries x
  where x.user_id = e.user_id and x.exercise = e.exercise and x.id <> e.id;

  -- ilk kayıt ya da rekor değilse bildirim yok
  if prev is null or v <= prev then
    return msgs;
  end if;

  select coalesce(nullif(name, ''), 'Bir arkadaşın') into actor from public.profiles where id = e.user_id;

  for f in
    select distinct p.id, p.notify
    from public.group_members a
    join public.group_members b on b.group_id = a.group_id
    join public.profiles p on p.id = b.user_id
    where a.user_id = e.user_id and a.status = 'active' and b.status = 'active' and b.user_id <> e.user_id
  loop
    select max(private.entry_value(x.exercise, x.weight, x.reps, x.distance)) into fbest
    from public.entries x
    where x.user_id = f.id and x.exercise = e.exercise;

    title := null;
    if coalesce((f.notify ->> 'passed')::boolean, true) and fbest is not null and fbest >= prev and fbest < v then
      title := actor || ' seni geçti!';
      body := ex_name || ': ' || private.fmt(v) || unit || '. Seninki ' || private.fmt(fbest) || unit || '.';
    elsif coalesce((f.notify ->> 'friend_goal')::boolean, true) and prev < goal and v >= goal then
      title := actor || ' hedefini tamamladı!';
      body := ex_name || ' · ' || private.fmt(v) || unit;
    elsif coalesce((f.notify ->> 'friend_record')::boolean, true) then
      title := actor || ' yeni rekor kırdı';
      body := ex_name || ' · ' || private.fmt(v) || unit;
    end if;

    if title is not null then
      msgs := msgs || coalesce(
        (select jsonb_agg(jsonb_build_object(
            'to', t.token, 'title', title, 'body', body, 'sound', 'default',
            'data', jsonb_build_object('exercise', e.exercise, 'user_id', e.user_id)))
         from public.push_tokens t where t.user_id = f.id),
        '[]'::jsonb);
    end if;
  end loop;

  return msgs;
end;
$$;

-- ---------------------------------------------------------------- tetikleyici

create function private.on_entry_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  msgs jsonb;
begin
  msgs := private.entry_push_messages(new);
  if jsonb_array_length(msgs) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := msgs,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end if;
  return new;
exception when others then
  -- bildirim gitmese bile kayıt kaydedilmeli
  raise warning 'push gönderilemedi: %', sqlerrm;
  return new;
end;
$$;

create trigger entries_push_notify
  after insert on public.entries
  for each row execute function private.on_entry_inserted();
