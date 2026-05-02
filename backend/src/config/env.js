const path = require('path');
const dotenv = require('dotenv');

const backendEnvPath = path.resolve(__dirname, '../../.env');
const workspaceEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: backendEnvPath });
dotenv.config({ path: workspaceEnvPath });

function isPlaceholder(value) {
  if (!value) {
    return true;
  }

  return [
    'your_default_secret',
    'your_secure_random_string_here',
    'replace-with-a-strong-secret',
  ].includes(String(value).trim());
}

function validateRequiredEnv() {
  const missing = [];

  if (!process.env.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }

  if (!process.env.JWT_SECRET || isPlaceholder(process.env.JWT_SECRET)) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}

module.exports = {
  validateRequiredEnv,
};
