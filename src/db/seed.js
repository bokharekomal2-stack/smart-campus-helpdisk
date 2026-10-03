const bcrypt = require('bcryptjs');
const { getDb } = require('./connection');
const { runMigrations } = require('./migrate');

function seedDatabase() {
  runMigrations();
  const db = getDb();

  console.log('[Database] Seeding sample data...');

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, student_id, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminHash = bcrypt.hashSync('admin123', 10);
  const student1Hash = bcrypt.hashSync('student123', 10);
  const student2Hash = bcrypt.hashSync('student123', 10);

  insertUser.run('Campus Admin', 'admin@campus.edu', adminHash, 'ADMIN', null, 'Campus Administration');
  insertUser.run('Alex Johnson', 'student@campus.edu', student1Hash, 'STUDENT', 'STU-2026-101', 'Computer Science');
  insertUser.run('Sarah Connor', 'sarah@campus.edu', student2Hash, 'STUDENT', 'STU-2026-102', 'Electrical Engineering');

  // 2. Seed Categories
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, code, description)
    VALUES (?, ?, ?)
  `);

  const categories = [
    ['Wi-Fi & Campus IT', 'IT', 'Campus internet connectivity, lab workstations, LMS access, student email'],
    ['Hostel & Residential', 'HOSTEL', 'Dormitory room repairs, hot water, plumbing, furniture, pest control'],
    ['Classrooms & Labs', 'ACADEMIC', 'Projector malfunction, whiteboard condition, AC/heating, lab equipment'],
    ['Campus Maintenance', 'MAINTENANCE', 'Walkways, outdoor lighting, general building upkeep, elevator service'],
    ['Cafeteria & Dining', 'CAFETERIA', 'Food quality, hygiene standards, dining hall seating, vending machines'],
    ['Library Services', 'LIBRARY', 'Study area quietness, book issue kiosks, e-resource workstation support']
  ];

  for (const cat of categories) {
    insertCategory.run(cat[0], cat[1], cat[2]);
  }

  // Retrieve IDs for references
  const alex = db.prepare("SELECT id FROM users WHERE email = 'student@campus.edu'").get();
  const sarah = db.prepare("SELECT id FROM users WHERE email = 'sarah@campus.edu'").get();

  const itCat = db.prepare("SELECT id FROM categories WHERE code = 'IT'").get();
  const academicCat = db.prepare("SELECT id FROM categories WHERE code = 'ACADEMIC'").get();
  const hostelCat = db.prepare("SELECT id FROM categories WHERE code = 'HOSTEL'").get();
  const libraryCat = db.prepare("SELECT id FROM categories WHERE code = 'LIBRARY'").get();

  // 3. Seed Complaints
  const insertComplaint = db.prepare(`
    INSERT OR IGNORE INTO complaints (
      ticket_number, title, description, category_id, student_id, priority, status, location, admin_notes, created_at, resolved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?)
  `);

  if (alex && sarah && itCat && academicCat && hostelCat && libraryCat) {
    insertComplaint.run(
      'TKT-2026-0001',
      'Dorm Block B 3rd Floor Wi-Fi dropping frequently',
      'Every evening from 8 PM to 11 PM, the 5GHz campus network constantly disconnects, making it difficult to complete coursework.',
      itCat.id,
      alex.id,
      'HIGH',
      'IN_PROGRESS',
      'Hostel Block B, Room 304 corridor',
      'IT Support dispatched technician. Access point firmware upgrade scheduled for 4 PM today.',
      '-2 days',
      null
    );

    insertComplaint.run(
      'TKT-2026-0002',
      'Broken AC unit in Science Building Hall 102',
      'The AC unit in Lecture Hall 102 makes a loud rattling sound and blows warm air during morning lectures.',
      academicCat.id,
      sarah.id,
      'MEDIUM',
      'RESOLVED',
      'Science Building, Lecture Hall 102',
      'Compressor replaced and tested by campus maintenance team. Operating at normal cooling temperature.',
      '-5 days',
      new Date().toISOString()
    );

    insertComplaint.run(
      'TKT-2026-0003',
      'Water leakage near Hostel Block A entrance',
      'There is steady water leaking from the ceiling onto the entrance stairs, causing a slippery hazard for students.',
      hostelCat.id,
      alex.id,
      'URGENT',
      'PENDING',
      'Hostel Block A, Main Entry Staircase',
      null,
      '-4 hours',
      null
    );

    insertComplaint.run(
      'TKT-2026-0004',
      'Library 2nd Floor study cubicle power outlets not working',
      'Four power outlets across desks 14 to 18 are completely dead, students cannot charge laptops.',
      libraryCat.id,
      sarah.id,
      'LOW',
      'PENDING',
      'Main Library, 2nd Floor Quiet Zone, Desks 14-18',
      null,
      '-1 day',
      null
    );
  }

  console.log('[Database] Seed data created successfully.');
  console.log('Sample Accounts:');
  console.log('  Admin:   admin@campus.edu   / admin123');
  console.log('  Student: student@campus.edu / student123');
  console.log('  Student: sarah@campus.edu   / student123');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
