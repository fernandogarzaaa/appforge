import jwt from 'jsonwebtoken';

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

console.log(`TEST_USER_TOKEN=${userToken}`);
console.log(`ADMIN_TOKEN=${adminToken}`);
console.log(`JWT_SECRET=${secret}`);
