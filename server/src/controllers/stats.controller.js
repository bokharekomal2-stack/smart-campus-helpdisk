import database from '../db/database.js';

/**
 * Get dashboard statistics
 * If user is student, returns stats for their requests.
 * If user is admin, returns campus-wide stats.
 */
export const getStats = (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';
    const filterSql = isStudent ? 'WHERE student_id = ?' : '';
    const filterParams = isStudent ? [req.user.id] : [];

    // Total requests
    const totalRow = database.get(
      `SELECT COUNT(*) as total FROM requests ${filterSql}`,
      filterParams
    );
    const total = totalRow ? totalRow.total : 0;

    // Status counts
    const statusRows = database.all(
      `SELECT status, COUNT(*) as count 
       FROM requests 
       ${filterSql} 
       GROUP BY status`,
      filterParams
    );

    const statusCounts = {
      Pending: 0,
      'In Progress': 0,
      Resolved: 0,
    };
    statusRows.forEach((r) => {
      statusCounts[r.status] = r.count;
    });

    // Priority counts
    const priorityRows = database.all(
      `SELECT priority, COUNT(*) as count 
       FROM requests 
       ${filterSql} 
       GROUP BY priority`,
      filterParams
    );

    const priorityCounts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Urgent: 0,
    };
    priorityRows.forEach((r) => {
      priorityCounts[r.priority] = r.count;
    });

    // Category breakdown
    const categoryRows = database.all(
      `SELECT category, COUNT(*) as count 
       FROM requests 
       ${filterSql} 
       GROUP BY category 
       ORDER BY count DESC`,
      filterParams
    );

    // Urgent pending tickets requiring immediate attention
    const urgentPendingRow = database.get(
      `SELECT COUNT(*) as count 
       FROM requests 
       ${isStudent ? 'WHERE student_id = ? AND' : 'WHERE'} 
       priority = 'Urgent' AND status = 'Pending'`,
      filterParams
    );

    // Resolution rate percentage
    const resolutionRate = total > 0 ? Math.round((statusCounts.Resolved / total) * 100) : 0;

    // Total active registered students (admin only)
    let totalStudents = null;
    if (!isStudent) {
      const studentCountRow = database.get("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
      totalStudents = studentCountRow ? studentCountRow.count : 0;
    }

    return res.status(200).json({
      success: true,
      stats: {
        total,
        statusCounts,
        priorityCounts,
        categories: categoryRows,
        urgentPending: urgentPendingRow ? urgentPendingRow.count : 0,
        resolutionRate,
        totalStudents,
      },
    });
  } catch (err) {
    next(err);
  }
};
