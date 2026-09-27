-- IDR whole rupiah. Tenant IDs are repeated intentionally for composite FKs.
create schema if not exists private;
create table public.households (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100),
 created_by uuid not null references auth.users(id), currency text not null default 'IDR' check(currency='IDR'),
 attachment_retention text not null default '24h' check(attachment_retention in ('immediate','24h','7d','keep')),
 session_lock_minutes integer not null default 15 check(session_lock_minutes between 5 and 60),
 created_at timestamptz not null default now()
);
create table public.household_members (
 household_id uuid not null references public.households on delete cascade,
 user_id uuid not null references auth.users, role text not null check(role in ('owner','member')),
 display_name text not null check(length(display_name) between 1 and 100),
 primary key(household_id,user_id)
);
create unique index one_owner_per_household on public.household_members(household_id) where role='owner';
create table public.wallets (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null check(length(name) between 1 and 100), type text not null check(type in ('cash','bank','e_wallet')),
 ownership text not null check(ownership in ('personal','shared')), wallet_owner uuid,
 initial_balance bigint not null default 0 check(abs(initial_balance)<=9000000000000),
 currency text not null default 'IDR' check(currency='IDR'), active boolean not null default true,
 icon text not null default 'wallet', color text not null default '#164c3e', account_identifier text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(household_id,id), foreign key(household_id,wallet_owner) references public.household_members(household_id,user_id),
 check((ownership='personal' and wallet_owner is not null) or (ownership='shared' and wallet_owner is null))
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null check(length(name) between 1 and 100), kind text not null default 'expense' check(kind in ('income','expense','both')),
 parent_id uuid, color text not null default '#86b49c', icon text not null default 'tag', sort_order integer not null default 0,
 unique(household_id,id), foreign key(household_id,parent_id) references public.categories(household_id,id), check(parent_id is distinct from id)
);
create table public.tags (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null check(length(name) between 1 and 60), unique(household_id,id), unique(household_id,name)
);
create table public.recurring_templates (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null, created_by uuid not null, mode text not null check(mode in ('auto_create','ask')),
 cadence text not null check(cadence in ('weekly','monthly')), next_run date not null, end_date date, active boolean not null default true,
 transaction_template jsonb not null, unique(household_id,id),
 foreign key(household_id,created_by) references public.household_members(household_id,user_id)
);
create table public.transactions (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 type text not null check(type in ('income','expense','transfer')), amount bigint not null check(amount between 1 and 9000000000000),
 currency text not null default 'IDR' check(currency='IDR'), wallet_id uuid not null, destination_wallet_id uuid,
 transaction_actor uuid not null, transaction_scope text not null check(transaction_scope in ('personal','family')), scope_member_id uuid,
 status text not null default 'completed' check(status in ('pending','completed','cancelled')), occurred_at timestamptz not null,
 category_id uuid, merchant text not null default '' check(length(merchant)<=200), notes text not null default '' check(length(notes)<=2000),
 parent_transaction_id uuid, recurring_template_id uuid, source text not null default 'manual' check(source in ('manual','quick_add','ai','recurring')),
 created_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 deleted_at timestamptz, deleted_by uuid references auth.users(id), version integer not null default 1,
 request_key uuid, request_payload jsonb, unique(household_id,id), unique(household_id,request_key),
 foreign key(household_id,wallet_id) references public.wallets(household_id,id),
 foreign key(household_id,destination_wallet_id) references public.wallets(household_id,id),
 foreign key(household_id,transaction_actor) references public.household_members(household_id,user_id),
 foreign key(household_id,scope_member_id) references public.household_members(household_id,user_id),
 foreign key(household_id,created_by) references public.household_members(household_id,user_id),
 foreign key(household_id,category_id) references public.categories(household_id,id),
 foreign key(household_id,parent_transaction_id) references public.transactions(household_id,id) on delete cascade,
 foreign key(household_id,recurring_template_id) references public.recurring_templates(household_id,id),
 check((type='transfer' and destination_wallet_id is not null and destination_wallet_id<>wallet_id) or (type<>'transfer' and destination_wallet_id is null)),
 check((transaction_scope='personal' and scope_member_id is not null) or (transaction_scope='family' and scope_member_id is null)),
 check(parent_transaction_id is null or type='expense')
);
create index transactions_household_date on public.transactions(household_id,occurred_at desc);
create index transactions_trash on public.transactions(deleted_at) where deleted_at is not null;
create index transactions_wallet on public.transactions(household_id,wallet_id);
create table public.transaction_splits (
 transaction_id uuid not null, household_id uuid not null, category_id uuid not null,
 amount bigint not null check(amount between 1 and 9000000000000), primary key(transaction_id,category_id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete cascade,
 foreign key(household_id,category_id) references public.categories(household_id,id)
);
create table public.transaction_tags (
 transaction_id uuid not null, household_id uuid not null, tag_id uuid not null, primary key(transaction_id,tag_id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete cascade,
 foreign key(household_id,tag_id) references public.tags(household_id,id)
);
create table public.budgets (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null, category_id uuid, wallet_id uuid, amount bigint not null check(amount between 1 and 9000000000000),
 start_date date not null, end_date date not null, rollover text not null default 'reset' check(rollover in ('reset','rollover')),
 rollover_amount bigint not null default 0 check(rollover_amount between 0 and 9000000000000),
 warning_thresholds integer[] not null default array[75,90,100], unique(household_id,id),
 foreign key(household_id,category_id) references public.categories(household_id,id),
 foreign key(household_id,wallet_id) references public.wallets(household_id,id), check(end_date>=start_date),
 check(cardinality(warning_thresholds) between 1 and 10 and 0<all(warning_thresholds) and 100>=all(warning_thresholds))
);
create table public.savings_goals (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 title text not null, target_amount bigint not null check(target_amount between 1 and 9000000000000), deadline date,
 notes text not null default '', status text not null default 'active' check(status in ('active','completed','archived')), unique(household_id,id)
);
create table public.goal_contributions (
 id uuid primary key default gen_random_uuid(), household_id uuid not null, goal_id uuid not null,
 amount bigint not null check(amount between 1 and 9000000000000), created_by uuid not null default auth.uid(),
 contributed_at timestamptz not null default now(),
 foreign key(household_id,goal_id) references public.savings_goals(household_id,id) on delete cascade,
 foreign key(household_id,created_by) references public.household_members(household_id,user_id)
);
create table public.member_preferences (
 household_id uuid not null, user_id uuid not null default auth.uid(), dashboard_layout jsonb not null default '[]', hide_balance boolean not null default false,
 primary key(household_id,user_id), foreign key(household_id,user_id) references public.household_members(household_id,user_id)
);
create table public.ai_drafts (
 id uuid primary key default gen_random_uuid(), household_id uuid not null, created_by uuid not null,
 candidate jsonb not null, confidence jsonb not null, status text not null default 'preview' check(status in ('preview','confirmed','expired')),
 transaction_id uuid, created_at timestamptz not null default now(), confirmed_at timestamptz,
 expires_at timestamptz not null default now()+interval '24 hours', unique(household_id,id),
 foreign key(household_id,created_by) references public.household_members(household_id,user_id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete set null (transaction_id)
);
create table public.attachments (
 id uuid primary key default gen_random_uuid(), household_id uuid not null, created_by uuid not null,
 draft_id uuid, transaction_id uuid, object_path text not null unique, mime_type text not null, size_bytes bigint not null check(size_bytes between 1 and 10485760),
 retention text not null default '24h' check(retention in ('immediate','24h','7d','keep')), created_at timestamptz not null default now(),
 confirmed_at timestamptz, expires_at timestamptz default now()+interval '24 hours', removed_at timestamptz,
 foreign key(household_id,created_by) references public.household_members(household_id,user_id),
 foreign key(household_id,draft_id) references public.ai_drafts(household_id,id) on delete set null (draft_id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete set null (transaction_id)
);
create index attachments_expiry on public.attachments(expires_at) where removed_at is null;
create table public.activity_log (
 id bigint generated always as identity primary key, household_id uuid not null references public.households,
 actor_id uuid, entity_type text not null, entity_id uuid, action text not null, created_at timestamptz not null default now()
);
create table private.ai_credentials (
 household_id uuid not null references public.households, user_id uuid not null references auth.users,
 provider text not null default 'openai' check(provider='openai'), ciphertext text not null, iv text not null, key_version integer not null default 1,
 model text not null default 'gpt-4.1-mini', updated_at timestamptz not null default now(), primary key(household_id,user_id)
);
create table private.ai_rate_limits (
 user_id uuid not null references auth.users, bucket timestamptz not null, count integer not null default 0, primary key(user_id,bucket)
);
create view public.wallet_balances with (security_invoker=true) as
 select w.*, (w.initial_balance + coalesce((select sum(case when t.wallet_id=w.id then case when t.type='income' then t.amount else -t.amount end else 0 end + case when t.type='transfer' and t.destination_wallet_id=w.id then t.amount else 0 end) from public.transactions t where t.household_id=w.household_id and (t.wallet_id=w.id or t.destination_wallet_id=w.id) and t.status='completed' and t.deleted_at is null),0))::bigint as current_balance from public.wallets w;
