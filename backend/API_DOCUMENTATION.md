# AppForge Backend REST API Documentation

## Overview
Complete REST API for AppForge with support for quantum computing, real-time collaboration, data security, and user management.

**Base URL:** `http://localhost:5000/api`  
**API Version:** 1.0.0  
**Authentication:** JWT Bearer Token

---

## Table of Contents
1. [Authentication](#authentication)
2. [Quantum Computing](#quantum-computing)
3. [Real-time Collaboration](#real-time-collaboration)
4. [Data Security & Privacy](#data-security--privacy)
5. [User & Project Management](#user--project-management)
6. [Error Handling](#error-handling)

---

## Authentication

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "organizationName": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2026-01-29T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

---

### Login User
Authenticate and get JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

---

### Get Current User
Retrieve authenticated user profile.

**Endpoint:** `GET /auth/me`  
**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

---

### Refresh Token
Get a new JWT token using existing token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "token": "existing-jwt-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new-jwt-token",
    "expiresIn": "24h"
  }
}
```

---

## Quantum Computing

### Create Quantum Circuit
Initialize a new quantum circuit.

**Endpoint:** `POST /quantum/circuits`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "Bell State Circuit",
  "description": "Creates an entangled Bell pair",
  "numQubits": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Circuit created successfully",
  "data": {
    "id": "circuit-uuid",
    "name": "Bell State Circuit",
    "numQubits": 2,
    "gates": [],
    "createdAt": "2026-01-29T10:00:00Z"
  }
}
```

---

### List User's Circuits
Get all quantum circuits created by user.

**Endpoint:** `GET /quantum/circuits`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Circuits retrieved successfully",
  "data": [
    {
      "id": "circuit-uuid",
      "name": "Bell State Circuit",
      "numQubits": 2,
      "gates": [],
      "createdAt": "2026-01-29T10:00:00Z"
    }
  ]
}
```

---

### Simulate Circuit
Run quantum simulation on a circuit.

**Endpoint:** `POST /quantum/circuits/{id}/simulate`  
**Authentication:** Required

**Request Body:**
```json
{
  "shots": 1000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Circuit simulated successfully",
  "data": {
    "id": "simulation-uuid",
    "circuitId": "circuit-uuid",
    "shots": 1000,
    "measurements": ["00", "00", "11", "11", ...],
    "counts": {
      "00": 500,
      "11": 500
    },
    "probabilities": {
      "00": 0.5,
      "11": 0.5
    },
    "metadata": {
      "avgMeasurementTime": 0.15,
      "totalSimulationTime": 45
    }
  }
}
```

---

### Run Quantum Algorithm
Execute a quantum algorithm.

**Endpoint:** `POST /quantum/algorithms`  
**Authentication:** Required

**Request Body:**
```json
{
  "algorithm": "shors",
  "parameters": {
    "number_to_factor": 15
  }
}
```

**Supported Algorithms:**
- `shors` - Integer factorization
- `grovers` - Database search
- `deutsch-jozsa` - Promise problem
- `bell` - Entangled states
- `qft` - Quantum Fourier Transform

**Response:**
```json
{
  "success": true,
  "message": "shors algorithm executed successfully",
  "data": {
    "id": "algorithm-uuid",
    "algorithm": "shors",
    "result": {
      "factors": [3, 5],
      "iterations": 15
    },
    "timestamp": "2026-01-29T10:00:00Z"
  }
}
```

---

### Export Circuit
Export circuit to OpenQASM or JSON format.

**Endpoint:** `GET /quantum/circuits/{id}/export?format=qasm`  
**Authentication:** Required  
**Query Parameters:** `format` (qasm|json)

**Response:**
```json
{
  "success": true,
  "message": "Circuit exported as QASM",
  "data": {
    "format": "qasm",
    "data": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\n..."
  }
}
```

---

## Real-time Collaboration

### Create Document
Create a new collaborative document.

**Endpoint:** `POST /collaboration/documents`  
**Authentication:** Required

**Request Body:**
```json
{
  "title": "Project Proposal",
  "content": "Initial draft...",
  "projectId": "project-uuid",
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "id": "doc-uuid",
    "title": "Project Proposal",
    "content": "Initial draft...",
    "version": 1,
    "createdAt": "2026-01-29T10:00:00Z",
    "collaborators": [
      {
        "userId": "user-uuid",
        "role": "owner",
        "joinedAt": "2026-01-29T10:00:00Z"
      }
    ]
  }
}
```

---

### Update Document
Modify document content.

**Endpoint:** `PUT /collaboration/documents/{id}`  
**Authentication:** Required

**Request Body:**
```json
{
  "content": "Updated content..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "id": "doc-uuid",
    "title": "Project Proposal",
    "version": 2,
    "updatedAt": "2026-01-29T10:05:00Z"
  }
}
```

---

### Add Collaborator
Invite user to collaborate on document.

**Endpoint:** `POST /collaboration/documents/{id}/collaborators`  
**Authentication:** Required

**Request Body:**
```json
{
  "collaboratorId": "user2-uuid",
  "role": "editor"
}
```

**Available Roles:** `viewer`, `editor`, `owner`

**Response:**
```json
{
  "success": true,
  "message": "Collaborator added successfully",
  "data": { ... }
}
```

---

### Get Change History
Retrieve document edit history.

**Endpoint:** `GET /collaboration/documents/{id}/history`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Change history retrieved successfully",
  "data": [
    {
      "id": "change-uuid",
      "userId": "user-uuid",
      "timestamp": "2026-01-29T10:00:00Z",
      "changes": {
        "content": {
          "old": "Initial...",
          "new": "Updated..."
        }
      }
    }
  ]
}
```

---

### Publish Document
Make document publicly accessible.

**Endpoint:** `POST /collaboration/documents/{id}/publish`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Document published successfully",
  "data": {
    "id": "doc-uuid",
    "isPublic": true,
    "publishedAt": "2026-01-29T10:00:00Z"
  }
}
```

---

## Data Security & Privacy

### Encrypt Data
Encrypt sensitive information.

**Endpoint:** `POST /security/encrypt`  
**Authentication:** Required

**Request Body:**
```json
{
  "data": "sensitive-information",
  "algorithm": "AES",
  "dataType": "personal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data encrypted successfully",
  "data": {
    "id": "encrypted-id",
    "algorithm": "AES",
    "encrypted": "base64-encoded-encrypted-data",
    "keyId": "key-uuid",
    "timestamp": "2026-01-29T10:00:00Z"
  }
}
```

---

### Decrypt Data
Decrypt previously encrypted data.

**Endpoint:** `POST /security/decrypt`  
**Authentication:** Required

**Request Body:**
```json
{
  "encryptedId": "encrypted-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data decrypted successfully",
  "data": {
    "id": "encrypted-id",
    "data": "sensitive-information",
    "decryptedAt": "2026-01-29T10:00:00Z"
  }
}
```

---

### Anonymize Data
Apply anonymization techniques.

**Endpoint:** `POST /security/anonymize`  
**Authentication:** Required

**Request Body:**
```json
{
  "data": "john.doe@example.com",
  "method": "mask",
  "fieldName": "email"
}
```

**Anonymization Methods:**
- `mask` - Partial masking (show first/last chars)
- `generalize` - Replace with type
- `suppress` - Remove completely
- `hash` - One-way hash
- `pseudonymize` - Replace with pseudonym
- `aggregate` - Combine multiple records

**Response:**
```json
{
  "success": true,
  "message": "Data anonymized successfully",
  "data": {
    "anonymized": "jo****@example.com",
    "method": "mask",
    "fieldName": "email"
  }
}
```

---

### Record User Consent
Track GDPR user consent.

**Endpoint:** `POST /security/consent`  
**Authentication:** Required

**Request Body:**
```json
{
  "consentType": "marketing",
  "value": true,
  "description": "User opted in to marketing emails"
}
```

**Consent Types:** `marketing`, `analytics`, `thirdparty`, `profiling`

**Response:**
```json
{
  "success": true,
  "message": "Consent recorded successfully",
  "data": {
    "id": "consent-uuid",
    "consentType": "marketing",
    "value": true,
    "recordedAt": "2026-01-29T10:00:00Z",
    "expiresAt": "2027-01-29T10:00:00Z"
  }
}
```

---

### Submit GDPR Request
Request data export, deletion, or portability.

**Endpoint:** `POST /security/gdpr/request`  
**Authentication:** Required

**Request Body:**
```json
{
  "requestType": "data-export",
  "reason": "User requested data export"
}
```

**Request Types:** `data-export`, `deletion`, `portability`, `rectification`

**Response:**
```json
{
  "success": true,
  "message": "GDPR request submitted successfully",
  "data": {
    "id": "request-uuid",
    "requestType": "data-export",
    "status": "pending",
    "submittedAt": "2026-01-29T10:00:00Z",
    "processingDeadline": "2026-02-28T10:00:00Z"
  }
}
```

---

### Generate Compliance Report
Get security and privacy compliance audit.

**Endpoint:** `GET /security/compliance`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Compliance report generated successfully",
  "data": {
    "id": "report-uuid",
    "generatedAt": "2026-01-29T10:00:00Z",
    "compliance": {
      "gdpr": "COMPLIANT",
      "ccpa": "COMPLIANT",
      "hipaa": "NOT_APPLICABLE",
      "sox": "COMPLIANT"
    },
    "findings": [
      "All personal data encrypted with AES-256",
      "Data retention policies in place"
    ],
    "recommendations": [
      "Consider implementing additional MFA options"
    ],
    "nextReview": "2026-04-29T10:00:00Z"
  }
}
```

---

## User & Project Management

### Create Project
Start a new project.

**Endpoint:** `POST /users/projects`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "AI Research Project",
  "description": "Quantum AI research initiative",
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "project-uuid",
    "name": "AI Research Project",
    "owner": "user-uuid",
    "members": [
      {
        "userId": "user-uuid",
        "role": "owner",
        "joinedAt": "2026-01-29T10:00:00Z"
      }
    ],
    "createdAt": "2026-01-29T10:00:00Z"
  }
}
```

---

### List Projects
Get all user projects.

**Endpoint:** `GET /users/projects`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": [
    {
      "id": "project-uuid",
      "name": "AI Research Project",
      "owner": "user-uuid",
      "createdAt": "2026-01-29T10:00:00Z"
    }
  ]
}
```

---

### Add Project Member
Invite user to project.

**Endpoint:** `POST /users/projects/{id}/members`  
**Authentication:** Required

**Request Body:**
```json
{
  "memberId": "user2-uuid",
  "role": "editor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member added successfully",
  "data": { ... }
}
```

---

### Create Team
Organize users into teams.

**Endpoint:** `POST /users/teams`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "Research Team",
  "description": "Quantum computing research group"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "id": "team-uuid",
    "name": "Research Team",
    "owner": "user-uuid",
    "createdAt": "2026-01-29T10:00:00Z"
  }
}
```

---

## Error Handling

All errors follow a consistent format:

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable error message",
  "timestamp": "2026-01-29T10:00:00Z"
}
```

**Common HTTP Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

**Example Error:**
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "type": "string.email"
    }
  ],
  "timestamp": "2026-01-29T10:00:00Z"
}
```

---

## Quick Start

1. **Register:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "SecurePassword123!",
       "name": "John Doe"
     }'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "SecurePassword123!"
     }'
   ```

3. **Create Quantum Circuit (using returned token):**
   ```bash
   curl -X POST http://localhost:5000/api/quantum/circuits \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "name": "Bell State",
       "numQubits": 2
     }'
   ```

4. **Simulate Circuit:**
   ```bash
   curl -X POST http://localhost:5000/api/quantum/circuits/CIRCUIT_ID/simulate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"shots": 1000}'
   ```

---

## Support & Additional Resources

- **Issue Tracker:** GitHub Issues
- **Documentation:** See BACKEND_SETUP.md
- **Examples:** Check `/examples` directory
- **Contact:** dev@appforge.com

---

**Last Updated:** January 29, 2026  
**API Version:** 1.0.0  
**Status:** Production Ready
