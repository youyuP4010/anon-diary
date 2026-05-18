-- ① 테이블 생성
create table anon_diary_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table anon_diary_diaries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references anon_diary_profiles(id) on delete cascade,
  title text not null,
  content text not null check (char_length(content) <= 500),
  background_type text not null default 'color',
  background_value text not null default '#FFFFFF',
  font_size integer not null default 14,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table anon_diary_reactions (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references anon_diary_diaries(id) on delete cascade,
  user_id uuid not null references anon_diary_profiles(id) on delete cascade,
  type text not null check (type in ('sad', 'happy')),
  created_at timestamptz not null default now(),
  unique (diary_id, user_id)
);

create table anon_diary_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references anon_diary_profiles(id) on delete cascade,
  following_id uuid not null references anon_diary_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

create table anon_diary_reports (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references anon_diary_diaries(id) on delete cascade,
  reporter_id uuid not null references anon_diary_profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (diary_id, reporter_id)
);

-- ② 인덱스
create index on anon_diary_diaries(author_id);
create index on anon_diary_diaries(created_at desc);
create index on anon_diary_diaries(is_hidden);
create index on anon_diary_reactions(diary_id);
create index on anon_diary_reactions(user_id);
create index on anon_diary_follows(follower_id);
create index on anon_diary_follows(following_id);
create index on anon_diary_reports(diary_id);

-- ③ RLS 활성화
alter table anon_diary_profiles enable row level security;
alter table anon_diary_diaries enable row level security;
alter table anon_diary_reactions enable row level security;
alter table anon_diary_follows enable row level security;
alter table anon_diary_reports enable row level security;

-- ④ RLS 정책
create policy "profiles_select" on anon_diary_profiles for select using (true);
create policy "profiles_insert" on anon_diary_profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on anon_diary_profiles for update using (auth.uid() = id);
create policy "profiles_delete" on anon_diary_profiles for delete using (auth.uid() = id);

create policy "diaries_select" on anon_diary_diaries for select using (is_hidden = false);
create policy "diaries_insert" on anon_diary_diaries for insert with check (auth.uid() is not null);
create policy "diaries_update" on anon_diary_diaries for update using (auth.uid() = author_id);
create policy "diaries_delete" on anon_diary_diaries for delete using (auth.uid() = author_id);

create policy "reactions_select" on anon_diary_reactions for select using (true);
create policy "reactions_insert" on anon_diary_reactions for insert with check (auth.uid() is not null);
create policy "reactions_delete" on anon_diary_reactions for delete using (auth.uid() = user_id);

create policy "follows_select" on anon_diary_follows for select using (true);
create policy "follows_insert" on anon_diary_follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on anon_diary_follows for delete using (auth.uid() = follower_id);

create policy "reports_select" on anon_diary_reports for select using (auth.uid() = reporter_id);
create policy "reports_insert" on anon_diary_reports for insert with check (auth.uid() is not null and auth.uid() = reporter_id);

-- ⑤ 트리거: 회원가입 시 프로필 + 랜덤 닉네임 자동 생성
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  adjectives text[] := array['빛나는','조용한','따뜻한','시원한','맑은','부드러운','깊은','높은','넓은','작은'];
  nouns text[] := array['달빛','바람','구름','별','노을','이슬','숲','파도','산','강'];
  random_nickname text;
begin
  random_nickname := adjectives[floor(random()*10+1)::int] || nouns[floor(random()*10+1)::int] || floor(random()*9000+1000)::text;
  insert into anon_diary_profiles (id, nickname)
  values (new.id, random_nickname);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ⑥ 트리거: 신고 5회 이상 자동 숨김
create or replace function check_report_threshold()
returns trigger language plpgsql security definer as $$
begin
  if (select count(*) from anon_diary_reports where diary_id = new.diary_id) >= 5 then
    update anon_diary_diaries set is_hidden = true where id = new.diary_id;
  end if;
  return new;
end;
$$;

create trigger on_report_inserted
  after insert on anon_diary_reports
  for each row execute function check_report_threshold();

-- ⑦ 트리거: updated_at 자동 갱신
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profile_updated
  before update on anon_diary_profiles
  for each row execute function update_updated_at();