const path = require('node:path');
require('dotenv').config();

const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'campus_helpdesk_jwt_secret_dev_key_2026',
  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || './data/campus_helpdesk.db'),
  isProduction: process.env.NODE_ENV === 'production'
};

module.exports = env;
