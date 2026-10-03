import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import database from '../src/db/database.js';

let server;
let baseUrl;
let studentToken;
let adminToken;
let testRequestId;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });

  // Register a test student
  const studentEmail = `req_student_${Date.now()}@campus.edu`;
  const sRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sam Tester',
      email: studentEmail,
      password: 'Password123!',
      student_id: 'STU-7721',
    }),
  });
  const sData = await sRes.json();
  studentToken = sData.token;

  // Create an admin user directly in database
  const adminEmail = `test_admin_${Date.now()}@campus.edu`;
  database.run(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES (?, ?, 'dummy_hash', 'admin', 'IT Operations')`,
    ['Admin Officer', adminEmail]
  );
  const adminUser = database.get('SELECT * FROM users WHERE email = ?', [adminEmail]);

  // Generate admin token
  const jwt = await import('jsonwebtoken');
  const { config } = await import('../src/config/env.js');
  adminToken = jwt.default.sign(
    { id: adminUser.id, email: adminUser.email, role: 'admin' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
});

after((done) => {
  server.close(done);
});

describe('Campus Service Requests & Lifecycle Tests', () => {
  it('should reject request submission with missing required fields', async () => {
    const res = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'AB', // too short
        description: 'short',
        category: 'NonExistentCategory',
        location: '',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
  });

  it('should allow student to submit a valid campus request', async () => {
    const res = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Projector lamp burned out in Lecture Hall A',
        description: 'During CS101 class, the ceiling projector displayed an overheat warning and powered off with lamp error code 4.',
        category: 'IT Services',
        priority: 'High',
        location: 'Science Complex, Lecture Hall A',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.request.id);
    assert.ok(data.request.ticket_number.startsWith('SCH-'));
    assert.strictEqual(data.request.status, 'Pending');
    assert.strictEqual(data.request.priority, 'High');

    testRequestId = data.request.id;
  });

  it('should list requests with search and category filters', async () => {
    const res = await fetch(
      `${baseUrl}/api/requests?category=IT%20Services&search=Projector`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.requests));
    assert.ok(data.requests.length >= 1);
    assert.strictEqual(data.requests[0].id, testRequestId);
  });

  it('should deny status update by student (admin-only route)', async () => {
    const res = await fetch(`${baseUrl}/api/requests/${testRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        status: 'Resolved',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 403);
    assert.strictEqual(data.success, false);
  });

  it('should allow admin to update request status to In Progress', async () => {
    const res = await fetch(`${baseUrl}/api/requests/${testRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'In Progress',
        admin_notes: 'Technician dispatched with replacement bulb model EP-90.',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.request.status, 'In Progress');
  });

  it('should allow admin to resolve the request and record audit trail', async () => {
    const res = await fetch(`${baseUrl}/api/requests/${testRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Resolved',
        resolution_notes: 'Installed brand new OEM projector bulb and recalibrated display focus.',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.request.status, 'Resolved');
    assert.ok(data.request.resolved_at);

    // Verify detail endpoint shows history
    const detailRes = await fetch(`${baseUrl}/api/requests/${testRequestId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await detailRes.json();
    assert.strictEqual(detailRes.status, 200);
    assert.ok(detailData.history.length >= 3); // Pending -> In Progress -> Resolved
  });

  it('should allow posting comments to the request', async () => {
    const res = await fetch(`${baseUrl}/api/requests/${testRequestId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        note: 'Thank you! The projector is working clearly now for our afternoon lecture.',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.note.id);
  });
});
