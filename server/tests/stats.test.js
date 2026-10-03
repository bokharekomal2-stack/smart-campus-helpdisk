import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

let server;
let baseUrl;
let token;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });

  const email = `stats_user_${Date.now()}@campus.edu`;
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Stats User',
      email,
      password: 'Password123!',
      student_id: 'STU-1100',
    }),
  });
  const data = await res.json();
  token = data.token;
});

after((done) => {
  server.close(done);
});

describe('Dashboard Statistics & AI Service Integration Tests', () => {
  it('should return structured dashboard statistics', async () => {
    const res = await fetch(`${baseUrl}/api/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.stats);
    assert.strictEqual(typeof data.stats.total, 'number');
    assert.ok(data.stats.statusCounts);
    assert.ok('Pending' in data.stats.statusCounts);
    assert.ok('In Progress' in data.stats.statusCounts);
    assert.ok('Resolved' in data.stats.statusCounts);
    assert.ok(Array.isArray(data.stats.categories));
  });

  it('should gracefully handle unconfigured Google Gemini API key without failing', async () => {
    const res = await fetch(`${baseUrl}/api/ai/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.service, 'Google Gemini AI');
    assert.strictEqual(typeof data.configured, 'boolean');
  });

  it('should return clear instruction message when AI triage is called without API key', async () => {
    const res = await fetch(`${baseUrl}/api/ai/triage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Broken chair in library',
        description: 'The wooden chair at desk 4 has a cracked backrest and leg.',
        location: 'Library 2nd Floor',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    // If not configured, it should have configured: false with instructions
    if (!data.configured) {
      assert.match(data.message, /GEMINI_API_KEY/i);
      assert.strictEqual(data.data, null);
    }
  });
});
