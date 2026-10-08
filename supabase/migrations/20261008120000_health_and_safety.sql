-- 5. sürüm: şikayet/engelleme, hedef ve kilo takibi, beslenme, su
--   * blocks, reports: kullanıcıyı engelle ve şikayet et (App Store Guideline 1.2)
--   * health_settings: kişisel hedef ve günlük kalori/protein/su hedefleri (sadece kişinin kendisi görür)
--   * body_weights: kilo takibi; en son ölçüm profiles.body_weight'e yazılır
--   * meals, water_logs: öğünler ve içilen su (sadece kişinin kendisi görür)
-- Kayıt kimlikleri telefonda üretilir (internetsiz kayıt), bu yüzden id'ler istemciden de gelebilir.

-- ---------------------------------------------------------------- engelleme

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_id_idx on public.blocks (blocked_id);
alter table public.blocks enable row level security;

create policy "blocks: kendi engellerini görür" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "blocks: engeller" on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "blocks: engeli kaldırır" on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- ---------------------------------------------------------------- şikayet
-- Şikayetler Supabase panelinden (Table Editor → reports) incelenir.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid default auth.uid() references public.profiles (id) on delete set null,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  entry_id uuid references public.entries (id) on delete set null,
  reason text not null check (reason in ('spam', 'offensive', 'harassment', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
create index reports_reporter_id_idx on public.reports (reporter_id);
create index reports_reported_id_idx on public.reports (reported_id);
create index reports_entry_id_idx on public.reports (entry_id);
alter table public.reports enable row level security;

create policy "reports: kendi şikayetlerini görür" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()));
-- Sadece görebildiği (aynı gruptaki) birini şikayet edebilir.
create policy "reports: şikayet eder" on public.reports
  for insert to authenticated with check (
    reporter_id = (select auth.uid()) and reported_id <> (select auth.uid()) and private.can_see_profile(reported_id)
  );

-- ---------------------------------------------------------------- hedefler

create table public.health_settings (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  goal text check (goal in ('lose', 'gain', 'muscle', 'maintain')),
  sex text check (sex in ('male', 'female')),
  birth_year smallint check (birth_year between 1900 and 2100),
  height_cm smallint check (height_cm between 100 and 250),
  activity text check (activity in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  target_weight numeric(5, 1) check (target_weight between 30 and 300),
  pace numeric(3, 2) check (pace between 0 and 1),
  kcal_target integer check (kcal_target between 800 and 6000),
  protein_target integer check (protein_target between 0 and 400),
  water_target integer check (water_target between 500 and 6000),
  -- yıldızlanan yiyecekler: katalog anahtarları ya da elle girilen yiyecekler
  favorites jsonb not null default '[]'::jsonb check (jsonb_typeof(favorites) = 'array'),
  updated_at timestamptz not null default now()
);
alter table public.health_settings enable row level security;

create policy "health_settings: kendi ayarını görür" on public.health_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "health_settings: kendi ayarını ekler" on public.health_settings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "health_settings: kendi ayarını günceller" on public.health_settings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- kilo takibi

create table public.body_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  weight numeric(5, 1) not null check (weight between 30 and 300),
  measured_on date not null,
  created_at timestamptz not null default now()
);
create index body_weights_user_idx on public.body_weights (user_id, measured_on);
alter table public.body_weights enable row level security;

create policy "body_weights: kendi kaydını görür" on public.body_weights
  for select to authenticated using (user_id = (select auth.uid()));
create policy "body_weights: kendi kaydını ekler" on public.body_weights
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "body_weights: kendi kaydını düzenler" on public.body_weights
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "body_weights: kendi kaydını siler" on public.body_weights
  for delete to authenticated using (user_id = (select auth.uid()));

-- En son ölçüm profildeki kiloya yazılır (sıralamadaki kilo oranı güncel kalsın).
create function private.sync_body_weight()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := coalesce(new.user_id, old.user_id);
  latest numeric;
begin
  select w.weight into latest
  from public.body_weights w
  where w.user_id = uid
  order by w.measured_on desc, w.created_at desc
  limit 1;
  if latest is not null then
    update public.profiles set body_weight = latest where id = uid and body_weight is distinct from latest;
  end if;
  return null;
end;
$$;

create trigger body_weights_sync_profile
  after insert or update or delete on public.body_weights
  for each row execute function private.sync_body_weight();

-- ---------------------------------------------------------------- öğünler

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  eaten_on date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null default '' check (char_length(name) <= 160),
  -- kalemler: [{ food?, name, grams, qty, unit, kcal, protein, carbs, fat }]
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50),
  kcal numeric(7, 1) not null default 0 check (kcal between 0 and 20000),
  protein numeric(6, 1) not null default 0 check (protein between 0 and 2000),
  carbs numeric(6, 1) not null default 0 check (carbs between 0 and 2000),
  fat numeric(6, 1) not null default 0 check (fat between 0 and 2000),
  created_at timestamptz not null default now()
);
create index meals_user_day_idx on public.meals (user_id, eaten_on);
alter table public.meals enable row level security;

create policy "meals: kendi öğününü görür" on public.meals
  for select to authenticated using (user_id = (select auth.uid()));
create policy "meals: kendi öğününü ekler" on public.meals
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "meals: kendi öğününü düzenler" on public.meals
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "meals: kendi öğününü siler" on public.meals
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- su

create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  drunk_on date not null,
  ml integer not null check (ml between 1 and 5000),
  created_at timestamptz not null default now()
);
create index water_logs_user_day_idx on public.water_logs (user_id, drunk_on);
alter table public.water_logs enable row level security;

create policy "water_logs: kendi kaydını görür" on public.water_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "water_logs: kendi kaydını ekler" on public.water_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "water_logs: kendi kaydını düzenler" on public.water_logs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "water_logs: kendi kaydını siler" on public.water_logs
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- bildirimler: engelleyene bildirim gitmez

create or replace function private.entry_push_messages(e public.entries)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r record;
  g public.groups;
  ge public.group_exercises;
  v numeric;
  prev numeric;
  actor text;
  f record;
  fbest numeric;
  lang text;
  who text;
  title text;
  body text;
  ex_name text;
  notified uuid[] := '{}';
  msgs jsonb := '[]'::jsonb;
begin
  if e.is_start then
    return msgs;
  end if;

  select nullif(name, '') into actor from public.profiles where id = e.user_id;

  for r in
    select gr.id as group_id
    from public.group_members m
    join public.groups gr on gr.id = m.group_id
    join public.group_exercises gx on gx.group_id = gr.id and gx.exercise = e.exercise
    where m.user_id = e.user_id and m.status = 'active'
      and e.performed_on between gr.start_date and gr.start_date + 364
  loop
    select * into g from public.groups where id = r.group_id;
    select * into ge from public.group_exercises where group_id = r.group_id and exercise = e.exercise;
    v := private.entry_value(ge, e.weight, e.reps, e.distance);
    prev := private.group_best(e.user_id, g, ge, e.id);
    -- ilk kayıt ya da rekor değilse bu grupta bildirim yok
    continue when prev is null or v <= prev;

    for f in
      select p.id, p.notify, p.locale
      from public.group_members b
      join public.profiles p on p.id = b.user_id
      where b.group_id = g.id and b.status = 'active' and b.user_id <> e.user_id
        and not (b.user_id = any (notified))
        and not exists (
          select 1 from public.blocks bl where bl.blocker_id = b.user_id and bl.blocked_id = e.user_id
        )
    loop
      lang := f.locale;
      who := coalesce(actor, private.push_text(lang, 'friend'));
      ex_name := private.exercise_name(ge, lang);
      fbest := private.group_best(f.id, g, ge, null);

      title := null;
      if coalesce((f.notify ->> 'passed')::boolean, true) and fbest is not null and fbest >= prev and fbest < v then
        title := replace(private.push_text(lang, 'passed'), '{a}', who);
        body := replace(replace(replace(private.push_text(lang, 'passed_body'),
          '{e}', ex_name), '{v}', private.fmt_value(ge, v, lang)), '{f}', private.fmt_value(ge, fbest, lang));
      elsif coalesce((f.notify ->> 'friend_goal')::boolean, true) and prev < ge.goal and v >= ge.goal then
        title := replace(private.push_text(lang, 'goal'), '{a}', who);
        body := ex_name || ' · ' || private.fmt_value(ge, v, lang);
      elsif coalesce((f.notify ->> 'friend_record')::boolean, true) then
        title := replace(private.push_text(lang, 'record'), '{a}', who);
        body := ex_name || ' · ' || private.fmt_value(ge, v, lang);
      end if;

      if title is not null then
        notified := notified || f.id;
        msgs := msgs || coalesce(
          (select jsonb_agg(jsonb_build_object(
              'to', t.token, 'title', title, 'body', body, 'sound', 'default',
              'data', jsonb_build_object('exercise', e.exercise, 'user_id', e.user_id, 'group_id', g.id)))
           from public.push_tokens t where t.user_id = f.id),
          '[]'::jsonb);
      end if;
    end loop;
  end loop;

  return msgs;
end;
$$;
