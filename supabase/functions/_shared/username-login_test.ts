import { HttpError } from './http.ts';
import { INVALID_LOGIN, usernameLogin, type LoginDependencies } from './username-login.ts';
function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}
const tokens = { access_token: 'fake-access', refresh_token: 'fake-refresh' };
async function failure(input: unknown, deps: LoginDependencies, status: number, message?: string) {
  try {
    await usernameLogin(input, deps);
    throw new Error('Expected rejection');
  } catch (e) {
    assert(
      e instanceof HttpError && e.status === status && (!message || e.message === message),
      'Wrong error',
    );
  }
}
Deno.test('username login normalizes, consumes quota first and returns tokens only', async () => {
  const order: string[] = [];
  const result = await usernameLogin(
    { username: ' Owner_Saku ', password: 'test-only-password' },
    {
      quota: async (key) => {
        assert(/^[a-f0-9]{64}$/.test(key), 'Unhashed rate key');
        order.push('quota');
        return true;
      },
      resolve: async (username) => {
        assert(username === 'owner_saku', 'Wrong normalization');
        order.push('resolve');
        return 'owner@example.test';
      },
      authenticate: async (email, password) => {
        assert(email === 'owner@example.test' && password === 'test-only-password', 'Wrong auth');
        order.push('auth');
        return { ...tokens, email } as typeof tokens;
      },
    },
  );
  assert(order.join(',') === 'quota,resolve,auth', 'Wrong order');
  assert(JSON.stringify(result) === JSON.stringify(tokens), 'Identity leaked');
});
Deno.test(
  'unknown and wrong-password accounts have same response and both contact Auth',
  async () => {
    const emails: string[] = [];
    const deps: LoginDependencies = {
      quota: async () => true,
      resolve: async () => null,
      authenticate: async (email) => {
        emails.push(email);
        return null;
      },
    };
    const input = { username: 'owner', password: 'wrong-test-password' };
    await failure(input, deps, 401, INVALID_LOGIN);
    await failure(
      input,
      { ...deps, resolve: async () => 'owner@example.test' },
      401,
      INVALID_LOGIN,
    );
    assert(emails.length === 2, 'Unknown path skipped Auth');
  },
);
Deno.test('quota denial never resolves or authenticates; invalid inputs rejected', async () => {
  const deps: LoginDependencies = {
    quota: async () => false,
    resolve: async () => {
      throw new Error('Must not resolve');
    },
    authenticate: async () => {
      throw new Error('Must not authenticate');
    },
  };
  await failure({ username: 'owner', password: 'wrong-test-password' }, deps, 429);
  for (const username of ['xy', '_owner', 'bad name', 'owner@example.test', 'a'.repeat(31)]) {
    await failure({ username, password: 'wrong-test-password' }, deps, 400);
  }
  await failure({ username: 'owner', password: 'x'.repeat(1025) }, deps, 400);
});
