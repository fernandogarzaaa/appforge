import fs from 'fs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const secret = process.env.JWT_SECRET || 'dev-secret-key';

const userToken = jwt.sign(
    { id: '507f1f77bcf86cd799439011', email: 'test@example.com', role: 'user' },
    secret,
    { expiresIn: '24h' }
);

const adminToken = jwt.sign(
    { id: '507f1f77bcf86cd799439012', email: 'admin@example.com', role: 'admin' },
    secret,
    { expiresIn: '24h' }
);

fs.writeFileSync('tokens_json.json', JSON.stringify({
    TEST_USER_TOKEN: userToken,
    ADMIN_TOKEN: adminToken,
    JWT_SECRET: secret
}, null, 2));

console.log('Tokens generated to tokens_json.json');
