const bcrypt = require('bcryptjs');
const { getDb } = require('../db/connection');

class User {
  static create({ name, email, password, role = 'STUDENT', studentId = null, department = null }) {
    const db = getDb();
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, student_id, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      role.toUpperCase(),
      studentId ? studentId.trim() : null,
      department ? department.trim() : null
    );

    return this.findById(Number(result.lastInsertRowid));
  }

  static findByEmail(email) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email.toLowerCase().trim());
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, name, email, role, student_id, department, created_at
      FROM users
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  static verifyPassword(plainPassword, passwordHash) {
    return bcrypt.compareSync(plainPassword, passwordHash);
  }
}

module.exports = User;
