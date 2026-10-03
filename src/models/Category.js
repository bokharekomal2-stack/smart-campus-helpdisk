const { getDb } = require('../db/connection');

class Category {
  static getAll() {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, name, code, description, created_at
      FROM categories
      ORDER BY name ASC
    `);
    return stmt.all();
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    return stmt.get(id);
  }

  static findByCode(code) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM categories WHERE code = ?');
    return stmt.get(code);
  }
}

module.exports = Category;
