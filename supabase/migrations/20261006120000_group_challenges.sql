-- 4. sürüm: her grubun kendi meydan okuması ve çok dil
--   * groups.start_date: grubun 1 yılı bu tarihte başlar (365 gün)
--   * group_exercises: grubun hareket listesi ve hedefleri (yönetici düzenler)
--   * profiles.locale: bildirimlerin dili
--   * push bildirimleri artık grup grup, alıcının dilinde hazırlanır
-- Hareket kataloğu src/lib/catalog.ts ile aynı anahtarları kullanır.

alter table public.groups add column start_date date not null default current_date;
update public.groups set start_date = '2026-10-04' where created_at < '2026-10-07';

alter table public.profiles
  add column locale text not null default 'en' check (locale in ('tr', 'en', 'ja', 'es', 'de'));
update public.profiles set locale = 'tr' where locale = 'en';

-- Hareketler artık gruba göre değişiyor; kayıt sadece anahtarın biçimini kontrol eder.
-- Süreli hareketlerde (plank) saniye reps sütununda tutulur.
alter table public.entries drop constraint entries_exercise_check;
alter table public.entries add constraint entries_exercise_check check (exercise ~ '^[a-z0-9_]{1,40}$');
alter table public.entries drop constraint entries_reps_check;
alter table public.entries add constraint entries_reps_check check (reps between 0 and 100000);

create table public.group_exercises (
  group_id uuid not null references public.groups (id) on delete cascade,
  exercise text not null check (exercise ~ '^[a-z0-9_]{1,40}$'),
  position smallint not null default 0,
  type text not null check (type in ('weight', 'reps', 'carry', 'time')),
  goal numeric(8, 2) not null check (goal > 0 and goal <= 100000),
  per_hand boolean not null default false,
  distance integer not null default 0 check (distance between 0 and 10000),
  -- sadece gruba özel hareketlerde dolu; katalog hareketlerinin adı uygulamada çevrilir
  name text check (name is null or char_length(name) between 1 and 32),
  primary key (group_id, exercise)
);
alter table public.group_exercises enable row level security;

create policy "group_exercises: üyeler görür" on public.group_exercises
  for select to authenticated using (private.has_membership(group_id));
create policy "group_exercises: yönetici ekler" on public.group_exercises
  for insert to authenticated with check (private.is_admin(group_id));
create policy "group_exercises: yönetici günceller" on public.group_exercises
  for update to authenticated using (private.is_admin(group_id)) with check (private.is_admin(group_id));
create policy "group_exercises: yönetici siler" on public.group_exercises
  for delete to authenticated using (private.is_admin(group_id));

-- İlk sürümün 9 hareketi: yeni gruplar liste verilmezse bununla başlar.
create function private.default_exercises()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '[
    {"exercise": "squat", "type": "weight", "goal": 120},
    {"exercise": "deadlift", "type": "weight", "goal": 160},
    {"exercise": "bench", "type": "weight", "goal": 80},
    {"exercise": "ohp", "type": "weight", "goal": 60},
    {"exercise": "pushup", "type": "reps", "goal": 20},
    {"exercise": "pullup", "type": "reps", "goal": 8},
    {"exercise": "bulgarian", "type": "weight", "goal": 20, "per_hand": true},
    {"exercise": "farmer", "type": "carry", "goal": 50, "per_hand": true, "distance": 20},
    {"exercise": "row", "type": "weight", "goal": 80}
  ]'::jsonb;
$$;

create function private.insert_group_exercises(p_group uuid, p_exercises jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if jsonb_typeof(p_exercises) <> 'array' or jsonb_array_length(p_exercises) not between 1 and 20 then
    raise exception 'invalid_exercises';
  end if;
  insert into public.group_exercises (group_id, exercise, position, type, goal, per_hand, distance, name)
  select p_group, x ->> 'exercise', (i - 1)::smallint, x ->> 'type', (x ->> 'goal')::numeric,
         coalesce((x ->> 'per_hand')::boolean, false), coalesce((x ->> 'distance')::integer, 0),
         nullif(trim(x ->> 'name'), '')
  from jsonb_array_elements(p_exercises) with ordinality as t (x, i);
end;
$$;

select private.insert_group_exercises(id, private.default_exercises()) from public.groups;

drop function public.create_group(text);
create function public.create_group(p_name text, p_start date default current_date, p_exercises jsonb default null)
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
  insert into public.groups (name, invite_code, created_by, start_date)
  values (trim(p_name), private.new_invite_code(), (select auth.uid()), coalesce(p_start, current_date))
  returning * into g;
  insert into public.group_members (group_id, user_id, role, status)
  values (g.id, (select auth.uid()), 'admin', 'active');
  perform private.insert_group_exercises(g.id, coalesce(p_exercises, private.default_exercises()));
  return g;
end;
$$;
revoke execute on function public.create_group(text, date, jsonb) from public, anon;
grant execute on function public.create_group(text, date, jsonb) to authenticated;

-- ---------------------------------------------------------------- bildirim metinleri

drop trigger entries_push_notify on public.entries;
drop function private.on_entry_inserted();
drop function private.entry_push_messages(public.entries);
drop function private.entry_value(text, numeric, integer, integer);
drop function private.exercise_goal(text);
drop function private.exercise_name(text);
drop function private.fmt(numeric);

create function private.entry_value(ge public.group_exercises, w numeric, r integer, d integer)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case ge.type
    when 'reps' then r::numeric
    when 'time' then r::numeric
    when 'carry' then case when d >= ge.distance then w else 0 end
    else case when r >= 1 then w else 0 end
  end;
$$;

create function private.fmt(n numeric, lang text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when lang in ('tr', 'es', 'de') then replace(t, '.', ',') else t end
  from (select case when n = trunc(n) then trunc(n)::text else rtrim(round(n, 2)::text, '0') end as t) s;
$$;

create function private.fmt_value(ge public.group_exercises, v numeric, lang text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case ge.type
    when 'reps' then private.fmt(v, lang) || case lang
      when 'tr' then ' tekrar' when 'ja' then '回' when 'de' then ' Wdh.' else ' reps' end
    when 'time' then case
      when v >= 60 then (floor(v / 60))::int::text || ':' || lpad((v::int % 60)::text, 2, '0')
      else v::int::text || case lang when 'tr' then ' sn' when 'ja' then '秒' else ' s' end
    end
    else private.fmt(v, lang) || ' kg'
  end;
$$;

-- Katalog hareketlerinin adları (src/lib/catalog.ts). Dilde yoksa İngilizcesi.
create function private.exercise_name(ge public.group_exercises, lang text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(ge.name, n ->> lang, n ->> 'en', ge.exercise)
  from (select '{
    "squat": {"en": "Squat", "ja": "スクワット", "es": "Sentadilla", "de": "Kniebeuge"},
    "deadlift": {"en": "Deadlift", "ja": "デッドリフト", "es": "Peso muerto", "de": "Kreuzheben"},
    "bench": {"en": "Bench Press", "ja": "ベンチプレス", "es": "Press de banca", "de": "Bankdrücken"},
    "ohp": {"en": "Overhead Press", "ja": "オーバーヘッドプレス", "es": "Press militar", "de": "Schulterdrücken"},
    "row": {"en": "Bent Over Row", "ja": "ベントオーバーロウ", "es": "Remo con barra", "de": "Langhantelrudern"},
    "pushup": {"en": "Push-ups", "tr": "Şınav", "ja": "腕立て伏せ", "es": "Flexiones", "de": "Liegestütze"},
    "pullup": {"en": "Pull-ups", "tr": "Barfiks", "ja": "懸垂", "es": "Dominadas", "de": "Klimmzüge"},
    "bulgarian": {"en": "Bulgarian Split Squat", "ja": "ブルガリアンスクワット", "es": "Sentadilla búlgara", "de": "Bulgarische Kniebeuge"},
    "farmer": {"en": "Farmer''s Walk", "ja": "ファーマーズウォーク", "es": "Paseo del granjero"},
    "front_squat": {"en": "Front Squat", "ja": "フロントスクワット", "es": "Sentadilla frontal", "de": "Frontkniebeuge"},
    "incline_bench": {"en": "Incline Bench Press", "ja": "インクラインベンチプレス", "es": "Press inclinado", "de": "Schrägbankdrücken"},
    "rdl": {"en": "Romanian Deadlift", "ja": "ルーマニアンデッドリフト", "es": "Peso muerto rumano", "de": "Rumänisches Kreuzheben"},
    "hip_thrust": {"en": "Hip Thrust", "ja": "ヒップスラスト"},
    "power_clean": {"en": "Power Clean", "ja": "パワークリーン", "es": "Cargada de potencia"},
    "leg_press": {"en": "Leg Press", "ja": "レッグプレス", "es": "Prensa de piernas", "de": "Beinpresse"},
    "barbell_curl": {"en": "Barbell Curl", "ja": "バーベルカール", "es": "Curl con barra", "de": "Langhantel-Curl"},
    "weighted_pullup": {"en": "Weighted Pull-up", "tr": "Ağırlıklı Barfiks", "ja": "加重懸垂", "es": "Dominada lastrada", "de": "Klimmzug mit Zusatzgewicht"},
    "weighted_dip": {"en": "Weighted Dip", "tr": "Ağırlıklı Dips", "ja": "加重ディップス", "es": "Fondos lastrados", "de": "Dips mit Zusatzgewicht"},
    "dip": {"en": "Dips", "ja": "ディップス", "es": "Fondos"},
    "chinup": {"en": "Chin-ups", "tr": "Ters Barfiks", "ja": "チンアップ", "es": "Dominadas supinas"},
    "pistol": {"en": "Pistol Squat", "ja": "ピストルスクワット", "es": "Sentadilla pistol"},
    "muscle_up": {"en": "Muscle-up", "ja": "マッスルアップ"},
    "hspu": {"en": "Handstand Push-ups", "tr": "Amuda Kalkış Şınavı", "ja": "逆立ち腕立て伏せ", "es": "Flexiones en pino", "de": "Handstand-Liegestütze"},
    "plank": {"en": "Plank", "ja": "プランク", "es": "Plancha", "de": "Unterarmstütz"},
    "dead_hang": {"en": "Dead Hang", "tr": "Barda Asılı Kalma", "ja": "ぶら下がり", "es": "Colgarse de la barra"}
  }'::jsonb -> ge.exercise as n) s;
$$;

create function private.push_text(lang text, k text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(m -> lang ->> k, m -> 'en' ->> k)
  from (select '{
    "tr": {"friend": "Bir arkadaşın", "passed": "{a} seni geçti!", "passed_body": "{e}: {v}. Seninki {f}.",
           "goal": "{a} hedefini tamamladı!", "record": "{a} yeni rekor kırdı"},
    "en": {"friend": "A friend", "passed": "{a} just passed you!", "passed_body": "{e}: {v}. Yours: {f}.",
           "goal": "{a} hit the goal!", "record": "{a} set a new PR"},
    "ja": {"friend": "友達", "passed": "{a}があなたを抜きました！", "passed_body": "{e}: {v}（あなた: {f}）",
           "goal": "{a}が目標を達成しました！", "record": "{a}が自己ベストを更新しました"},
    "es": {"friend": "Un amigo", "passed": "¡{a} te ha superado!", "passed_body": "{e}: {v}. Tu marca: {f}.",
           "goal": "¡{a} ha alcanzado el objetivo!", "record": "{a} ha batido su récord"},
    "de": {"friend": "Ein Freund", "passed": "{a} hat dich überholt!", "passed_body": "{e}: {v}. Deins: {f}.",
           "goal": "{a} hat das Ziel erreicht!", "record": "{a} hat einen neuen Rekord aufgestellt"}
  }'::jsonb as m) s;
$$;

-- Bir kişinin bir gruptaki en iyisi: grubun 1 yılı içindeki kayıtlar + başlamadan önceki son kayıt
-- (src/lib/challenge.ts → computeStats ile aynı kural).
create function private.group_best(p_user uuid, g public.groups, ge public.group_exercises, p_skip uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  select max(v) from (
    select private.entry_value(ge, x.weight, x.reps, x.distance) as v
    from public.entries x
    where x.user_id = p_user and x.exercise = ge.exercise and x.id is distinct from p_skip
      and x.performed_on between g.start_date and g.start_date + 364
    union all
    (select private.entry_value(ge, x.weight, x.reps, x.distance)
     from public.entries x
     where x.user_id = p_user and x.exercise = ge.exercise and x.id is distinct from p_skip
       and x.performed_on < g.start_date
     order by x.performed_on desc, x.created_at desc
     limit 1)
  ) s;
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

alter publication supabase_realtime add table public.group_exercises;
