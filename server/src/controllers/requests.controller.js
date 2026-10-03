import database from '../db/database.js';

const ALLOWED_CATEGORIES = [
  'IT Services',
  'Facilities & Maintenance',
  'Hostel & Housing',
  'Academic Services',
  'Transportation',
  'Library',
  'Cafeteria',
  'Safety & Security',
  'Other',
];

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Resolved'];

/**
 * Generate a unique sequential ticket number like SCH-2026-0008
 */
const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const countRow = database.get('SELECT COUNT(*) as total FROM requests');
  const nextNum = (countRow ? countRow.total : 0) + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `SCH-${year}-${padded}`;
};

/**
 * Create a new complaint / service request (Students only)
 */
export const createRequest = (req, res, next) => {
  try {
    const { title, description, category, priority, location } = req.body;

    // Field validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Title is required (minimum 3 characters).',
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Description is required (minimum 10 characters).',
      });
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category.trim())) {
      return res.status(400).json({
        success: false,
        error: `Please select a valid category. Valid options: ${ALLOWED_CATEGORIES.join(', ')}`,
      });
    }

    const selectedPriority = priority && ALLOWED_PRIORITIES.includes(priority.trim())
      ? priority.trim()
      : 'Medium';

    if (!location || typeof location !== 'string' || location.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Campus location is required (e.g. Building, Room, or Landmark).',
      });
    }

    // Optional file attachment handling
    let attachmentUrl = null;
    let attachmentName = null;
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
    }

    let ticketNumber;
    let newRequestId;

    // Execute creation in database transaction
    database.transaction(() => {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        attempts++;
        const candidate = generateTicketNumber() + (attempts > 1 ? `-${attempts}` : '');
        const check = database.get('SELECT id FROM requests WHERE ticket_number = ?', [candidate]);
        if (!check) {
          ticketNumber = candidate;
          isUnique = true;
        }
      }

      const insertResult = database.run(
        `INSERT INTO requests (
          ticket_number, title, description, category, priority, location,
          status, attachment_url, attachment_name, student_id
        ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
        [
          ticketNumber,
          title.trim(),
          description.trim(),
          category.trim(),
          selectedPriority,
          location.trim(),
          attachmentUrl,
          attachmentName,
          req.user.id,
        ]
      );

      newRequestId = insertResult.lastInsertRowid;

      // Add to audit trail
      database.run(
        `INSERT INTO status_history (request_id, changed_by, from_status, to_status, comment)
         VALUES (?, ?, NULL, 'Pending', 'Request submitted by student')`,
        [newRequestId, req.user.id]
      );
    });

    const createdTicket = database.get(
      `SELECT r.*, u.name as student_name, u.email as student_email, u.student_id as student_roll_no
       FROM requests r
       JOIN users u ON r.student_id = u.id
       WHERE r.id = ?`,
      [newRequestId]
    );

    return res.status(201).json({
      success: true,
      message: 'Request submitted successfully!',
      request: createdTicket,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all requests (Admin: all requests, Student: own requests only)
 */
export const getRequests = (req, res, next) => {
  try {
    const { status, category, priority, search, sort = 'newest' } = req.query;

    const conditions = [];
    const params = [];

    // Role check: students can only see their own requests
    if (req.user.role === 'student') {
      conditions.push('r.student_id = ?');
      params.push(req.user.id);
    }

    if (status && ALLOWED_STATUSES.includes(status)) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (category && ALLOWED_CATEGORIES.includes(category)) {
      conditions.push('r.category = ?');
      params.push(category);
    }

    if (priority && ALLOWED_PRIORITIES.includes(priority)) {
      conditions.push('r.priority = ?');
      params.push(priority);
    }

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      conditions.push(
        '(r.ticket_number LIKE ? OR r.title LIKE ? OR r.description LIKE ? OR r.location LIKE ? OR u.name LIKE ?)'
      );
      params.push(term, term, term, term, term);
    }

    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY r.created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'ORDER BY r.created_at ASC';
    } else if (sort === 'priority') {
      orderBy = `ORDER BY 
        CASE r.priority
          WHEN 'Urgent' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
          ELSE 5
        END ASC, r.created_at DESC`;
    }

    const sql = `
      SELECT 
        r.*,
        u.name as student_name,
        u.email as student_email,
        u.student_id as student_roll_no,
        u.department as student_department,
        a.name as assigned_admin_name
      FROM requests r
      JOIN users u ON r.student_id = u.id
      LEFT JOIN users a ON r.assigned_to = a.id
      ${whereClause}
      ${orderBy}
    `;

    const requests = database.all(sql, params);

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single request details by ID or ticket number
 */
export const getRequestById = (req, res, next) => {
  try {
    const { id } = req.params;

    const request = database.get(
      `SELECT 
        r.*,
        u.name as student_name,
        u.email as student_email,
        u.student_id as student_roll_no,
        u.department as student_department,
        u.phone as student_phone,
        a.name as assigned_admin_name
      FROM requests r
      JOIN users u ON r.student_id = u.id
      LEFT JOIN users a ON r.assigned_to = a.id
      WHERE r.id = ? OR r.ticket_number = ?`,
      [id, id]
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Service request not found.',
      });
    }

    // Role authorization check
    if (req.user.role === 'student' && request.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own submitted requests.',
      });
    }

    // Fetch notes/comments
    const notesSql = req.user.role === 'admin'
      ? `SELECT n.*, u.name as author_name, u.role as author_role 
         FROM request_notes n 
         JOIN users u ON n.user_id = u.id 
         WHERE n.request_id = ? 
         ORDER BY n.created_at ASC`
      : `SELECT n.*, u.name as author_name, u.role as author_role 
         FROM request_notes n 
         JOIN users u ON n.user_id = u.id 
         WHERE n.request_id = ? AND n.is_internal = 0 
         ORDER BY n.created_at ASC`;

    const notes = database.all(notesSql, [request.id]);

    // Fetch status history audit log
    const history = database.all(
      `SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
       FROM status_history h
       JOIN users u ON h.changed_by = u.id
       WHERE h.request_id = ?
       ORDER BY h.created_at ASC`,
      [request.id]
    );

    return res.status(200).json({
      success: true,
      request,
      notes,
      history,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Update request status and/or priority
 */
export const updateRequestStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, admin_notes, resolution_notes, assigned_to } = req.body;

    const request = database.get('SELECT * FROM requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found.',
      });
    }

    const updates = [];
    const params = [];
    let statusChanged = false;
    let oldStatus = request.status;
    let newStatus = oldStatus;

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Options: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }
      if (status !== request.status) {
        statusChanged = true;
        newStatus = status;
        updates.push('status = ?');
        params.push(status);

        if (status === 'Resolved') {
          updates.push("resolved_at = datetime('now')");
        } else {
          updates.push('resolved_at = NULL');
        }
      }
    }

    if (priority) {
      if (!ALLOWED_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          error: `Invalid priority. Options: ${ALLOWED_PRIORITIES.join(', ')}`,
        });
      }
      updates.push('priority = ?');
      params.push(priority);
    }

    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(admin_notes ? admin_notes.trim() : null);
    }

    if (resolution_notes !== undefined) {
      updates.push('resolution_notes = ?');
      params.push(resolution_notes ? resolution_notes.trim() : null);
    }

    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid update parameters provided.',
      });
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    database.transaction(() => {
      database.run(`UPDATE requests SET ${updates.join(', ')} WHERE id = ?`, params);

      if (statusChanged) {
        const comment = resolution_notes || admin_notes || `Status updated from ${oldStatus} to ${newStatus}`;
        database.run(
          `INSERT INTO status_history (request_id, changed_by, from_status, to_status, comment)
           VALUES (?, ?, ?, ?, ?)`,
          [id, req.user.id, oldStatus, newStatus, comment]
        );
      }
    });

    const updated = database.get(
      `SELECT r.*, u.name as student_name, u.email as student_email, a.name as assigned_admin_name
       FROM requests r
       JOIN users u ON r.student_id = u.id
       LEFT JOIN users a ON r.assigned_to = a.id
       WHERE r.id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Request updated successfully.',
      request: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Add a comment/note to a request
 */
export const addNote = (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, is_internal = false } = req.body;

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note content cannot be empty.',
      });
    }

    const request = database.get('SELECT * FROM requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found.',
      });
    }

    // Role check: students can only comment on their own requests, cannot create internal notes
    if (req.user.role === 'student' && request.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
    }

    const internalFlag = req.user.role === 'admin' && Boolean(is_internal) ? 1 : 0;

    const result = database.run(
      `INSERT INTO request_notes (request_id, user_id, note, is_internal)
       VALUES (?, ?, ?, ?)`,
      [id, req.user.id, note.trim(), internalFlag]
    );

    database.run("UPDATE requests SET updated_at = datetime('now') WHERE id = ?", [id]);

    const createdNote = database.get(
      `SELECT n.*, u.name as author_name, u.role as author_role
       FROM request_notes n
       JOIN users u ON n.user_id = u.id
       WHERE n.id = ?`,
      [result.lastInsertRowid]
    );

    return res.status(201).json({
      success: true,
      message: 'Note added successfully.',
      note: createdNote,
    });
  } catch (err) {
    next(err);
  }
};
