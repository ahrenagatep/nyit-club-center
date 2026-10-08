'use strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost/test';

const { test, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const supabase = require('../src/config/supabase');
const pool = require('../src/config/db');
const { BIO_MAX_LENGTH } = require('../src/controllers/profileController');
const app = require('../src/app');

const AUTH_USER_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = 42;
const OTHER_USER_ID = 99;
const VALID_TOKEN = 'valid-access-token';

let getUserImpl;
let queryImpl;

mock.method(supabase.auth, 'getUser', (...args) => getUserImpl(...args));
mock.method(pool, 'query', (...args) => queryImpl(...args));

beforeEach(() => {
  getUserImpl = async (token) => {
    if (token === VALID_TOKEN) {
      return { data: { user: { id: AUTH_USER_ID, email: 'student@nyit.edu' } }, error: null };
    }
    return { data: { user: null }, error: { message: 'Invalid token' } };
  };

  queryImpl = async (sql, params) => {
    if (/SELECT .* FROM users WHERE auth_user_id/i.test(sql)) {
      assert.deepEqual(params, [AUTH_USER_ID]);
      return {
        rows: [
          {
            user_id: USER_ID,
            nyit_email: 'student@nyit.edu',
            username: 'student',
            first_name: 'Test',
            last_name: 'User',
            role: 'student',
          },
        ],
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  };
});

function request({ method, path, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const payload = body === undefined ? undefined : JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            ...(payload !== undefined ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
            ...headers,
          },
        },
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            server.close();
            const text = Buffer.concat(chunks).toString('utf8');
            let parsed = text;
            try {
              parsed = text ? JSON.parse(text) : null;
            } catch {
              parsed = text;
            }
            resolve({ status: res.statusCode, body: parsed });
          });
        }
      );
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      if (payload !== undefined) {
        req.write(payload);
      }
      req.end();
    });
  });
}

function patchBio(body, token = VALID_TOKEN) {
  return request({
    method: 'PATCH',
    path: '/api/me/profile/bio',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
}

test('updates only the authenticated user bio and returns it', async () => {
  let updateParams;
  const originalQuery = queryImpl;
  queryImpl = async (sql, params) => {
    if (/UPDATE users SET bio/i.test(sql)) {
      updateParams = params;
      return { rows: [{ bio: params[0] }] };
    }
    return originalQuery(sql, params);
  };

  const res = await patchBio({ bio: 'My updated bio' });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { bio: 'My updated bio' });
  assert.deepEqual(updateParams, ['My updated bio', USER_ID]);
});

test('allows an empty string to clear the bio', async () => {
  let updateParams;
  const originalQuery = queryImpl;
  queryImpl = async (sql, params) => {
    if (/UPDATE users SET bio/i.test(sql)) {
      updateParams = params;
      return { rows: [{ bio: params[0] }] };
    }
    return originalQuery(sql, params);
  };

  const res = await patchBio({ bio: '' });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { bio: '' });
  assert.deepEqual(updateParams, ['', USER_ID]);
});

test('rejects a bio longer than 300 characters', async () => {
  let updateCalled = false;
  const originalQuery = queryImpl;
  queryImpl = async (sql, params) => {
    if (/UPDATE users SET bio/i.test(sql)) {
      updateCalled = true;
    }
    return originalQuery(sql, params);
  };

  const res = await patchBio({ bio: 'a'.repeat(BIO_MAX_LENGTH + 1) });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, `bio must be ${BIO_MAX_LENGTH} characters or fewer`);
  assert.equal(updateCalled, false);
});

test('rejects a missing bio field', async () => {
  const res = await patchBio({});
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Missing fields: bio');
});

test('rejects a non-string bio', async () => {
  const res = await patchBio({ bio: 123 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'bio must be a string');
});

test('rejects a non-object request body', async () => {
  const res = await patchBio(['not', 'an', 'object']);
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Request body must be a JSON object');
});

test('rejects unauthenticated requests', async () => {
  const res = await patchBio({ bio: 'hello' }, null);
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Missing authorization token');
});

test('rejects invalid tokens', async () => {
  const res = await patchBio({ bio: 'hello' }, 'expired-token');
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Invalid or expired token');
});

test('ignores a client-supplied user_id and updates only the authenticated user', async () => {
  let updateParams;
  const originalQuery = queryImpl;
  queryImpl = async (sql, params) => {
    if (/UPDATE users SET bio/i.test(sql)) {
      updateParams = params;
      return { rows: [{ bio: params[0] }] };
    }
    return originalQuery(sql, params);
  };

  const res = await patchBio({
    bio: 'Should stay on my profile',
    user_id: OTHER_USER_ID,
    auth_user_id: '22222222-2222-2222-2222-222222222222',
  });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { bio: 'Should stay on my profile' });
  assert.equal(updateParams[1], USER_ID);
  assert.notEqual(updateParams[1], OTHER_USER_ID);
});
