-- Sylly-Map, Assessment Dropbox, IA 50/50 tracker

do $$ begin
  create type public.syllabus_status as enum ('need_help', 'okay', 'mastered');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dropbox_status as enum (
    'draft_submitted',
    'with_tutor',
    'feedback_ready',
    'closed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.syllabus_topics (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  unit text not null check (unit in ('unit_3', 'unit_4')),
  topic_code text not null default '',
  title text not null,
  sort_key int not null default 0,
  created_at timestamptz not null default now(),
  unique (subject, unit, topic_code, title)
);

create table if not exists public.syllabus_progress (
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.syllabus_topics (id) on delete cascade,
  status public.syllabus_status not null default 'okay',
  updated_at timestamptz not null default now(),
  primary key (student_id, topic_id)
);

create table if not exists public.assessment_dropbox (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null default '',
  title text not null default 'Assessment draft',
  assessment_type text not null default 'psmt',
  status public.dropbox_status not null default 'draft_submitted',
  draft_path text,
  task_sheet_path text,
  ismg_path text,
  feedback_path text,
  tutor_note text not null default '',
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ia_trackers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  ia1_score numeric,
  ia1_max numeric not null default 20,
  ia2_score numeric,
  ia2_max numeric not null default 20,
  ia3_score numeric,
  ia3_max numeric not null default 20,
  target_raw int not null default 90,
  updated_at timestamptz not null default now(),
  unique (student_id, subject)
);

create table if not exists public.atar_plans (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  subjects jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists syllabus_topics_subject_idx on public.syllabus_topics (subject, unit, sort_key);
create index if not exists syllabus_progress_student_idx on public.syllabus_progress (student_id, status);
create index if not exists assessment_dropbox_student_idx on public.assessment_dropbox (student_id, updated_at desc);
create index if not exists assessment_dropbox_tutor_idx on public.assessment_dropbox (tutor_id, status);
create index if not exists ia_trackers_student_idx on public.ia_trackers (student_id);

alter table public.syllabus_topics enable row level security;
alter table public.syllabus_progress enable row level security;
alter table public.assessment_dropbox enable row level security;
alter table public.ia_trackers enable row level security;
alter table public.atar_plans enable row level security;

drop policy if exists syllabus_topics_select on public.syllabus_topics;
create policy syllabus_topics_select on public.syllabus_topics
  for select using (public.current_role() in ('student', 'tutor', 'admin'));

drop policy if exists syllabus_topics_admin on public.syllabus_topics;
create policy syllabus_topics_admin on public.syllabus_topics
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

drop policy if exists syllabus_progress_select on public.syllabus_progress;
create policy syllabus_progress_select on public.syllabus_progress
  for select using (
    student_id = auth.uid()
    or public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = syllabus_progress.student_id
      )
    )
  );

drop policy if exists syllabus_progress_write on public.syllabus_progress;
create policy syllabus_progress_write on public.syllabus_progress
  for all using (
    student_id = auth.uid()
    or public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = syllabus_progress.student_id
      )
    )
  )
  with check (
    student_id = auth.uid()
    or public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = student_id
      )
    )
  );

drop policy if exists dropbox_select on public.assessment_dropbox;
create policy dropbox_select on public.assessment_dropbox
  for select using (
    student_id = auth.uid()
    or tutor_id = auth.uid()
    or public.current_role() = 'admin'
  );

drop policy if exists dropbox_write on public.assessment_dropbox;
create policy dropbox_write on public.assessment_dropbox
  for all using (
    student_id = auth.uid()
    or tutor_id = auth.uid()
    or public.current_role() = 'admin'
  )
  with check (
    student_id = auth.uid()
    or tutor_id = auth.uid()
    or public.current_role() = 'admin'
  );

drop policy if exists ia_trackers_own on public.ia_trackers;
create policy ia_trackers_own on public.ia_trackers
  for all using (
    student_id = auth.uid()
    or public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = ia_trackers.student_id
      )
    )
  )
  with check (
    student_id = auth.uid()
    or public.current_role() = 'admin'
  );

drop policy if exists atar_plans_own on public.atar_plans;
create policy atar_plans_own on public.atar_plans
  for all using (
    student_id = auth.uid()
    or public.current_role() = 'admin'
  )
  with check (
    student_id = auth.uid()
    or public.current_role() = 'admin'
  );

grant select on public.syllabus_topics to authenticated, anon;
grant all on public.syllabus_topics to service_role;
grant select, insert, update, delete on public.syllabus_progress to authenticated;
grant all on public.syllabus_progress to service_role;
grant select, insert, update, delete on public.assessment_dropbox to authenticated;
grant all on public.assessment_dropbox to service_role;
grant select, insert, update, delete on public.ia_trackers to authenticated;
grant all on public.ia_trackers to service_role;
grant select, insert, update, delete on public.atar_plans to authenticated;
grant all on public.atar_plans to service_role;

notify pgrst, 'reload schema';

insert into public.syllabus_topics (subject, unit, topic_code, title, sort_key) values
  ('methods','unit_3','3.1.1','Further differentiation — chain, product, quotient',1),
  ('methods','unit_3','3.1.2','Derivatives of exponential & logarithmic functions',2),
  ('methods','unit_3','3.1.3','Derivatives of trigonometric functions',3),
  ('methods','unit_3','3.1.4','Applications of differentiation (rates, optimisation)',4),
  ('methods','unit_3','3.2.1','Anti-differentiation & indefinite integrals',5),
  ('methods','unit_3','3.2.2','Definite integrals & area',6),
  ('methods','unit_3','3.2.3','Fundamental theorem & applications',7),
  ('methods','unit_3','3.3.1','Discrete random variables',8),
  ('methods','unit_3','3.3.2','Binomial distribution',9),
  ('methods','unit_3','3.3.3','Continuous random variables & normal',10),
  ('methods','unit_4','4.1.1','Further integration techniques',101),
  ('methods','unit_4','4.1.2','Volumes of solids of revolution',102),
  ('methods','unit_4','4.1.3','Differential equations (simple models)',103),
  ('methods','unit_4','4.2.1','Discrete growth & finance models',104),
  ('methods','unit_4','4.2.2','Logarithmic & exponential models',105),
  ('methods','unit_4','4.3.1','Sample means & confidence intervals',106),
  ('methods','unit_4','4.3.2','Hypothesis testing (intro)',107),
  ('methods','unit_4','4.4.1','Exam technique — calculator & non-calculator',108),
  ('methods','unit_4','4.4.2','Mixed revision — Units 3 & 4',109),
  ('specialist','unit_3','3.1.1','Complex numbers — arithmetic & polar form',1),
  ('specialist','unit_3','3.1.2','De Moivre & roots of complex numbers',2),
  ('specialist','unit_3','3.2.1','Matrices — operations & inverse',3),
  ('specialist','unit_3','3.2.2','Transformations & linear systems',4),
  ('specialist','unit_3','3.3.1','Vectors in 2D & 3D',5),
  ('specialist','unit_3','3.3.2','Vector proofs & geometry',6),
  ('specialist','unit_3','3.4.1','Further trigonometry & identities',7),
  ('specialist','unit_3','3.4.2','Proof techniques',8),
  ('specialist','unit_4','4.1.1','Integration by parts & partial fractions',101),
  ('specialist','unit_4','4.1.2','Volumes & applications of integration',102),
  ('specialist','unit_4','4.2.1','Differential equations & slope fields',103),
  ('specialist','unit_4','4.2.2','Kinematics with calculus',104),
  ('specialist','unit_4','4.3.1','Statistical inference for means',105),
  ('specialist','unit_4','4.3.2','Hypothesis testing',106),
  ('specialist','unit_4','4.4.1','Exam technique — Specialist',107),
  ('specialist','unit_4','4.4.2','Mixed revision — Units 3 & 4',108),
  ('physics','unit_3','3.1.1','Gravity & motion',1),
  ('physics','unit_3','3.1.2','Special relativity (intro concepts)',2),
  ('physics','unit_3','3.2.1','Electromagnetic induction',3),
  ('physics','unit_3','3.2.2','AC & transformers',4),
  ('physics','unit_3','3.3.1','Quantum model & photoelectric effect',5),
  ('physics','unit_3','3.3.2','Wave–particle duality',6),
  ('physics','unit_4','4.1.1','Particle physics & the Standard Model',101),
  ('physics','unit_4','4.1.2','Nuclear physics & radioactivity',102),
  ('physics','unit_4','4.2.1','Waves & superposition',103),
  ('physics','unit_4','4.2.2','Optics & interference',104),
  ('physics','unit_4','4.3.1','Student experiment skills',105),
  ('physics','unit_4','4.3.2','Research investigation skills',106),
  ('physics','unit_4','4.4.1','External exam technique',107),
  ('chemistry','unit_3','3.1.1','Chemical equilibrium systems',1),
  ('chemistry','unit_3','3.1.2','Equilibrium constants & Le Chatelier',2),
  ('chemistry','unit_3','3.2.1','Oxidation & reduction',3),
  ('chemistry','unit_3','3.2.2','Electrochemical cells',4),
  ('chemistry','unit_3','3.3.1','Organic chemistry — structure',5),
  ('chemistry','unit_3','3.3.2','Organic reactions & pathways',6),
  ('chemistry','unit_4','4.1.1','Structure & properties — materials',101),
  ('chemistry','unit_4','4.1.2','Analytical techniques',102),
  ('chemistry','unit_4','4.2.1','Chemical synthesis',103),
  ('chemistry','unit_4','4.2.2','Green chemistry & design',104),
  ('chemistry','unit_4','4.3.1','Student experiment skills',105),
  ('chemistry','unit_4','4.3.2','Research investigation skills',106),
  ('chemistry','unit_4','4.4.1','External exam technique',107)
on conflict do nothing;
