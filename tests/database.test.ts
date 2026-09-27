import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it } from 'vitest';
async function revise(
  id: string,
  version: number,
  changes: Record<string, unknown>,
  key = crypto.randomUUID(),
) {
  return scalar('select public.revise_transaction($1,$2,$3::jsonb,$4) as version', [
    id,
    version,
    JSON.stringify(input(changes)),
    key,
  ]);
}
let db: PGlite;
const users = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
];
let household: string, wallet: string, wallet2: string, transaction: string;
async function asUser(id: string) {
  await db.exec(`reset role; set request.jwt.claim.sub = '${id}'; set role authenticated;`);
}
async function scalar(sql: string, params: unknown[] = []) {
  return (await db.query<Record<string, unknown>>(sql, params)).rows[0];
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'::jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$; grant usage on schema auth to authenticated, anon, service_role; grant execute on function auth.uid() to authenticated, anon, service_role; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security;`,
  );
  for (const u of users) await db.query('insert into auth.users(id) values ($1)', [u]);
  for (const file of [
    '202609260001_schema.sql',
    '202609260002_security_rpc.sql',
    '202609260003_storage.sql',
    '202609270004_transaction_revisions.sql',
    '202609270005_openrouter_free.sql',
    '202609270006_transaction_tag_edit.sql',
    '202609270007_household_invitations.sql',
    '202609270008_account_usernames.sql',
    '202609270009_ai_credential_lifecycle.sql',
    '202609270010_membership_lifecycle.sql',
    '202609270011_user_profiles.sql',
  ])
    await db.exec(readFileSync(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'));
  await asUser(users[0]);
  household = String(
    (await scalar("select public.create_household('Test Family', 'Owner') as id"))!.id,
  );
  await db.query(
    "insert into public.wallets(household_id,name,type,ownership,wallet_owner,initial_balance) values($1,'BCA','bank','personal',$2,1000000)",
    [household, users[0]],
  );
  wallet = String((await scalar('select id from public.wallets limit 1'))!.id);
  await db.exec('reset role');
  await db.query(
    "insert into public.household_members(household_id,user_id,role,display_name) values($1,$2,'member','Wife')",
    [household, users[1]],
  );
  await asUser(users[0]);
  await db.query(
    "insert into public.wallets(household_id,name,type,ownership,initial_balance) values($1,'Cash Rumah','cash','shared',100000)",
    [household],
  );
  wallet2 = String((await scalar("select id from public.wallets where name='Cash Rumah'"))!.id);
});
afterAll(async () => {
  await db?.close();
});

it('profiles are private to their account; nickname updates preserve financial identity and versions reject stale saves', async () => {
  await asUser(users[0]);
  const profile = {
    full_name: 'Test Owner',
    nickname: 'New nickname',
    phone: '+62 812 000',
    birth_date: '1999-01-02',
    city: 'Test city',
    bio: 'Private biography',
    avatar_path: null,
  };
  await db.query('select public.save_my_profile($1::jsonb,0)', [JSON.stringify(profile)]);
  expect(
    (await scalar('select full_name,revision from public.user_profiles where user_id=$1', [
      users[0],
    ]))!.revision,
  ).toBe(1);
  expect(
    (await scalar(
      'select display_name from public.household_members where household_id=$1 and user_id=$2',
      [household, users[0]],
    ))!.display_name,
  ).toBe('New nickname');
  await expect(
    db.query('select public.save_my_profile($1::jsonb,0)', [JSON.stringify(profile)]),
  ).rejects.toThrow(/profile conflict/);
  await expect(
    db.query("update public.user_profiles set full_name='Spoof' where user_id=$1", [users[0]]),
  ).rejects.toThrow(/permission denied/);
  await expect(
    db.query('select public.save_my_profile($1::jsonb,1)', [
      JSON.stringify({ ...profile, avatar_path: `${users[1]}/${crypto.randomUUID()}.png` }),
    ]),
  ).rejects.toThrow(/avatar/);
  await expect(
    db.query('select public.save_my_profile($1::jsonb,1)', [
      JSON.stringify({ ...profile, birth_date: '2999-01-01' }),
    ]),
  ).rejects.toThrow(/birth date/);
  await asUser(users[1]);
  expect((await db.query('select * from public.user_profiles')).rows).toHaveLength(0);
  await db.exec("reset role; set request.jwt.claim.sub = ''; set role anon;");
  await expect(db.query('select * from public.user_profiles')).rejects.toThrow(/permission denied/);
  await expect(
    db.query('select public.save_my_profile($1::jsonb,0)', [JSON.stringify(profile)]),
  ).rejects.toThrow(/permission denied/);
  await db.exec(
    'reset role; grant usage on schema storage to authenticated; grant select,insert,delete on storage.objects to authenticated;',
  );
  await asUser(users[0]);
  const avatar = `${users[0]}/${crypto.randomUUID()}.png`;
  await db.query("insert into storage.objects(bucket_id,name) values('avatars',$1)", [avatar]);
  await db.query('select public.save_my_profile($1::jsonb,1)', [
    JSON.stringify({ ...profile, avatar_path: avatar }),
  ]);
  await asUser(users[1]);
  expect(
    (await db.query("select * from storage.objects where bucket_id='avatars'")).rows,
  ).toHaveLength(0);
  await expect(
    db.query("insert into storage.objects(bucket_id,name) values('avatars',$1)", [avatar]),
  ).rejects.toThrow(/row-level security/);
  await db.exec("delete from storage.objects where bucket_id='avatars'");
  await asUser(users[0]);
  expect(
    (
      await db.query("select * from storage.objects where bucket_id='avatars' and name=$1", [
        avatar,
      ])
    ).rows,
  ).toHaveLength(1);
});

it('Owner revokes membership without deleting history, denies former-member access and requires fresh verified re-invitation', async () => {
  const owner = crypto.randomUUID(),
    member = crypto.randomUUID(),
    outsider = crypto.randomUUID();
  await db.exec('reset role');
  for (const [id, email] of [
    [owner, 'lifecycle-owner@example.test'],
    [member, 'lifecycle-member@example.test'],
    [outsider, 'lifecycle-outsider@example.test'],
  ])
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [
      id,
      email,
    ]);
  await asUser(owner);
  const h = String((await scalar("select public.create_household('Lifecycle','Owner') as id"))!.id);
  const oldToken = 'ab'.repeat(32),
    freshToken = 'cd'.repeat(32);
  await db.query('select public.create_household_invitation($1,$2,$3,$4)', [
    h,
    'lifecycle-member@example.test',
    crypto.randomUUID(),
    oldToken,
  ]);
  await asUser(member);
  await db.query("select public.accept_household_invitation($1,'Member')", [oldToken]);
  await expect(
    db.query('select public.revoke_household_member($1,$2)', [h, owner]),
  ).rejects.toThrow(/Owner required/);
  await asUser(owner);
  await db.query(
    "insert into public.wallets(household_id,name,type,ownership,wallet_owner,initial_balance) values($1,'Member bank','bank','personal',$2,500)",
    [h, member],
  );
  const w = String((await scalar('select id from public.wallets where household_id=$1', [h]))!.id);
  const goal = String(
    (await scalar(
      "insert into public.savings_goals(household_id,title,target_amount) values($1,'Lifecycle goal',1000) returning id",
      [h],
    ))!.id,
  );
  await asUser(member);
  const contribution = crypto.randomUUID();
  await db.query(
    'insert into public.goal_contributions(id,household_id,goal_id,amount) values($1,$2,$3,20)',
    [contribution, h, goal],
  );
  const tx = String(
    (await scalar('select public.create_transaction($1::jsonb,$2) as id', [
      JSON.stringify({
        household_id: h,
        type: 'expense',
        amount: 50,
        wallet_id: w,
        transaction_actor: member,
        transaction_scope: 'family',
        occurred_at: '2026-09-27T04:00:00Z',
      }),
      crypto.randomUUID(),
    ]))!.id,
  );
  await asUser(owner);
  await expect(
    db.query('select public.revoke_household_member($1,$2)', [h, owner]),
  ).rejects.toThrow(/Owner cannot/);
  await db.query('select public.revoke_household_member($1,$2)', [h, member]);
  await db.query('select public.revoke_household_member($1,$2)', [h, member]);
  expect(
    (await scalar('select current_balance from public.wallet_balances where id=$1', [w]))!
      .current_balance,
  ).toBe(450);
  expect(
    (await scalar(
      'select active from public.household_members where household_id=$1 and user_id=$2',
      [h, member],
    ))!.active,
  ).toBe(false);
  await expect(
    db.query('select public.create_transaction($1::jsonb,$2)', [
      JSON.stringify({
        household_id: h,
        type: 'expense',
        amount: 10,
        wallet_id: w,
        transaction_actor: member,
        transaction_scope: 'family',
        occurred_at: '2026-09-27T04:00:00Z',
      }),
      crypto.randomUUID(),
    ]),
  ).rejects.toThrow(/active member/);
  // A trusted database restore has no end-user JWT. Historical inactive identities
  // must remain restorable while browser grants/RPC checks still enforce membership.
  await db.exec("reset role; set request.jwt.claim.sub = '';");
  const restoredId = crypto.randomUUID();
  await db.query(
    `insert into public.transactions(id,household_id,type,amount,wallet_id,transaction_actor,
      transaction_scope,scope_member_id,status,occurred_at,created_by)
     values($1,$2,'expense',50,$3,$4,'personal',$4,'cancelled',now(),$4)`,
    [restoredId, h, w, member],
  );
  await db.query('delete from public.transactions where id=$1', [restoredId]);
  await asUser(member);
  expect(
    (await db.query('select * from public.transactions where household_id=$1', [h])).rows,
  ).toHaveLength(0);
  await expect(db.query('select public.trash_transaction($1)', [tx])).rejects.toThrow(
    /access denied/,
  );
  await expect(
    db.query('select * from public.get_my_ai_credential_status($1)', [h]),
  ).rejects.toThrow(/access denied/);
  await expect(
    db.query("select public.accept_household_invitation($1,'Member')", [oldToken]),
  ).rejects.toThrow(/unavailable invitation/);
  // DELETE without a WHERE/RETURNING does not rely on the SELECT RLS policy.
  await db.exec('delete from public.goal_contributions');
  await asUser(owner);
  expect(
    (await db.query('select id from public.goal_contributions where id=$1', [contribution])).rows,
  ).toHaveLength(1);
  await asUser(outsider);
  await expect(
    db.query('select public.revoke_household_member($1,$2)', [h, member]),
  ).rejects.toThrow(/Owner required/);
  await asUser(owner);
  await db.query('select public.create_household_invitation($1,$2,$3,$4)', [
    h,
    'lifecycle-member@example.test',
    crypto.randomUUID(),
    freshToken,
  ]);
  await asUser(member);
  await db.query("select public.accept_household_invitation($1,'Member returned')", [freshToken]);
  expect(
    (await scalar('select current_balance from public.wallet_balances where id=$1', [w]))!
      .current_balance,
  ).toBe(450);
  await asUser(users[0]);
});

it('AI status and revocation expose only requester metadata and deny foreign households', async () => {
  await db.exec('reset role; set role service_role');
  for (const user of users.slice(0, 2))
    await db.query('select public.store_ai_credential($1,$2,$3,$4,$5)', [
      household,
      user,
      'fixture-ciphertext',
      'fixture-iv',
      'openrouter/free',
    ]);
  await asUser(users[1]);
  const status = (
    await db.query<Record<string, unknown>>(
      'select * from public.get_my_ai_credential_status($1)',
      [household],
    )
  ).rows;
  expect(status).toHaveLength(1);
  expect(Object.keys(status[0]).sort()).toEqual(['model', 'provider', 'updated_at']);
  expect(status[0].model).toBe('openrouter/free');
  await db.query('select public.revoke_my_ai_credential($1)', [household]);
  await db.query('select public.revoke_my_ai_credential($1)', [household]);
  expect(
    (await db.query('select * from public.get_my_ai_credential_status($1)', [household])).rows,
  ).toHaveLength(0);
  await asUser(users[0]);
  expect(
    (await db.query('select * from public.get_my_ai_credential_status($1)', [household])).rows,
  ).toHaveLength(1);
  await asUser(users[2]);
  await expect(
    db.query('select * from public.get_my_ai_credential_status($1)', [household]),
  ).rejects.toThrow(/access denied/);
  await expect(db.query('select public.revoke_my_ai_credential($1)', [household])).rejects.toThrow(
    /access denied/,
  );
  await db.exec('reset role; set role anon');
  await expect(db.query('select public.revoke_my_ai_credential($1)', [household])).rejects.toThrow(
    /permission denied/,
  );
  await db.exec('reset role; set role service_role');
  expect(
    (await db.query('select * from public.read_ai_credential($1,$2)', [household, users[1]])).rows,
  ).toHaveLength(0);
  await db.query('delete from private.ai_credentials where household_id=$1', [household]);
  await asUser(users[0]);
});

it('claims signup handles atomically, normalizes case and rejects duplicates/invalid values', async () => {
  await db.exec('reset role');
  const id = crypto.randomUUID();
  await db.query(
    "insert into auth.users(id,email,raw_user_meta_data) values($1,'handle@example.test',$2::jsonb)",
    [id, JSON.stringify({ username: ' Handle_Test ' })],
  );
  await asUser(id);
  expect((await scalar('select public.get_my_username() as name'))!.name).toBe('handle_test');
  await db.exec('reset role');
  const duplicate = crypto.randomUUID();
  await expect(
    db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)', [
      duplicate,
      JSON.stringify({ username: 'HANDLE_TEST' }),
    ]),
  ).rejects.toThrow(/unique/);
  expect(
    (await scalar('select count(*) as count from auth.users where id=$1', [duplicate]))!.count,
  ).toBe(0);
  await expect(
    db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)', [
      crypto.randomUUID(),
      JSON.stringify({ username: 'bad name' }),
    ]),
  ).rejects.toThrow(/check constraint/);
  await db.query('delete from auth.users where id=$1', [id]);
});

it('legacy users claim only their own handle; metadata edits cannot hijack login identities', async () => {
  await asUser(users[0]);
  expect((await scalar('select public.get_my_username() as name'))!.name).toBeNull();
  expect((await scalar("select public.set_my_username(' Owner_Saku ') as name"))!.name).toBe(
    'owner_saku',
  );
  await asUser(users[1]);
  expect((await scalar('select public.get_my_username() as name'))!.name).toBeNull();
  await expect(db.query("select public.set_my_username('OWNER_SAKU')")).rejects.toThrow(
    'already in use',
  );
  await db.query("select public.set_my_username('member_saku')");
  await db.exec('reset role');
  await db.query('update auth.users set raw_user_meta_data=$1::jsonb,email=$2 where id=$3', [
    JSON.stringify({ username: 'owner_saku' }),
    'current-member@example.test',
    users[1],
  ]);
  await db.exec('set role service_role');
  expect(
    (await scalar("select public.resolve_username_email('MEMBER_SAKU') as email"))!.email,
  ).toBe('current-member@example.test');
  await asUser(users[1]);
  await db.query("select public.set_my_username('member_new')");
  await db.exec('reset role; set role service_role');
  expect(
    (await scalar("select public.resolve_username_email('member_saku') as email"))!.email,
  ).toBeNull();
  await asUser(users[0]);
});

it('anonymous/member cannot read the handle map, resolve emails or bypass login quotas', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`reset role; set role ${role}`);
    for (const sql of [
      'select * from private.account_usernames',
      "select public.resolve_username_email('owner_saku')",
      `select public.consume_username_login_quota('${'a'.repeat(64)}')`,
    ]) {
      await expect(db.query(sql)).rejects.toThrow(/permission denied/);
    }
  }
  await db.exec('reset role; set role anon');
  await expect(db.query("select public.set_my_username('intruder')")).rejects.toThrow(
    /permission denied/,
  );
  await expect(db.query('select public.get_my_username()')).rejects.toThrow(/permission denied/);
  await asUser(users[0]);
});

it('username login quota is atomic, bounded, service-only and prunes stale counters', async () => {
  await db.exec('reset role');
  await db.query(
    "insert into private.username_login_limits values('stale',now()-interval '2 days',1)",
  );
  await db.exec('set role service_role');
  const key = 'b'.repeat(64);
  for (let i = 0; i < 12; i++)
    expect(
      (await scalar('select public.consume_username_login_quota($1) as allowed', [key]))!.allowed,
    ).toBe(i < 10);
  expect(
    (await scalar("select public.consume_username_login_quota('invalid') as allowed"))!.allowed,
  ).toBe(false);
  await db.exec('reset role');
  expect(
    (await scalar('select count from private.username_login_limits where key=$1', [key]))!.count,
  ).toBe(11);
  expect(
    (await scalar("select count(*) as n from private.username_login_limits where key='stale'"))!.n,
  ).toBe(0);
  await db.exec(
    "update private.username_login_limits set count=1000 where key='global'; set role service_role",
  );
  expect(
    (await scalar('select public.consume_username_login_quota($1) as allowed', ['c'.repeat(64)]))!
      .allowed,
  ).toBe(false);
  await db.exec('reset role');
  expect(
    (await scalar('select count(*) as n from private.username_login_limits where key=$1', [
      'c'.repeat(64),
    ]))!.n,
  ).toBe(0);
  await asUser(users[0]);
});

const input = (over: Record<string, unknown> = {}) => ({
  household_id: household,
  type: 'expense',
  amount: 50000,
  wallet_id: wallet,
  transaction_actor: users[1],
  transaction_scope: 'family',
  status: 'completed',
  occurred_at: '2026-09-10T10:00:00+07:00',
  merchant: 'Food',
  ...over,
});
async function create(over: Record<string, unknown> = {}, key = crypto.randomUUID()) {
  return String(
    (await scalar('select public.create_transaction($1::jsonb,$2::uuid) as id', [
      JSON.stringify(input(over)),
      key,
    ]))!.id,
  );
}
it('creates atomic transfer and linked fee without double counting', async () => {
  await asUser(users[0]);
  transaction = await create({
    type: 'transfer',
    amount: 100000,
    destination_wallet_id: wallet2,
    fee_amount: 2500,
  });
  const rows = (
    await db.query<{ name: string; current_balance: number }>(
      'select name,current_balance from public.wallet_balances order by name',
    )
  ).rows;
  expect(Number(rows[0].current_balance)).toBe(897500);
  expect(Number(rows[1].current_balance)).toBe(200000);
});
it('rejects direct ledger DML even for Owner', async () => {
  await asUser(users[0]);
  await expect(db.query('update public.transactions set amount=1')).rejects.toThrow(
    /permission denied/,
  );
});
it('actor is not creator and cannot trash owner transaction', async () => {
  await asUser(users[1]);
  await expect(db.query('select public.trash_transaction($1)', [transaction])).rejects.toThrow(
    /creator or Owner/,
  );
});
it('creator can trash transfer, and Owner restores parent and fee', async () => {
  await asUser(users[0]);
  await db.query('select public.trash_transaction($1)', [transaction]);
  expect(
    (await scalar('select count(*) as n from public.transactions where deleted_at is not null'))!.n,
  ).toBe(2);
  await db.query('select public.restore_transaction($1)', [transaction]);
  expect(
    (await scalar('select count(*) as n from public.transactions where deleted_at is not null'))!.n,
  ).toBe(0);
});
it('isolates unaffiliated households and blocks RPC injection', async () => {
  await asUser(users[2]);
  expect((await db.query('select * from public.wallets')).rows).toHaveLength(0);
  await expect(create()).rejects.toThrow(/household/);
  const other = String((await scalar("select public.create_household('Other','Other') as id"))!.id);
  await expect(create({ household_id: other })).rejects.toThrow(/wallet/);
  await expect(
    db.query(
      "insert into public.budgets(household_id,name,amount,start_date,end_date,wallet_id) values($1,'Bad',100,'2026-09-01','2026-09-30',$2)",
      [other, wallet],
    ),
  ).rejects.toThrow();
});
it('retries are idempotent and conflicting payload is rejected', async () => {
  await asUser(users[0]);
  const key = crypto.randomUUID(),
    id = await create({}, key);
  expect(await create({}, key)).toBe(id);
  await expect(create({ amount: 1 }, key)).rejects.toThrow(/idempotency/);
});
it('rejects invalid split sum, identical destination, and amount decimal', async () => {
  await asUser(users[0]);
  await expect(create({ type: 'transfer', destination_wallet_id: wallet })).rejects.toThrow();
  await expect(create({ amount: 1.5 })).rejects.toThrow();
  const category = String((await scalar('select id from public.categories limit 1'))!.id);
  await expect(create({ splits: [{ category_id: category, amount: 1 }] })).rejects.toThrow(/split/);
});
it('pending entries do not affect balance', async () => {
  await asUser(users[0]);
  const before = (await scalar('select current_balance from public.wallet_balances where id=$1', [
    wallet,
  ]))!.current_balance;
  await create({ status: 'pending' });
  expect(
    (await scalar('select current_balance from public.wallet_balances where id=$1', [wallet]))!
      .current_balance,
  ).toBe(before);
});
it('requires low-confidence field acknowledgements before AI commit', async () => {
  await db.exec('reset role');
  const draft = crypto.randomUUID();
  await db.query(
    'insert into public.ai_drafts(id,household_id,created_by,candidate,confidence) values($1,$2,$3,\'{}\',\'{"amount":0.4,"wallet_id":0.99,"occurred_at":0.99,"type":0.99}\')',
    [draft, household, users[0]],
  );
  await asUser(users[0]);
  await expect(
    db.query('select public.confirm_ai_draft($1,$2::jsonb,$3::text[],$4)', [
      draft,
      JSON.stringify(input()),
      [],
      crypto.randomUUID(),
    ]),
  ).rejects.toThrow(/acknowledge/);
  await db.query('select public.confirm_ai_draft($1,$2::jsonb,$3::text[],$4)', [
    draft,
    JSON.stringify(input()),
    ['amount'],
    crypto.randomUUID(),
  ]);
  expect((await scalar('select status from public.ai_drafts where id=$1', [draft]))!.status).toBe(
    'confirmed',
  );
});
it('member can trash own record but restore remains Owner-only', async () => {
  await asUser(users[1]);
  const id = await create({ transaction_actor: users[0] });
  await db.query('select public.trash_transaction($1)', [id]);
  await expect(db.query('select public.restore_transaction($1)', [id])).rejects.toThrow(/Owner/);
  await asUser(users[0]);
  await db.query('select public.restore_transaction($1)', [id]);
});
it('cannot inject an actor from another household', async () => {
  await asUser(users[0]);
  await expect(create({ transaction_actor: users[2] })).rejects.toThrow(/foreign key/);
});
it('cannot impersonate creator through extra input fields', async () => {
  await asUser(users[1]);
  const id = await create({ created_by: users[0] });
  expect(
    (await scalar('select created_by from public.transactions where id=$1', [id]))!.created_by,
  ).toBe(users[1]);
});
it('cannot access server-only credential RPC or private tables', async () => {
  await asUser(users[0]);
  await expect(db.query('select * from private.ai_credentials')).rejects.toThrow(
    /permission denied/,
  );
  await expect(
    db.query('select public.read_ai_credential($1,$2)', [household, users[0]]),
  ).rejects.toThrow(/permission denied/);
});
it('category nesting stops at one level', async () => {
  await asUser(users[0]);
  const parent = String(
    (await scalar('select id from public.categories where parent_id is null limit 1'))!.id,
  );
  const child = String(
    (await scalar(
      "insert into public.categories(household_id,name,parent_id) values($1,'Child',$2) returning id",
      [household, parent],
    ))!.id,
  );
  await expect(
    db.query(
      "insert into public.categories(household_id,name,parent_id) values($1,'Too deep',$2)",
      [household, child],
    ),
  ).rejects.toThrow(/one subcategory/);
});
it('purge keeps 29-day trash and removes 31-day trash while retaining audit IDs', async () => {
  await asUser(users[0]);
  const old = await create({
      type: 'transfer',
      amount: 1,
      destination_wallet_id: wallet2,
      fee_amount: 1,
    }),
    young = await create({ amount: 1 });
  await db.query('select public.trash_transaction($1)', [old]);
  await db.query('select public.trash_transaction($1)', [young]);
  await db.exec('reset role');
  await db.query(
    "update public.transactions set deleted_at=now()-interval '31 days' where id=$1 or parent_transaction_id=$1",
    [old],
  );
  await db.query("update public.transactions set deleted_at=now()-interval '29 days' where id=$1", [
    young,
  ]);
  await db.exec('set role service_role');
  await db.query('select public.purge_expired_transactions()');
  await asUser(users[0]);
  expect(
    (
      await db.query('select id from public.transactions where id=$1 or parent_transaction_id=$1', [
        old,
      ])
    ).rows,
  ).toHaveLength(0);
  expect(
    (await db.query('select id from public.transactions where id=$1', [young])).rows,
  ).toHaveLength(1);
  expect(
    Number(
      (await scalar('select count(*) as n from public.activity_log where entity_id=$1', [old]))!.n,
    ),
  ).toBeGreaterThan(0);
});
it('anonymous users cannot read financial data', async () => {
  await db.exec("reset role; set request.jwt.claim.sub=''; set role anon");
  await expect(db.query('select * from public.transactions')).rejects.toThrow();
});

it('members can plan budgets/goals, but outsiders and foreign wallet references are denied', async () => {
  await asUser(users[2]);
  const foreign = String(
    (await scalar("select public.create_household('Other Planning', 'Other') as id"))!.id,
  );
  const foreignWallet = String(
    (await scalar(
      "insert into public.wallets(household_id,name,type,ownership,initial_balance) values($1,'Other','cash','shared',0) returning id",
      [foreign],
    ))!.id,
  );
  await expect(
    db.query(
      "insert into public.budgets(household_id,name,amount,start_date,end_date) values($1,'Injected',100,'2026-09-01','2026-09-30')",
      [household],
    ),
  ).rejects.toThrow(/row-level security/);
  await asUser(users[1]);
  await expect(
    db.query(
      "insert into public.budgets(household_id,name,wallet_id,amount,start_date,end_date) values($1,'Injected',$2,100,'2026-09-01','2026-09-30')",
      [household, foreignWallet],
    ),
  ).rejects.toThrow(/foreign key/);
  const budget = String(
    (await scalar(
      "insert into public.budgets(household_id,name,amount,start_date,end_date,warning_thresholds) values($1,'Member plan',100,'2026-09-01','2026-09-30',array[60,90]) returning id",
      [household],
    ))!.id,
  );
  expect(
    (
      await db.query(
        'update public.budgets set amount=200 where id=$1 and amount=100 and warning_thresholds=array[60,90] returning id',
        [budget],
      )
    ).rows,
  ).toHaveLength(1);
  expect(
    (
      await db.query(
        'update public.budgets set amount=300 where id=$1 and amount=100 returning id',
        [budget],
      )
    ).rows,
  ).toHaveLength(0);
  await db.query(
    "insert into public.savings_goals(household_id,title,target_amount) values($1,'Member goal',1000000)",
    [household],
  );
});

it('virtual contributions cannot spoof creator, repeat their ID or mutate wallet balances', async () => {
  await asUser(users[0]);
  const goal = String(
    (await scalar(
      "insert into public.savings_goals(household_id,title,target_amount) values($1,'Virtual test',1000000) returning id",
      [household],
    ))!.id,
  );
  const before = (
    await db.query('select id,current_balance from public.wallet_balances order by id')
  ).rows;
  await asUser(users[1]);
  await expect(
    db.query(
      'insert into public.goal_contributions(household_id,goal_id,amount,created_by) values($1,$2,100,$3)',
      [household, goal, users[0]],
    ),
  ).rejects.toThrow(/row-level security/);
  const id = crypto.randomUUID();
  await db.query(
    'insert into public.goal_contributions(id,household_id,goal_id,amount,created_by) values($1,$2,$3,25000,$4)',
    [id, household, goal, users[1]],
  );
  await expect(
    db.query(
      'insert into public.goal_contributions(id,household_id,goal_id,amount,created_by) values($1,$2,$3,25000,$4)',
      [id, household, goal, users[1]],
    ),
  ).rejects.toThrow(/duplicate key/);
  expect(
    (await db.query('select id,current_balance from public.wallet_balances order by id')).rows,
  ).toEqual(before);
  await expect(
    db.query('update public.goal_contributions set amount=100 where id=$1', [id]),
  ).rejects.toThrow(/permission denied/);
  await asUser(users[0]);
  expect(
    (await db.query('delete from public.goal_contributions where id=$1 returning id', [id])).rows,
  ).toHaveLength(1);
});

it('a Member cannot delete another creator virtual contribution', async () => {
  await asUser(users[0]);
  const goal = String(
    (await scalar(
      "insert into public.savings_goals(household_id,title,target_amount) values($1,'Creator delete',1000000) returning id",
      [household],
    ))!.id,
  );
  const id = String(
    (await scalar(
      'insert into public.goal_contributions(household_id,goal_id,amount,created_by) values($1,$2,100,$3) returning id',
      [household, goal, users[0]],
    ))!.id,
  );
  await asUser(users[1]);
  expect(
    (await db.query('delete from public.goal_contributions where id=$1 returning id', [id])).rows,
  ).toHaveLength(0);
  expect(
    (await db.query('select id from public.goal_contributions where id=$1', [id])).rows,
  ).toHaveLength(1);
});

it('revisions are atomic, preserve creator/tags and synchronize fee/status/wallet', async () => {
  await asUser(users[1]);
  const id = await create({ type: 'transfer', destination_wallet_id: wallet2, fee_amount: 2500 });
  await asUser(users[0]);
  const tag = String(
    (await scalar(
      "insert into public.tags(household_id,name) values($1,'Revision tag') returning id",
      [household],
    ))!.id,
  );
  await db.exec('reset role');
  await db.query('insert into public.transaction_tags values($1,$2,$3)', [id, household, tag]);
  await asUser(users[0]);
  const before = await scalar('select sum(current_balance) as n from public.wallet_balances');
  await revise(id, 1, {
    type: 'transfer',
    amount: 100000,
    wallet_id: wallet2,
    destination_wallet_id: wallet,
    fee_amount: 3500,
    status: 'pending',
  });
  const t = await scalar('select * from public.transactions where id=$1', [id]);
  expect(t!.created_by).toBe(users[1]);
  expect(t!.version).toBe(2);
  const fee = await scalar('select * from public.transactions where parent_transaction_id=$1', [
    id,
  ]);
  expect(fee!.created_by).toBe(users[1]);
  expect(fee!.status).toBe('pending');
  expect(fee!.wallet_id).toBe(wallet2);
  expect(Number(fee!.amount)).toBe(3500);
  expect(
    Number((await scalar('select sum(current_balance) as n from public.wallet_balances'))!.n) -
      Number(before!.n),
  ).toBe(2500);
  expect(
    (await scalar('select count(*) as n from public.transaction_tags where transaction_id=$1', [
      id,
    ]))!.n,
  ).toBe(1);
  expect(
    (await scalar(
      'select count(*) as n from public.transaction_revisions where transaction_id=$1',
      [id],
    ))!.n,
  ).toBe(1);
  await asUser(users[1]);
  expect(
    (await db.query('select * from public.transaction_revisions where transaction_id=$1', [id]))
      .rows,
  ).toHaveLength(1);
  await asUser(users[0]);
  await revise(id, 2, { amount: 40000, wallet_id: wallet2, fee_amount: 0 });
  expect(
    (await scalar('select count(*) as n from public.transactions where parent_transaction_id=$1', [
      id,
    ]))!.n,
  ).toBe(0);
});

it('revision retry is exact-once and rejects stale versions and changed request payload', async () => {
  await asUser(users[0]);
  const id = await create();
  const key = crypto.randomUUID();
  expect((await revise(id, 1, { amount: 60000 }, key))!.version).toBe(2);
  expect((await revise(id, 1, { amount: 60000 }, key))!.version).toBe(2);
  await expect(revise(id, 1, { amount: 60001 }, key)).rejects.toThrow(/payload mismatch/);
  await expect(revise(id, 1, { amount: 70000 })).rejects.toThrow(/version conflict/);
  expect(
    (await scalar(
      'select count(*) as n from public.transaction_revisions where transaction_id=$1',
      [id],
    ))!.n,
  ).toBe(1);
});

it('revision split/FK failures rollback principal, fee and history', async () => {
  await asUser(users[0]);
  const id = await create();
  const category = String(
    (await scalar("select id from public.categories where name='Makanan'"))!.id,
  );
  await revise(id, 1, { amount: 60000, splits: [{ category_id: category, amount: 60000 }] });
  await expect(
    revise(id, 2, { amount: 70000, splits: [{ category_id: category, amount: 1 }] }),
  ).rejects.toThrow(/split sum/);
  await expect(
    revise(id, 2, { amount: 70000, splits: [{ category_id: crypto.randomUUID(), amount: 70000 }] }),
  ).rejects.toThrow(/foreign key/);
  expect(
    Number((await scalar('select amount from public.transactions where id=$1', [id]))!.amount),
  ).toBe(60000);
  expect(
    Number(
      (await scalar('select amount from public.transaction_splits where transaction_id=$1', [id]))!
        .amount,
    ),
  ).toBe(60000);
  expect(
    (await scalar(
      'select count(*) as n from public.transaction_revisions where transaction_id=$1',
      [id],
    ))!.n,
  ).toBe(1);
});

it('revision permissions deny actor-only, outsiders, direct DML, child edits and trash edits', async () => {
  await asUser(users[0]);
  const id = await create({ type: 'transfer', destination_wallet_id: wallet2, fee_amount: 100 });
  const child = String(
    (await scalar('select id from public.transactions where parent_transaction_id=$1', [id]))!.id,
  );
  await asUser(users[1]);
  await expect(revise(id, 1, { amount: 1 })).rejects.toThrow(/creator or Owner/);
  expect(
    (await db.query('select * from public.transaction_revisions where transaction_id=$1', [id]))
      .rows,
  ).toHaveLength(0);
  await asUser(users[2]);
  await expect(revise(id, 1, { amount: 1 })).rejects.toThrow(/access denied/);
  await asUser(users[0]);
  await expect(revise(child, 1, { amount: 1 })).rejects.toThrow(/parent transfer/);
  await expect(revise(id, 1, { created_by: users[1] })).rejects.toThrow(/immutable/);
  await expect(db.query('delete from public.transaction_revisions')).rejects.toThrow(
    /permission denied/,
  );
  await db.query('select public.trash_transaction($1)', [id]);
  await expect(revise(id, 2, { amount: 1 })).rejects.toThrow(/trashed/);
});

it('revision history disappears with permanent parent purge after trash retention', async () => {
  await asUser(users[0]);
  const id = await create();
  await revise(id, 1, { amount: 60000 });
  await db.query('select public.trash_transaction($1)', [id]);
  await db.exec('reset role');
  await db.query("update public.transactions set deleted_at=now()-interval '31 days' where id=$1", [
    id,
  ]);
  await db.query('select public.purge_expired_transactions()');
  await asUser(users[0]);
  expect(
    (await db.query('select * from public.transaction_revisions where transaction_id=$1', [id]))
      .rows,
  ).toHaveLength(0);
});

it('OpenRouter credential migration preserves legacy provider, restricts storage to free model and service-only RPC', async () => {
  await db.exec('reset role');
  await db.query(
    "insert into private.ai_credentials(household_id,user_id,provider,ciphertext,iv,model) values($1,$2,'openai','test-legacy-cipher','test-iv','gpt-4.1-mini')",
    [household, users[0]],
  );
  await db.exec('set role service_role');
  const old = await scalar('select * from public.read_ai_credential($1,$2)', [household, users[0]]);
  expect(old!.provider).toBe('openai');
  expect(old!.ciphertext).toBe('test-legacy-cipher');
  await expect(
    db.query('select public.store_ai_credential($1,$2,$3,$4,$5)', [
      household,
      users[0],
      'test-cipher',
      'iv',
      'paid/model',
    ]),
  ).rejects.toThrow(/free router/);
  await db.query('select public.store_ai_credential($1,$2,$3,$4,$5)', [
    household,
    users[0],
    'test-new-cipher',
    'new-iv',
    'openrouter/free',
  ]);
  const current = await scalar('select * from public.read_ai_credential($1,$2)', [
    household,
    users[0],
  ]);
  expect(current!.provider).toBe('openrouter');
  expect(current!.model).toBe('openrouter/free');
  expect(current!.ciphertext).toBe('test-new-cipher');
  await asUser(users[0]);
  await expect(
    db.query('select public.read_ai_credential($1,$2)', [household, users[0]]),
  ).rejects.toThrow(/permission denied/);
});

it('replaces tags atomically, records history, rejects duplicates and supports retry/clear', async () => {
  await asUser(users[0]);
  const id = await create();
  const tag = String(
    (await scalar(
      "insert into public.tags(household_id,name) values($1,'Editable tag') returning id",
      [household],
    ))!.id,
  );
  const key = crypto.randomUUID();
  await revise(id, 1, { tag_ids: [tag] }, key);
  await revise(id, 1, { tag_ids: [tag] }, key);
  expect(
    (await scalar(
      'select count(*) as n from public.transaction_revisions where transaction_id=$1',
      [id],
    ))!.n,
  ).toBe(1);
  expect(
    (await scalar(
      'select after_snapshot from public.transaction_revisions where transaction_id=$1',
      [id],
    ))!.after_snapshot,
  ).toMatchObject({ tags: [{ tag_id: tag }] });
  await expect(revise(id, 2, { amount: 99999, tag_ids: [tag, tag] })).rejects.toThrow();
  await expect(revise(id, 2, { amount: 99999, tag_ids: [crypto.randomUUID()] })).rejects.toThrow();
  expect(
    await scalar('select amount,version from public.transactions where id=$1', [id]),
  ).toMatchObject({ amount: 50000, version: 2 });
  await expect(db.query('delete from public.tags where id=$1', [tag])).rejects.toThrow();
  await revise(id, 2, { tag_ids: [] });
  expect(
    (await scalar('select count(*) as n from public.transaction_tags where transaction_id=$1', [
      id,
    ]))!.n,
  ).toBe(0);
  await db.query('delete from public.tags where id=$1', [tag]);
});

it('restricts used category deletion and subcategories beyond one level', async () => {
  await asUser(users[0]);
  const parent = String(
    (await scalar(
      "insert into public.categories(household_id,name) values($1,'Catalog parent') returning id",
      [household],
    ))!.id,
  );
  const child = String(
    (await scalar(
      "insert into public.categories(household_id,name,parent_id) values($1,'Catalog child',$2) returning id",
      [household, parent],
    ))!.id,
  );
  await expect(
    db.query(
      "insert into public.categories(household_id,name,parent_id) values($1,'Too deep',$2)",
      [household, child],
    ),
  ).rejects.toThrow();
  await expect(db.query('delete from public.categories where id=$1', [parent])).rejects.toThrow();
  await create({ category_id: child });
  await expect(db.query('delete from public.categories where id=$1', [child])).rejects.toThrow();
  await asUser(users[2]);
  expect(
    (
      await db.query('update public.categories set name=$1 where id=$2 returning id', [
        'Cross tenant',
        child,
      ])
    ).rows,
  ).toHaveLength(0);
});

async function inviteUser(email: string, confirmed = true) {
  const id = crypto.randomUUID();
  await db.exec('reset role');
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,$3)', [
    id,
    email,
    confirmed ? new Date().toISOString() : null,
  ]);
  await asUser(users[0]);
  return id;
}
async function invite(
  email: string,
  token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', ''),
  id = crypto.randomUUID(),
) {
  await scalar('select public.create_household_invitation($1,$2,$3,$4) as id', [
    household,
    email,
    id,
    token,
  ]);
  return { id, token };
}
async function acceptInvite(token: string, name = 'New member') {
  return scalar('select public.accept_household_invitation($1,$2) as id', [token, name]);
}
it('invitation management is Owner-only and codes never appear in list/private reads', async () => {
  await asUser(users[1]);
  await expect(invite('owner-only@example.test')).rejects.toThrow(/Owner/);
  await expect(
    db.query<Record<string, unknown>>('select * from public.list_household_invitations($1)', [
      household,
    ]),
  ).rejects.toThrow(/Owner/);
  await expect(db.query('select * from private.household_invitations')).rejects.toThrow(
    /permission/,
  );
  await asUser(users[0]);
  const created = await invite('  Recipient@Example.test  ');
  await invite('recipient@example.test', created.token, created.id);
  await expect(invite('changed@example.test', created.token, created.id)).rejects.toThrow(
    /conflict/,
  );
  await expect(invite('recipient@example.test')).rejects.toThrow(/active invitation/);
  const rows = (
    await db.query<Record<string, unknown>>('select * from public.list_household_invitations($1)', [
      household,
    ])
  ).rows;
  expect(rows.find((row) => row.id === created.id)).toMatchObject({
    email: 'recipient@example.test',
    status: 'pending',
  });
  expect(JSON.stringify(rows)).not.toContain(created.token);
  await db.exec('reset role');
  expect(
    (await scalar('select token_hash from private.household_invitations where id=$1', [
      created.id,
    ]))!.token_hash,
  ).not.toBe(created.token);
  await db.exec('set role anon');
  await expect(acceptInvite(created.token)).rejects.toThrow(/permission/);
});
it('accept requires the bound verified email and grants only Member with safe retry', async () => {
  const target = await inviteUser('joiner@example.test', false);
  const wrong = await inviteUser('wrong@example.test');
  const created = await invite('JOINER@example.test');
  await asUser(wrong);
  expect((await db.query('select * from public.wallets')).rows).toHaveLength(0);
  await expect(acceptInvite(created.token)).rejects.toThrow(/unavailable/);
  await asUser(target);
  await expect(acceptInvite(created.token)).rejects.toThrow(/verified/);
  await db.exec('reset role');
  await db.query('update auth.users set email_confirmed_at=now() where id=$1', [target]);
  await asUser(target);
  expect((await acceptInvite(created.token))!.id).toBe(household);
  await acceptInvite(created.token);
  expect(
    await scalar('select role,display_name from public.household_members where user_id=$1', [
      target,
    ]),
  ).toMatchObject({ role: 'member', display_name: 'New member' });
  expect((await db.query('select * from public.wallets')).rows.length).toBeGreaterThan(0);
  await expect(
    db.query<Record<string, unknown>>('select * from public.list_household_invitations($1)', [
      household,
    ]),
  ).rejects.toThrow(/Owner/);
  await asUser(wrong);
  await expect(acceptInvite(created.token)).rejects.toThrow(/unavailable/);
  await asUser(users[0]);
  await expect(
    db.query('select public.revoke_household_invitation($1)', [created.id]),
  ).rejects.toThrow(/accepted/);
  expect(
    (await scalar(
      "select count(*) as n from public.activity_log where entity_id=$1 and action='accept'",
      [created.id],
    ))!.n,
  ).toBe(1);
});
it('expired and revoked invitations cannot join; revoke retry is safe and outsiders denied', async () => {
  const target = await inviteUser('expired@example.test');
  const expired = await invite('expired@example.test');
  await db.exec('reset role');
  await db.query(
    "update private.household_invitations set expires_at=now()-interval '1 second' where id=$1",
    [expired.id],
  );
  await asUser(target);
  await expect(acceptInvite(expired.token)).rejects.toThrow(/unavailable/);
  await asUser(users[0]);
  const fresh = await invite('expired@example.test');
  await asUser(users[2]);
  await expect(
    db.query('select public.revoke_household_invitation($1)', [fresh.id]),
  ).rejects.toThrow(/access denied/);
  await asUser(users[0]);
  await db.query('select public.revoke_household_invitation($1)', [fresh.id]);
  await db.query('select public.revoke_household_invitation($1)', [fresh.id]);
  await asUser(target);
  await expect(acceptInvite(fresh.token)).rejects.toThrow(/unavailable/);
  expect(
    (await db.query('select * from public.household_members where user_id=$1', [target])).rows,
  ).toHaveLength(0);
});
it('rejects invalid invite inputs, blank names and joining from an existing household', async () => {
  const target = await inviteUser('other-household@example.test');
  const created = await invite('other-household@example.test');
  await expect(invite('not-an-email')).rejects.toThrow(/invalid/);
  await expect(invite('valid@example.test', 'bad-token')).rejects.toThrow(/invalid/);
  await asUser(target);
  await expect(acceptInvite(created.token, '   ')).rejects.toThrow(/display name/);
  await scalar("select public.create_household('Existing family','Existing owner') as id");
  await expect(acceptInvite(created.token)).rejects.toThrow(/already belongs/);
  await expect(acceptInvite('bad-code')).rejects.toThrow(/unavailable/);
});

it('limits outstanding invitations to20 and rejects another invitation after the limit', async () => {
  await asUser(users[0]);
  const rows = (
    await db.query<Record<string, unknown>>('select * from public.list_household_invitations($1)', [
      household,
    ])
  ).rows;
  const pending = rows.filter((row) => row.status === 'pending').length;
  for (let n = pending; n < 20; n++) await invite(`bounded-${n}@example.test`);
  await expect(invite('too-many@example.test')).rejects.toThrow(/maximum20/);
});
