const { PrismaClient } = require('@prisma/client');
require('./env');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[DATABASE] Error: DATABASE_URL is not defined.');
  console.error('[DATABASE] Set DATABASE_URL in the deployment environment or backend/.env.');
  process.exit(1);
}

console.log('[DATABASE] Connecting to PostgreSQL...');

// Pass the URL directly so Prisma always gets the right connection string
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

module.exports = prisma;
