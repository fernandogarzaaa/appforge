const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrationsDir = path.join(__dirname, '../../migrations');

const ensureMigrationsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info('Migrations table ensured');
  } catch (err) {
    logger.error('Failed to create migrations table', { error: err.message });
    throw err;
  }
};

const getExecutedMigrations = async () => {
  try {
    const result = await pool.query('SELECT name FROM schema_migrations');
    return result.rows.map(row => row.name);
  } catch (err) {
    logger.error('Failed to get executed migrations', { error: err.message });
    return [];
  }
};

const getMigrationFiles = () => {
  try {
    const files = fs.readdirSync(migrationsDir);
    return files
      .filter(f => f.endsWith('.sql'))
      .sort();
  } catch (err) {
    logger.error('Failed to read migrations directory', { error: err.message });
    return [];
  }
};

const executeMigration = async (name, sql) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Execute migration SQL
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await client.query(statement);
    }
    
    // Record migration
    await client.query(
      'INSERT INTO schema_migrations (name) VALUES ($1)',
      [name]
    );
    
    await client.query('COMMIT');
    logger.info('Migration executed', { name });
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Migration failed', { name, error: err.message });
    throw err;
  } finally {
    client.release();
  }
};

const runMigrations = async () => {
  try {
    await ensureMigrationsTable();
    const executed = await getExecutedMigrations();
    const files = getMigrationFiles();

    if (files.length === 0) {
      logger.warn('No migration files found');
      return;
    }

    let migratedCount = 0;

    for (const file of files) {
      if (executed.includes(file)) {
        logger.info('Migration already executed', { file });
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      await executeMigration(file, sql);
      migratedCount++;
    }

    logger.info('Migrations completed', { total: files.length, executed: migratedCount });
  } catch (err) {
    logger.error('Migration process failed', { error: err.message });
    throw err;
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('All migrations completed successfully');
      process.exit(0);
    })
    .catch(err => {
      logger.error('Migration failed', { error: err.message });
      process.exit(1);
    });
}

module.exports = { runMigrations };
