const { getDb } = require('../db/connection');

class Complaint {
  static generateTicketNumber() {
    const db = getDb();
    const row = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'complaints'").get();
    const nextSeq = (row && typeof row.seq === 'number' ? row.seq : 0) + 1;
    const year = new Date().getFullYear();
    return `TKT-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  static create({ title, description, categoryId, studentId, priority = 'MEDIUM', location = null }) {
    const db = getDb();
    const ticketNumber = this.generateTicketNumber();

    const stmt = db.prepare(`
      INSERT INTO complaints (
        ticket_number, title, description, category_id, student_id, priority, status, location
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `);

    const result = stmt.run(
      ticketNumber,
      title.trim(),
      description.trim(),
      Number(categoryId),
      Number(studentId),
      priority.toUpperCase(),
      location ? location.trim() : null
    );

    return this.findById(Number(result.lastInsertRowid));
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        c.*,
        cat.name AS category_name,
        cat.code AS category_code,
        u.name AS student_name,
        u.email AS student_email,
        u.student_id AS student_campus_id,
        u.department AS student_department
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      JOIN users u ON c.student_id = u.id
      WHERE c.id = ?
    `);
    return stmt.get(id);
  }

  static listByStudent(studentId, { status = null, search = null } = {}) {
    const db = getDb();
    let query = `
      SELECT 
        c.*,
        cat.name AS category_name,
        cat.code AS category_code
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      WHERE c.student_id = ?
    `;
    const params = [Number(studentId)];

    if (status && status !== 'ALL') {
      query += ` AND c.status = ?`;
      params.push(status.toUpperCase());
    }

    if (search && search.trim() !== '') {
      query += ` AND (c.title LIKE ? OR c.ticket_number LIKE ? OR c.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY c.created_at DESC`;

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static listAll({ status = null, categoryId = null, priority = null, search = null } = {}) {
    const db = getDb();
    let query = `
      SELECT 
        c.*,
        cat.name AS category_name,
        cat.code AS category_code,
        u.name AS student_name,
        u.email AS student_email,
        u.student_id AS student_campus_id,
        u.department AS student_department
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      JOIN users u ON c.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      query += ` AND c.status = ?`;
      params.push(status.toUpperCase());
    }

    if (categoryId && categoryId !== 'ALL') {
      query += ` AND c.category_id = ?`;
      params.push(Number(categoryId));
    }

    if (priority && priority !== 'ALL') {
      query += ` AND c.priority = ?`;
      params.push(priority.toUpperCase());
    }

    if (search && search.trim() !== '') {
      query += ` AND (c.title LIKE ? OR c.ticket_number LIKE ? OR c.description LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY c.created_at DESC`;

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static updateStatus(id, { status, adminNotes = null }) {
    const db = getDb();
    const resolvedAt = status === 'RESOLVED' ? new Date().toISOString() : null;

    const stmt = db.prepare(`
      UPDATE complaints
      SET 
        status = ?,
        admin_notes = COALESCE(?, admin_notes),
        updated_at = CURRENT_TIMESTAMP,
        resolved_at = CASE WHEN ? = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE id = ?
    `);

    stmt.run(status.toUpperCase(), adminNotes !== undefined ? adminNotes : null, status.toUpperCase(), Number(id));
    return this.findById(Number(id));
  }

  static getStats(studentId = null) {
    const db = getDb();
    const whereClause = studentId ? 'WHERE student_id = ?' : '';
    const params = studentId ? [Number(studentId)] : [];

    const overviewStmt = db.prepare(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
      FROM complaints
      ${whereClause}
    `);

    const raw = overviewStmt.get(...params);
    const overview = {
      total: Number(raw?.total || 0),
      pending: Number(raw?.pending || 0),
      in_progress: Number(raw?.in_progress || 0),
      resolved: Number(raw?.resolved || 0),
      rejected: Number(raw?.rejected || 0)
    };

    let categoryBreakdown = [];
    if (!studentId) {
      const catStmt = db.prepare(`
        SELECT 
          cat.name AS category_name,
          cat.code AS category_code,
          COUNT(c.id) AS count
        FROM categories cat
        LEFT JOIN complaints c ON cat.id = c.category_id
        GROUP BY cat.id
        ORDER BY count DESC
      `);
      categoryBreakdown = catStmt.all();
    }

    return {
      overview,
      categoryBreakdown
    };
  }
}

module.exports = Complaint;
