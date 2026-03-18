-- 010_founder_launch.sql
-- FounderLaunch feature: guided launch checklist, templates, reminders,
-- accelerator/investor tracking for solo founders.

-- ============================================================
-- 1. founder_profiles
-- ============================================================
create table if not exists founder_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) unique not null,
  is_solo       boolean,
  cofounder_count int default 0,
  product_type  text check (product_type in ('saas','marketplace','hardware','services','other')),
  planning_to_raise boolean,
  home_state    text,
  home_country  text default 'US',
  company_name  text,
  company_domain text,
  idea_description text,
  target_market text,
  incorporation_path text check (incorporation_path in ('diy','budget','stripe_atlas')) default 'diy',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table founder_profiles enable row level security;

create policy "founder_profiles_select_own" on founder_profiles
  for select using (auth.uid() = user_id);
create policy "founder_profiles_insert_own" on founder_profiles
  for insert with check (auth.uid() = user_id);
create policy "founder_profiles_update_own" on founder_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "founder_profiles_delete_own" on founder_profiles
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. launch_phases
-- ============================================================
create table if not exists launch_phases (
  id                serial primary key,
  slug              text unique not null,
  title             text not null,
  description       text,
  estimated_minutes int,
  sort_order        int not null,
  is_conditional    boolean default false,
  condition_field   text
);

alter table launch_phases enable row level security;

create policy "launch_phases_public_read" on launch_phases
  for select using (true);

-- ============================================================
-- 3. launch_templates  (created before launch_steps due to FK)
-- ============================================================
create table if not exists launch_templates (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text,
  category        text check (category in ('legal','financial','operational','fundraise','accelerator')),
  file_type       text check (file_type in ('pdf','docx','google_sheets','google_slides','google_docs','notion','markdown')),
  file_url        text,
  preview_url     text,
  is_fillable     boolean default false,
  fill_fields     jsonb,
  download_count  int default 0,
  version         text default '1.0',
  contributor     text,
  license         text default 'MIT',
  created_at      timestamptz default now()
);

alter table launch_templates enable row level security;

create policy "launch_templates_public_read" on launch_templates
  for select using (true);

-- ============================================================
-- 4. launch_steps
-- ============================================================
create table if not exists launch_steps (
  id                serial primary key,
  phase_id          int references launch_phases(id) on delete cascade,
  slug              text unique not null,
  title             text not null,
  description       text,
  step_type         text check (step_type in ('action','info','template','external_link','calculator','form')) not null,
  estimated_minutes int,
  sort_order        int not null,
  is_required       boolean default true,
  is_conditional    boolean default false,
  condition_json    jsonb,
  content_md        text,
  external_url      text,
  template_id       uuid references launch_templates(id),
  trap_warning      text,
  trap_severity     text check (trap_severity in ('info','warning','critical')) default 'warning'
);

alter table launch_steps enable row level security;

create policy "launch_steps_public_read" on launch_steps
  for select using (true);

-- ============================================================
-- 5. user_launch_progress
-- ============================================================
create table if not exists user_launch_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) not null,
  step_id       int references launch_steps(id) not null,
  status        text check (status in ('not_started','in_progress','completed','skipped')) default 'not_started',
  completed_at  timestamptz,
  notes         text,
  metadata      jsonb,
  created_at    timestamptz default now(),
  unique (user_id, step_id)
);

alter table user_launch_progress enable row level security;

create policy "user_launch_progress_select_own" on user_launch_progress
  for select using (auth.uid() = user_id);
create policy "user_launch_progress_insert_own" on user_launch_progress
  for insert with check (auth.uid() = user_id);
create policy "user_launch_progress_update_own" on user_launch_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_launch_progress_delete_own" on user_launch_progress
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 6. launch_reminders
-- ============================================================
create table if not exists launch_reminders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) not null,
  title           text not null,
  description     text,
  due_date        date not null,
  reminder_type   text check (reminder_type in ('deadline','tax','filing','recurring','custom')),
  severity        text check (severity in ('info','warning','critical')) default 'warning',
  is_recurring    boolean default false,
  recurrence_rule text,
  is_completed    boolean default false,
  completed_at    timestamptz,
  email_sent      boolean default false,
  related_step_id int references launch_steps(id),
  created_at      timestamptz default now()
);

alter table launch_reminders enable row level security;

create policy "launch_reminders_select_own" on launch_reminders
  for select using (auth.uid() = user_id);
create policy "launch_reminders_insert_own" on launch_reminders
  for insert with check (auth.uid() = user_id);
create policy "launch_reminders_update_own" on launch_reminders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "launch_reminders_delete_own" on launch_reminders
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 7. accelerator_programs
-- ============================================================
create table if not exists accelerator_programs (
  id                   serial primary key,
  name                 text not null,
  slug                 text unique not null,
  description          text,
  website_url          text,
  application_url      text,
  deadline             date,
  batch_name           text,
  location             text,
  is_remote_friendly   boolean default false,
  sectors              text[],
  stage                text check (stage in ('pre_seed','seed','series_a')),
  equity_taken         decimal,
  investment_amount    text,
  program_length_weeks int,
  notable_alumni       text[],
  updated_at           timestamptz default now()
);

alter table accelerator_programs enable row level security;

create policy "accelerator_programs_public_read" on accelerator_programs
  for select using (true);

-- ============================================================
-- 8. investor_database
-- ============================================================
create table if not exists investor_database (
  id              serial primary key,
  name            text not null,
  firm            text,
  email           text,
  linkedin_url    text,
  twitter_url     text,
  website_url     text,
  check_size_min  int,
  check_size_max  int,
  stage           text[],
  sectors         text[],
  location        text,
  is_active       boolean default true,
  notes           text,
  source          text,
  updated_at      timestamptz default now()
);

alter table investor_database enable row level security;

create policy "investor_database_public_read" on investor_database
  for select using (true);

-- ============================================================
-- 9. user_investor_tracking
-- ============================================================
create table if not exists user_investor_tracking (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) not null,
  investor_id      int references investor_database(id),
  custom_name      text,
  custom_firm      text,
  custom_email     text,
  status           text check (status in ('researching','intro_requested','contacted','meeting_scheduled','pitched','follow_up','committed','passed','ghosted')) default 'researching',
  notes            text,
  last_contacted_at timestamptz,
  next_followup_at date,
  intro_source     text,
  created_at       timestamptz default now()
);

alter table user_investor_tracking enable row level security;

create policy "user_investor_tracking_select_own" on user_investor_tracking
  for select using (auth.uid() = user_id);
create policy "user_investor_tracking_insert_own" on user_investor_tracking
  for insert with check (auth.uid() = user_id);
create policy "user_investor_tracking_update_own" on user_investor_tracking
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_investor_tracking_delete_own" on user_investor_tracking
  for delete using (auth.uid() = user_id);
