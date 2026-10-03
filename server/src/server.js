import app from './app.js';
import { config } from './config/env.js';
import database from './db/database.js';

const server = app.listen(config.port, () => {
  console.log('========================================================');
  console.log(` Campus Helpdesk Server running in [${config.nodeEnv}] mode`);
  console.log(` Local URL: http://localhost:${config.port}`);
  console.log(` Database:  ${config.databasePath}`);
  console.log(` Gemini AI: ${Boolean(config.geminiApiKey) ? 'Active' : 'Unconfigured (Add GEMINI_API_KEY in .env)'}`);
  console.log('========================================================');
});

// Graceful shutdown
const handleExit = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    try {
      database.close();
      console.log('Database connection closed.');
    } catch (e) {
      // ignore
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));
