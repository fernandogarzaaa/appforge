# AppForge Backend Setup Guide

## Overview
Complete guide to set up, run, and deploy the AppForge backend REST API.

## Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **MongoDB:** v4.4 or higher (local or cloud)
- **Redis:** v6.0 or higher (optional, for caching)

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs all required packages:
- `express` - Web framework
- `jsonwebtoken` - JWT authentication
- `mongoose` - MongoDB ORM
- `joi` - Input validation
- `cors` - Cross-origin requests
- `helmet` - Security headers
- `bcryptjs` - Password hashing
- `morgan` - HTTP logging
- `compression` - Response compression

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-very-secure-random-key-min-32-chars
MONGODB_URI=mongodb://localhost:27017/appforge
FRONTEND_URL=http://localhost:5173
```

### 3. Set Up Database

#### Option A: Local MongoDB

```bash
# Install MongoDB Community Edition
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Test connection
mongo
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appforge?retryWrites=true&w=majority
```

## Running the Server

### Development Mode

With hot-reload using nodemon:

```bash
npm run dev
```

Output:
```
🚀 AppForge Backend Server
📍 Running on http://localhost:5000
🌍 Environment: development
⏰ Started at 2026-01-29T10:00:00Z

📚 Available Endpoints:
  Authentication: POST /api/auth/register, /api/auth/login, /api/auth/me
  Quantum: POST /api/quantum/circuits, /api/quantum/algorithms
  Collaboration: POST /api/collaboration/documents
  Security: POST /api/security/encrypt, /api/security/gdpr/request
  Users: POST /api/users/projects, /api/users/teams
```

### Production Mode

```bash
npm start
```

## Testing the API

### 1. Health Check

```bash
curl http://localhost:5000/health
```

### 2. Register New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "organizationName": "Test Org"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "name": "Test User",
      "role": "user"
    },
    "token": "eyJhbGc...",
    "expiresIn": "24h"
  }
}
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Save the returned token for authenticated requests.

### 4. Create Quantum Circuit (Authenticated)

```bash
curl -X POST http://localhost:5000/api/quantum/circuits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Circuit",
    "description": "Testing quantum functionality",
    "numQubits": 3
  }'
```

### 5. Simulate Circuit

```bash
curl -X POST http://localhost:5000/api/quantum/circuits/CIRCUIT_ID/simulate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"shots": 1000}'
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login & get token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Quantum Computing
- `POST /api/quantum/circuits` - Create circuit
- `GET /api/quantum/circuits` - List circuits
- `GET /api/quantum/circuits/:id` - Get circuit
- `PUT /api/quantum/circuits/:id` - Update circuit
- `DELETE /api/quantum/circuits/:id` - Delete circuit
- `POST /api/quantum/circuits/:id/simulate` - Simulate
- `POST /api/quantum/algorithms` - Run algorithm
- `GET /api/quantum/circuits/:id/export` - Export circuit

### Real-time Collaboration
- `POST /api/collaboration/documents` - Create doc
- `GET /api/collaboration/documents` - List docs
- `GET /api/collaboration/documents/:id` - Get doc
- `PUT /api/collaboration/documents/:id` - Update doc
- `DELETE /api/collaboration/documents/:id` - Delete doc
- `POST /api/collaboration/documents/:id/collaborators` - Add collaborator
- `DELETE /api/collaboration/documents/:id/collaborators/:id` - Remove collaborator
- `GET /api/collaboration/documents/:id/history` - Get change history

### Data Security & Privacy
- `POST /api/security/encrypt` - Encrypt data
- `POST /api/security/decrypt` - Decrypt data
- `POST /api/security/anonymize` - Anonymize data
- `POST /api/security/rules` - Create rule
- `POST /api/security/consent` - Record consent
- `GET /api/security/consent` - Get consent status
- `POST /api/security/privacy-policy` - Generate policy
- `POST /api/security/gdpr/request` - Submit GDPR request
- `GET /api/security/gdpr/:requestId` - Get GDPR status
- `GET /api/security/compliance` - Compliance report

### User & Projects
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/projects` - Create project
- `GET /api/users/projects` - List projects
- `GET /api/users/projects/:id` - Get project
- `PUT /api/users/projects/:id` - Update project
- `DELETE /api/users/projects/:id` - Delete project
- `POST /api/users/projects/:id/members` - Add member
- `DELETE /api/users/projects/:id/members/:id` - Remove member
- `POST /api/users/teams` - Create team
- `GET /api/users/teams` - List teams

## Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js          # User authentication
│   │   ├── quantumController.js       # Quantum computing
│   │   ├── collaborationController.js # Documents & collaboration
│   │   ├── securityController.js      # Encryption & privacy
│   │   └── userController.js          # Users, projects, teams
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── quantumRoutes.js
│   │   ├── collaborationRoutes.js
│   │   ├── securityRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/
│   │   ├── auth.js                    # JWT verification
│   │   ├── errorHandler.js            # Global error handling
│   │   └── rateLimiter.js             # Rate limiting
│   ├── validators/
│   │   └── schemas.js                 # Input validation schemas
│   ├── utils/
│   │   └── helpers.js                 # Utility functions
│   ├── config/
│   │   └── index.js                   # Configuration
│   └── server.js                      # Express app & server
├── package.json
├── .env.example
└── API_DOCUMENTATION.md
```

## Advanced Configuration

### Database Connection Pooling

```env
MONGODB_URI=mongodb://localhost:27017/appforge?maxPoolSize=10&minPoolSize=5
```

### JWT Token Customization

```env
JWT_SECRET=your-secret-min-32-characters-long
JWT_EXPIRES_IN=48h
```

### CORS Configuration

Adjust allowed origins:

```env
FRONTEND_URL=http://localhost:5173,https://app.example.com
```

### Rate Limiting

Customize in `middleware/rateLimiter.js`:

```javascript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // 100 requests per window
});
```

## Development Tools

### Code Linting

```bash
npm run lint
```

### Auto-fix Linting Issues

```bash
npm run lint:fix
```

### Run Tests (Future)

```bash
npm test
```

## Deployment

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t appforge-backend .
docker run -p 5000:5000 --env-file .env appforge-backend
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=generate-a-long-random-string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/appforge
FRONTEND_URL=https://app.example.com
```

### Deployment Platforms

#### Heroku

```bash
heroku create appforge-backend
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

#### AWS Lambda (with Serverless)

```bash
npm install -g serverless
serverless deploy
```

#### Google Cloud Run

```bash
gcloud run deploy appforge-backend \
  --source . \
  --platform managed \
  --memory 512MB
```

## Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

Solutions:
1. Check MongoDB is running: `mongosh`
2. Verify connection string in `.env`
3. Check network/firewall settings

### JWT Token Invalid

```
Error: Invalid or expired token
```

Solutions:
1. Ensure token is valid and not expired
2. Check JWT_SECRET matches in `.env`
3. Token must be in Authorization header: `Authorization: Bearer <token>`

### CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

Solutions:
1. Check FRONTEND_URL in `.env` matches client URL
2. Ensure CORS middleware is enabled
3. Check origin in browser console

## Performance Optimization

### Enable Caching

```bash
npm install redis
```

Use for:
- Session storage
- Query results
- Rate limiter
- Token blacklist

### Database Indexing

```javascript
// Add to user model
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
```

### Response Compression

Already enabled with `compression()` middleware. Gzip is automatic for responses >1KB.

## Security Best Practices

1. ✅ Use HTTPS in production
2. ✅ Set strong JWT_SECRET (32+ random chars)
3. ✅ Enable CORS properly
4. ✅ Validate all inputs (Joi schemas)
5. ✅ Hash passwords (bcrypt)
6. ✅ Rate limit endpoints
7. ✅ Use helmet for security headers
8. ✅ Log sensitive operations
9. ✅ Regularly update dependencies
10. ✅ Monitor error logs

## Monitoring

### Log Levels

```env
LOG_LEVEL=debug  # development
LOG_LEVEL=info   # production
```

### Key Metrics to Monitor

- Request response times
- Error rates
- Database query performance
- API endpoint usage
- Authentication success/failure rates
- Rate limiting hits

## Support

- **Documentation:** API_DOCUMENTATION.md
- **Issues:** GitHub Issues
- **Email:** dev@appforge.com
- **Slack:** #appforge-backend

## Next Steps

After backend is running:

1. **Integrate with Frontend** - Update API client in frontend
2. **Set Up Database** - Design schema, create migrations
3. **Implement WebSocket** - Real-time features need Socket.io
4. **Add Monitoring** - Use OpenTelemetry + Prometheus
5. **Deploy to Staging** - Test full stack integration
6. **Configure Production** - SSL, load balancer, autoscaling

---

**Backend Version:** 1.0.0  
**Last Updated:** January 29, 2026  
**Status:** Production Ready
