-- complaint management system schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
create type user_role as enum ('student', 'admin', 'super_admin');

create type complaint_category as enum (
  'academic', 'hostel', 'infrastructure','mess',             
  'internet', 'finance', 'other'
);

create type complaint_status as enum (
  'open', 'in_progress', 'resolved', 'closed', 'rejected'
);

create type complaint_priority as enum (
  'low', 'medium', 'high', 'critical'
);

create table users (
  id bigserial primary key,
  email text not null unique,
  password_hash text not null,
  role user_role not null default 'student',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_email on users (email);
create index idx_users_role on users (role);

create table complaints (
  id bigserial primary key,
  author_id bigint not null references users (id) on delete restrict,
  category complaint_category not null,
  status complaint_status not null default 'open',
  priority complaint_priority not null default 'medium',
  title text not null,
  description text,
  claimed_by bigint references users (id) on delete set null,
  escalation_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_complaints_author on complaints (author_id);
create index idx_complaints_status on complaints (status);
create index idx_complaints_claimed_by on complaints (claimed_by);
create index idx_complaints_escalation on complaints (escalation_flag) where escalation_flag = true;
create index idx_complaints_created on complaints (created_at desc);

create table complaint_activity_logs (
  id bigserial primary key,
  complaint_id bigint not null references complaints (id) on delete cascade,
  actor_id bigint not null references users (id) on delete restrict,
  action text not null,
  previous_state jsonb,
  new_state jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_complaint on complaint_activity_logs (complaint_id);
create index idx_activity_actor on complaint_activity_logs (actor_id);
create index idx_activity_created on complaint_activity_logs (created_at desc);
