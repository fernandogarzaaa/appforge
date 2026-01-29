# Frontend-Backend Integration Guide

## Overview
Complete guide to connect your React frontend with the AppForge backend REST API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│              (localhost:5173 - Vite Dev Server)             │
├─────────────────────────────────────────────────────────────┤
│                         HTTP/REST                           │
├─────────────────────────────────────────────────────────────┤
│                   Express.js Backend                        │
│              (localhost:5000 - Node.js Server)              │
├─────────────────────────────────────────────────────────────┤
│                       MongoDB                               │
│              (Connection String in .env)                    │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Start Backend Server

```bash
cd backend
npm install
npm run dev
```

Expected output:
```
🚀 AppForge Backend Server
📍 Running on http://localhost:5000
🌍 Environment: development
```

### 2. Verify Backend is Running

```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2026-01-29T10:00:00Z",
  "uptime": 12.5,
  "environment": "development"
}
```

### 3. Create Frontend API Client

Create `src/api/apiClient.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
```

### 4. Create Authentication Service

Create `src/api/authService.js`:

```javascript
import apiClient from './apiClient';

export const authService = {
  // Register new user
  register: (email, password, name, organizationName) =>
    apiClient.post('/auth/register', {
      email,
      password,
      name,
      organizationName,
    }),

  // Login user
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  // Get current user
  getCurrentUser: () =>
    apiClient.get('/auth/me'),

  // Refresh token
  refreshToken: (token) =>
    apiClient.post('/auth/refresh', { token }),

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    return Promise.resolve();
  },

  // Store token
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  // Get stored token
  getToken: () => localStorage.getItem('authToken'),
};
```

### 5. Create Quantum API Service

Create `src/api/quantumService.js`:

```javascript
import apiClient from './apiClient';

export const quantumService = {
  // Create circuit
  createCircuit: (name, description, numQubits) =>
    apiClient.post('/quantum/circuits', {
      name,
      description,
      numQubits,
    }),

  // Get circuits
  getCircuits: () =>
    apiClient.get('/quantum/circuits'),

  // Get single circuit
  getCircuit: (id) =>
    apiClient.get(`/quantum/circuits/${id}`),

  // Update circuit
  updateCircuit: (id, data) =>
    apiClient.put(`/quantum/circuits/${id}`, data),

  // Delete circuit
  deleteCircuit: (id) =>
    apiClient.delete(`/quantum/circuits/${id}`),

  // Simulate circuit
  simulateCircuit: (id, shots = 1000) =>
    apiClient.post(`/quantum/circuits/${id}/simulate`, { shots }),

  // Run algorithm
  runAlgorithm: (algorithm, parameters = {}) =>
    apiClient.post('/quantum/algorithms', { algorithm, parameters }),

  // Export circuit
  exportCircuit: (id, format = 'qasm') =>
    apiClient.get(`/quantum/circuits/${id}/export`, {
      params: { format },
    }),

  // Get simulation history
  getSimulationHistory: (id) =>
    apiClient.get(`/quantum/circuits/${id}/history`),
};
```

### 6. Create Collaboration API Service

Create `src/api/collaborationService.js`:

```javascript
import apiClient from './apiClient';

export const collaborationService = {
  // Create document
  createDocument: (title, content, projectId, isPublic) =>
    apiClient.post('/collaboration/documents', {
      title,
      content,
      projectId,
      isPublic,
    }),

  // Get documents
  getDocuments: (projectId = null) =>
    apiClient.get('/collaboration/documents', {
      params: projectId ? { projectId } : {},
    }),

  // Get single document
  getDocument: (id) =>
    apiClient.get(`/collaboration/documents/${id}`),

  // Update document
  updateDocument: (id, data) =>
    apiClient.put(`/collaboration/documents/${id}`, data),

  // Delete document
  deleteDocument: (id) =>
    apiClient.delete(`/collaboration/documents/${id}`),

  // Add collaborator
  addCollaborator: (docId, collaboratorId, role = 'editor') =>
    apiClient.post(`/collaboration/documents/${docId}/collaborators`, {
      collaboratorId,
      role,
    }),

  // Remove collaborator
  removeCollaborator: (docId, collaboratorId) =>
    apiClient.delete(`/collaboration/documents/${docId}/collaborators/${collaboratorId}`),

  // Get collaborators
  getCollaborators: (docId) =>
    apiClient.get(`/collaboration/documents/${docId}/collaborators`),

  // Get change history
  getChangeHistory: (docId) =>
    apiClient.get(`/collaboration/documents/${docId}/history`),

  // Publish document
  publishDocument: (docId) =>
    apiClient.post(`/collaboration/documents/${docId}/publish`),

  // Unpublish document
  unpublishDocument: (docId) =>
    apiClient.post(`/collaboration/documents/${docId}/unpublish`),
};
```

### 7. Create Security API Service

Create `src/api/securityService.js`:

```javascript
import apiClient from './apiClient';

export const securityService = {
  // Encrypt data
  encryptData: (data, algorithm = 'AES', dataType = 'general') =>
    apiClient.post('/security/encrypt', {
      data,
      algorithm,
      dataType,
    }),

  // Decrypt data
  decryptData: (encryptedId) =>
    apiClient.post('/security/decrypt', { encryptedId }),

  // Anonymize data
  anonymizeData: (data, method, fieldName) =>
    apiClient.post('/security/anonymize', {
      data,
      method,
      fieldName,
    }),

  // Record consent
  recordConsent: (consentType, value, description) =>
    apiClient.post('/security/consent', {
      consentType,
      value,
      description,
    }),

  // Get consent status
  getConsentStatus: () =>
    apiClient.get('/security/consent'),

  // Generate privacy policy
  generatePrivacyPolicy: (companyName, dataTypes) =>
    apiClient.post('/security/privacy-policy', {
      companyName,
      dataTypes,
    }),

  // Submit GDPR request
  submitGDPRRequest: (requestType, reason) =>
    apiClient.post('/security/gdpr/request', {
      requestType,
      reason,
    }),

  // Get GDPR status
  getGDPRStatus: (requestId) =>
    apiClient.get(`/security/gdpr/${requestId}`),

  // Get compliance report
  getComplianceReport: () =>
    apiClient.get('/security/compliance'),
};
```

### 8. Create User API Service

Create `src/api/userService.js`:

```javascript
import apiClient from './apiClient';

export const userService = {
  // Get user profile
  getUserProfile: () =>
    apiClient.get('/users/profile'),

  // Update user profile
  updateUserProfile: (name, bio, avatar, preferences) =>
    apiClient.put('/users/profile', {
      name,
      bio,
      avatar,
      preferences,
    }),

  // Create project
  createProject: (name, description, isPublic) =>
    apiClient.post('/users/projects', {
      name,
      description,
      isPublic,
    }),

  // Get projects
  getProjects: () =>
    apiClient.get('/users/projects'),

  // Get single project
  getProject: (id) =>
    apiClient.get(`/users/projects/${id}`),

  // Update project
  updateProject: (id, data) =>
    apiClient.put(`/users/projects/${id}`, data),

  // Delete project
  deleteProject: (id) =>
    apiClient.delete(`/users/projects/${id}`),

  // Add project member
  addProjectMember: (projectId, memberId, role) =>
    apiClient.post(`/users/projects/${projectId}/members`, {
      memberId,
      role,
    }),

  // Remove project member
  removeProjectMember: (projectId, memberId) =>
    apiClient.delete(`/users/projects/${projectId}/members/${memberId}`),

  // Get project members
  getProjectMembers: (projectId) =>
    apiClient.get(`/users/projects/${projectId}/members`),

  // Get project stats
  getProjectStats: (projectId) =>
    apiClient.get(`/users/projects/${projectId}/stats`),

  // Create team
  createTeam: (name, description) =>
    apiClient.post('/users/teams', { name, description }),

  // Get teams
  getTeams: () =>
    apiClient.get('/users/teams'),
};
```

### 9. Update .env Files

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend `.env`:**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-key
MONGODB_URI=mongodb://localhost:27017/appforge
```

### 10. Update Frontend API Client (if using axios)

In `src/components/` or pages that use APIs:

```javascript
import { authService } from '../api/authService';
import { quantumService } from '../api/quantumService';
import { collaborationService } from '../api/collaborationService';

// Example: Login
async function handleLogin(email, password) {
  try {
    const response = await authService.login(email, password);
    authService.setToken(response.data.token);
    // Redirect to dashboard
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}

// Example: Create quantum circuit
async function handleCreateCircuit(name, numQubits) {
  try {
    const response = await quantumService.createCircuit(
      name,
      'My quantum circuit',
      numQubits
    );
    console.log('Circuit created:', response.data);
  } catch (error) {
    console.error('Failed to create circuit:', error);
  }
}
```

## Testing Integration

### 1. Test Authentication Flow

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 2. Test Authenticated Endpoint

```bash
curl -X GET http://localhost:5000/api/quantum/circuits \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Run Frontend & Backend Together

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd appforge-main
npm run dev
```

Visit `http://localhost:5173` and test the features!

## Common Issues & Solutions

### CORS Error: "Access to XMLHttpRequest blocked"
**Solution:** Ensure `FRONTEND_URL` in backend `.env` matches frontend URL

### 401 Unauthorized Error
**Solution:** Check if token is being sent and stored correctly in localStorage

### 404 Not Found
**Solution:** Verify endpoint URL and backend is running on correct port

### Database Connection Error
**Solution:** Ensure MongoDB is running and `MONGODB_URI` is correct

## Environment Configuration

### Development Setup
```env
# Frontend
VITE_API_URL=http://localhost:5000/api

# Backend
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=dev-secret-key
MONGODB_URI=mongodb://localhost:27017/appforge
```

### Production Setup
```env
# Frontend
VITE_API_URL=https://api.appforge.com

# Backend
NODE_ENV=production
FRONTEND_URL=https://app.appforge.com
JWT_SECRET=production-secret-key-32-chars-min
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/appforge
```

## API Response Handling

All responses follow this format:

```javascript
{
  "success": true/false,
  "message": "Operation description",
  "data": { /* actual data */ },
  "timestamp": "2026-01-29T10:00:00Z"
}
```

Handle errors:

```javascript
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { status, data } = error.response || {};
    
    if (status === 401) {
      // Unauthorized - refresh token or redirect to login
    } else if (status === 403) {
      // Forbidden - user doesn't have permission
    } else if (status === 400) {
      // Bad request - validation error
      console.error('Validation errors:', data.details);
    } else if (status === 500) {
      // Server error
      console.error('Server error:', data.message);
    }
    
    return Promise.reject(error);
  }
);
```

## Deployment Checklist

- [ ] Backend running on production server
- [ ] Frontend environment variables updated
- [ ] CORS configured for production URLs
- [ ] JWT secret updated to strong random string
- [ ] Database connection verified
- [ ] SSL certificates installed
- [ ] API endpoints tested
- [ ] Error logging configured
- [ ] Monitoring/alerting setup
- [ ] Database backups configured

## Next Steps

1. ✅ Backend API running
2. ✅ Frontend-backend connected
3. ⏳ Implement WebSocket for real-time features
4. ⏳ Set up database persistence
5. ⏳ Deploy to production
6. ⏳ Monitor and optimize

---

**Integration Guide Version:** 1.0.0  
**Last Updated:** January 29, 2026  
**Status:** Ready for Implementation
