import bcrypt from 'bcryptjs';
import database from './database.js';

console.log('Seeding Smart Campus Helpdesk database...');

const saltRounds = 10;
const adminPassword = bcrypt.hashSync('AdminPass123!', saltRounds);
const studentPassword = bcrypt.hashSync('StudentPass123!', saltRounds);

// Clear existing sample records to ensure idempotent seeding
database.transaction(() => {
  database.exec('DELETE FROM status_history;');
  database.exec('DELETE FROM request_notes;');
  database.exec('DELETE FROM requests;');
  database.exec('DELETE FROM users;');

  // Insert Users
  const insertUser = database.raw.prepare(`
    INSERT INTO users (name, email, password_hash, role, student_id, department, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const uAdmin = insertUser.run(
    'Admin Sarah Miller',
    'admin@campus.edu',
    adminPassword,
    'admin',
    null,
    'IT Operations & Helpdesk',
    '555-0100'
  );

  const uFacilities = insertUser.run(
    'Facilities Coordinator John Hayes',
    'facilities@campus.edu',
    adminPassword,
    'admin',
    null,
    'Facilities & Infrastructure',
    '555-0101'
  );

  const uStudentAlex = insertUser.run(
    'Alex Rivera',
    'student@campus.edu',
    studentPassword,
    'student',
    'STU-2024-1001',
    'Computer Science & Engineering',
    '555-0201'
  );

  const uStudentMaria = insertUser.run(
    'Maria Chen',
    'maria@campus.edu',
    studentPassword,
    'student',
    'STU-2024-2045',
    'Electrical & Robotics Engineering',
    '555-0202'
  );

  const uStudentDavid = insertUser.run(
    'David Kim',
    'david@campus.edu',
    studentPassword,
    'student',
    'STU-2024-3092',
    'School of Business Management',
    '555-0203'
  );

  const adminId = Number(uAdmin.lastInsertRowid);
  const alexId = Number(uStudentAlex.lastInsertRowid);
  const mariaId = Number(uStudentMaria.lastInsertRowid);
  const davidId = Number(uStudentDavid.lastInsertRowid);

  // Insert Requests
  const insertReq = database.raw.prepare(`
    INSERT INTO requests (
      ticket_number, title, description, category, priority, location,
      status, attachment_url, attachment_name, student_id, assigned_to,
      admin_notes, resolution_notes, resolved_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHist = database.raw.prepare(`
    INSERT INTO status_history (request_id, changed_by, from_status, to_status, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertNote = database.raw.prepare(`
    INSERT INTO request_notes (request_id, user_id, note, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Request 1: IT Services (In Progress)
  const req1 = insertReq.run(
    'SCH-2026-0001',
    'Wi-Fi repeatedly disconnecting in Turing Hall',
    'Every 10-15 minutes, eduroam and Campus-Guest drop connections in Turing Hall 3rd floor study lounge. Multiple laptops and phones are affected during group project sessions.',
    'IT Services',
    'High',
    'Turing Hall 3rd Floor, Room 302',
    'In Progress',
    null,
    null,
    alexId,
    adminId,
    'Network engineering checked AP-302B. Packet loss detected on PoE switch port 14.',
    null,
    null,
    '2026-10-01 09:30:00',
    '2026-10-02 11:15:00'
  );
  const req1Id = Number(req1.lastInsertRowid);
  insertHist.run(req1Id, alexId, null, 'Pending', 'Request submitted by Alex Rivera', '2026-10-01 09:30:00');
  insertHist.run(req1Id, adminId, 'Pending', 'In Progress', 'Assigned to Network Operations for AP transceiver replacement', '2026-10-02 11:15:00');
  insertNote.run(req1Id, adminId, 'Technician dispatched to replace the PoE injector on 3rd floor switch.', 0, '2026-10-02 11:20:00');

  // Request 2: Facilities (Pending)
  const req2 = insertReq.run(
    'SCH-2026-0002',
    'Water pipe leaking under bathroom sink in Dorm B',
    'There is a persistent water drip under sink #2 in the 2nd floor communal bathroom of Dorm Block B. Water is pooling onto the floor tiles creating a slip hazard.',
    'Facilities & Maintenance',
    'Urgent',
    'Dormitory Block B, 2nd Floor North Bathroom',
    'Pending',
    null,
    null,
    mariaId,
    null,
    null,
    null,
    null,
    '2026-10-02 14:20:00',
    '2026-10-02 14:20:00'
  );
  const req2Id = Number(req2.lastInsertRowid);
  insertHist.run(req2Id, mariaId, null, 'Pending', 'Request submitted by Maria Chen', '2026-10-02 14:20:00');

  // Request 3: Library (Resolved)
  const req3 = insertReq.run(
    'SCH-2026-0003',
    'Main library color printer out of toner and paper jammed',
    'Printer LP-2 on 1st floor next to reference desk displays "Cartridge Drum Error" and has paper jammed in Tray 2.',
    'Library',
    'Medium',
    'Central Library 1st Floor Printing Bay',
    'Resolved',
    null,
    null,
    davidId,
    adminId,
    'Paper jam cleared and Cyan toner cartridge replaced with spare inventory.',
    'Replaced toner cartridge, cleared jam in feeder roller 2, and ran test print alignment successfully.',
    '2026-10-01 16:45:00',
    '2026-09-30 14:00:00',
    '2026-10-01 16:45:00'
  );
  const req3Id = Number(req3.lastInsertRowid);
  insertHist.run(req3Id, davidId, null, 'Pending', 'Request submitted by David Kim', '2026-09-30 14:00:00');
  insertHist.run(req3Id, adminId, 'Pending', 'In Progress', 'Assigned to Library IT support staff', '2026-09-30 15:30:00');
  insertHist.run(req3Id, adminId, 'In Progress', 'Resolved', 'Maintenance completed and printer verified online', '2026-10-01 16:45:00');
  insertNote.run(req3Id, adminId, 'Printer LP-2 is back online and operational. Test print verified.', 0, '2026-10-01 16:46:00');

  // Request 4: Transportation (Pending)
  const req4 = insertReq.run(
    'SCH-2026-0004',
    'Campus shuttle Route 3 tracker displaying incorrect arrival times',
    'The live GPS transit display board at North Gate consistently shows 25 minutes delay even when shuttles are departing on time, causing confusion for morning commuter students.',
    'Transportation',
    'Medium',
    'North Gate Transit Center Shelter A',
    'Pending',
    null,
    null,
    alexId,
    null,
    null,
    null,
    null,
    '2026-10-03 08:15:00',
    '2026-10-03 08:15:00'
  );
  const req4Id = Number(req4.lastInsertRowid);
  insertHist.run(req4Id, alexId, null, 'Pending', 'Request submitted by Alex Rivera', '2026-10-03 08:15:00');

  // Request 5: Safety & Security (In Progress)
  const req5 = insertReq.run(
    'SCH-2026-0005',
    'Flickering exterior pathway light behind Science Complex',
    'The high-intensity LED pole light behind Chemistry Hall is flickering rapidly and turning off intermittently, leaving the pedestrian walkway dark after 7 PM.',
    'Safety & Security',
    'High',
    'Pathway between Chemistry Hall and Biology Greenhouse',
    'In Progress',
    null,
    null,
    mariaId,
    adminId,
    'Work order #FAC-889 issued to campus electrical staff.',
    null,
    null,
    '2026-10-02 18:40:00',
    '2026-10-03 09:00:00'
  );
  const req5Id = Number(req5.lastInsertRowid);
  insertHist.run(req5Id, mariaId, null, 'Pending', 'Request submitted by Maria Chen', '2026-10-02 18:40:00');
  insertHist.run(req5Id, adminId, 'Pending', 'In Progress', 'Security notified campus electricians to inspect pole ballast', '2026-10-03 09:00:00');

  // Request 6: Hostel & Housing (Resolved)
  const req6 = insertReq.run(
    'SCH-2026-0006',
    'Air conditioning thermostat malfunction in Room 412',
    'The wall thermostat unit was stuck on heat mode blowing hot air continuously.',
    'Hostel & Housing',
    'High',
    'Maple Hall Dormitory, Room 412',
    'Resolved',
    null,
    null,
    alexId,
    adminId,
    'Thermostat control board sensor replaced and calibrated.',
    'Digital thermostat replaced with updated model and calibrated to 70F ambient. Verified cooling cycle works.',
    '2026-10-02 17:00:00',
    '2026-10-01 10:00:00',
    '2026-10-02 17:00:00'
  );
  const req6Id = Number(req6.lastInsertRowid);
  insertHist.run(req6Id, alexId, null, 'Pending', 'Request submitted by Alex Rivera', '2026-10-01 10:00:00');
  insertHist.run(req6Id, adminId, 'Pending', 'In Progress', 'HVAC technician scheduled', '2026-10-01 14:00:00');
  insertHist.run(req6Id, adminId, 'In Progress', 'Resolved', 'Replaced control sensor board', '2026-10-02 17:00:00');

  // Request 7: Cafeteria (Pending)
  const req7 = insertReq.run(
    'SCH-2026-0007',
    'Card reader at East Dining hall declining meal swipes',
    'Station 3 touch terminal shows magnetic stripe read failure for student ID cards. Cashier had to manually type ID numbers causing long queue.',
    'Cafeteria',
    'Low',
    'East Dining Hall Checkout Lane 3',
    'Pending',
    null,
    null,
    davidId,
    null,
    null,
    null,
    null,
    '2026-10-03 07:45:00',
    '2026-10-03 07:45:00'
  );
  const req7Id = Number(req7.lastInsertRowid);
  insertHist.run(req7Id, davidId, null, 'Pending', 'Request submitted by David Kim', '2026-10-03 07:45:00');
});

console.log('Database seeded successfully with users, realistic tickets, notes, and audit history!');
console.log('Default credentials:');
console.log(' - Admin: admin@campus.edu / AdminPass123!');
console.log(' - Facilities: facilities@campus.edu / AdminPass123!');
console.log(' - Student: student@campus.edu / StudentPass123!');
console.log(' - Student 2: maria@campus.edu / StudentPass123!');
database.close();
