const db = require('./connection');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding');

    // Seed users
    const users = [
      {
        email: 'demo@appforge.fun',
        password_hash: await bcrypt.hash('demo123', 10),
        full_name: 'Demo User',
        subscription_level: 'pro',
      },
      {
        email: 'test@appforge.fun',
        password_hash: await bcrypt.hash('test123', 10),
        full_name: 'Test User',
        subscription_level: 'free',
      },
    ];

    for (const user of users) {
      try {
        const result = await db.query(
          `INSERT INTO users (email, password_hash, full_name, subscription_level) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (email) DO NOTHING 
           RETURNING id`,
          [user.email, user.password_hash, user.full_name, user.subscription_level]
        );

        if (result.rows.length > 0) {
          logger.info('User seeded', { email: user.email, userId: result.rows[0].id });
        }
      } catch (err) {
        logger.warn('User seed failed', { email: user.email, error: err.message });
      }
    }

    // Seed sample templates
    const templates = [
      {
        title: 'Express.js REST API',
        description: 'Production-ready Express.js REST API template',
        content: `const express = require('express');
const app = express();
app.use(express.json());
app.get('/api/hello', (req, res) => res.json({ message: 'Hello' }));
app.listen(3000);`,
        language: 'javascript',
        category: 'backend',
      },
      {
        title: 'React Component',
        description: 'Reusable React functional component',
        content: `import React from 'react';
export const MyComponent = ({ title }) => (
  <div className="component">
    <h1>{title}</h1>
  </div>
);`,
        language: 'javascript',
        category: 'frontend',
      },
      {
        title: 'Python Flask API',
        description: 'Basic Flask API endpoint',
        content: `from flask import Flask
app = Flask(__name__)
@app.route('/api/hello')
def hello():
    return {'message': 'Hello'}`,
        language: 'python',
        category: 'backend',
      },
    ];

    // Get first user ID
    const userResult = await db.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;

      for (const template of templates) {
        try {
          await db.query(
            `INSERT INTO templates 
             (user_id, title, description, content, language, category, is_public) 
             VALUES ($1, $2, $3, $4, $5, $6, true) 
             ON CONFLICT DO NOTHING`,
            [userId, template.title, template.description, template.content, template.language, template.category]
          );

          logger.info('Template seeded', { title: template.title });
        } catch (err) {
          logger.warn('Template seed failed', { title: template.title, error: err.message });
        }
      }
    }

    logger.info('Database seeding completed');
  } catch (err) {
    logger.error('Seeding failed', { error: err.message });
    throw err;
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding completed successfully');
      process.exit(0);
    })
    .catch(err => {
      logger.error('Seeding failed', { error: err.message });
      process.exit(1);
    });
}

module.exports = { seedDatabase };
