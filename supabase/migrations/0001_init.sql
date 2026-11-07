-- PROFILES (id = auth user id)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RESUMES
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  filename text not null,
  storage_path text not null unique,
  file_type text not null check (file_type in ('PDF','DOCX')),
  file_size integer not null check (file_size > 0),
  extracted_text text,
  created_at timestamptz not null default now()
);

-- ATS REPORTS
create table public.ats_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  analysis_json jsonb not null,
  created_at timestamptz not null default now()
);

-- INTERVIEWS
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  interview_type text not null check (interview_type in ('Technical','HR','Mixed')),
  difficulty text not null check (difficulty in ('Beginner','Intermediate','Advanced')),
  question_count integer not null check (question_count in (10,15,20)),
  job_title text,
  job_description text,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  created_at timestamptz not null default now()
);

create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_text text not null,
  category text not null,
  difficulty text not null,
  question_order integer not null,
  unique (interview_id, question_order)
);

create table public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  question_id uuid not null unique references public.interview_questions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  answer_text text not null default '',
  input_method text not null default 'text' check (input_method in ('text','voice')),
  updated_at timestamptz not null default now()
);

create table public.interview_reports (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null unique references public.interviews(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  overall_score integer not null check (overall_score between 0 and 100),
  evaluation_json jsonb not null,
  created_at timestamptz not null default now()
);

-- USAGE LOG (for rate limiting AI endpoints)
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null,
  created_at timestamptz not null default now()
);

-- INDEXES
create index on public.resumes (user_id, created_at desc);
create index on public.ats_reports (user_id, created_at desc);
create index on public.ats_reports (resume_id);
create index on public.interviews (user_id, created_at desc);
create index on public.interviews (resume_id);
create index on public.interview_questions (interview_id);
create index on public.interview_answers (interview_id);
create index on public.ai_usage (user_id, endpoint, created_at desc);

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.ats_reports enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_answers enable row level security;
alter table public.interview_reports enable row level security;
alter table public.ai_usage enable row level security;

create policy "profiles select own" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "resumes own" on public.resumes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Rows that point at a resume must point at the caller's own resume.
create policy "ats_reports own" on public.ats_reports for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid())));

create policy "interviews own" on public.interviews for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid())));

-- Rows that point at an interview must point at the caller's own interview.
create policy "questions own" on public.interview_questions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = (select auth.uid())));

create policy "answers own" on public.interview_answers for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = (select auth.uid())));

create policy "interview_reports own" on public.interview_reports for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = (select auth.uid())));

create policy "ai_usage select own" on public.ai_usage for select to authenticated
  using (user_id = (select auth.uid()));
create policy "ai_usage insert own" on public.ai_usage for insert to authenticated
  with check (user_id = (select auth.uid()));

-- PRIVATE STORAGE BUCKET (files live at {user_id}/{resume_id}.{ext})
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880,
  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "resume files select own" on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "resume files insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "resume files delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);