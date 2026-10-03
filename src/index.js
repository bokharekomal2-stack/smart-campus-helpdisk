const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { runMigrations } = require('./db/migrate');
const { authenticate } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Ensure DB schema exists on startup
runMigrations();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticate);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/stats', statsRoutes);

// SPA client fallback for non-API GET routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }
  next();
});

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`===============================================`);
    console.log(` Smart Campus Helpdesk running at:`);
    console.log(` http://localhost:${env.port}`);
    console.log(` Mode: ${env.nodeEnv}`);
    console.log(` Database: ${env.dbPath}`);
    console.log(`===============================================`);
  });
}

module.exports = app;
