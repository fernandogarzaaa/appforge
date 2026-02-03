# API Documentation with Swagger/OpenAPI

## Overview

AppForge provides comprehensive API documentation using Swagger UI and OpenAPI 3.0 specification.

## Accessing API Documentation

### Local Development

```bash
cd backend
npm run dev

# Visit in browser
# http://localhost:5000/api-docs
```

### Production

```
https://api.appforge.dev/api-docs
```

### OpenAPI Specification

Get the raw OpenAPI spec in JSON format:

```
http://localhost:5000/api-docs.json
```

Use with tools:
```bash
# Download spec
curl http://localhost:5000/api-docs.json > appforge-api.json

# Generate client SDK
openapi-generator-cli generate -i appforge-api.json -g javascript -o appforge-js-sdk
```

## Swagger UI Features

### Interactive API Testing

1. **Expand Endpoint**
   - Click on any endpoint to view details
   - See request parameters, response schemas
   - View example requests/responses

2. **Test Endpoint**
   - Click "Try it out"
   - Enter parameters
   - Click "Execute"
   - View response and curl command

3. **Authentication**
   - Click lock icon on endpoint
   - Select "Bearer Token" security scheme
   - Paste JWT token from `/auth/login`

### Filter and Search

- **Filter by Tag**: Click tags (Authentication, Projects, etc.)
- **Search**: Use search box to find endpoints
- **Sort**: Re-order by method or path

## Adding API Documentation

### Documenting Routes

Use JSDoc comments with `@swagger` tags:

```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user's profile information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, getUserById);
```

### Complete Example

```javascript
/**
 * Create a new project
 * 
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Creates a new project for the authenticated user
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: My App
 *               description:
 *                 type: string
 *                 example: A sample application
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["production", "saas"]
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, createProject);
```

## Common Patterns

### Parameter Types

```javascript
/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     parameters:
 *       # Path parameter
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       
 *       # Query parameter
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       
 *       # Header parameter
 *       - in: header
 *         name: X-Token
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
```

### Request Bodies

```javascript
/**
 * @swagger
 * /api/users:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
```

### Response Schemas

```javascript
/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

### Security Schemes

```javascript
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: List of integrations
 */
```

## Reusable Components

### Schemas

Define reusable response schemas:

```javascript
// In swagger.js configuration
components: {
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
        role: { enum: ['user', 'admin'] }
      }
    },
    Project: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        owner: { $ref: '#/components/schemas/User' }
      }
    }
  }
}

// Use in routes
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     responses:
 *       200:
 *         description: User
 *         schema:
 *           $ref: '#/components/schemas/User'
 */
```

### Response Templates

```javascript
// In swagger.js
components: {
  responses: {
    UnauthorizedError: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    },
    NotFoundError: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    }
  }
}

// Use in routes
/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     responses:
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

## Client SDK Generation

### Using OpenAPI Generator

```bash
# Install generator
npm install -g @openapitools/openapi-generator-cli

# Download OpenAPI spec
curl http://localhost:5000/api-docs.json > appforge-api.json

# Generate JavaScript client
openapi-generator-cli generate \
  -i appforge-api.json \
  -g javascript \
  -o ./sdk/javascript

# Generate Python client
openapi-generator-cli generate \
  -i appforge-api.json \
  -g python \
  -o ./sdk/python
```

### Using Swagger Codegen

```bash
# Generate multiple SDK languages
npm install swagger-codegen-cli

swagger-codegen generate \
  -i appforge-api.json \
  -l javascript \
  -o sdk/js

swagger-codegen generate \
  -i appforge-api.json \
  -l python \
  -o sdk/python
```

## Viewing in Different Tools

### Postman

```bash
# Import OpenAPI spec into Postman
1. Open Postman
2. File → Import
3. Enter URL: http://localhost:5000/api-docs.json
4. Postman creates collection automatically
```

### VS Code

```bash
# Install Swagger Viewer extension
code --install-extension 42Crunch.vscode-openapi

# Open any .yaml or .json OpenAPI file
# Right-click → Preview Swagger
```

### Command Line

```bash
# Using ReDoc to view spec locally
npm install -g redoc-cli
redoc-cli serve appforge-api.json

# View in browser at http://localhost:8080
```

## Best Practices

### 1. Consistent Naming

```javascript
// ✅ Good - Clear, descriptive names
getUserById()
createProject()
updateProjectSettings()
deleteProjectMember()

// ❌ Bad - Vague names
getUser()
post()
update()
remove()
```

### 2. Descriptive Summaries

```javascript
// ✅ Good
summary: "Get user profile by ID"
summary: "Create a new API key for the authenticated user"

// ❌ Bad
summary: "Get user"
summary: "Create"
```

### 3. Complete Response Examples

```javascript
// ✅ Good - Shows actual response structure
responses: {
  200: {
    description: "User found",
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/User' },
        example: {
          id: "usr_123",
          email: "user@example.com",
          name: "John Doe"
        }
      }
    }
  }
}

// ❌ Bad - No example
responses: {
  200: {
    description: "User found"
  }
}
```

### 4. Error Documentation

```javascript
// ✅ Good - All error cases documented
responses: {
  200: { description: "Success" },
  400: { $ref: '#/components/responses/ValidationError' },
  401: { $ref: '#/components/responses/UnauthorizedError' },
  403: { $ref: '#/components/responses/ForbiddenError' },
  404: { $ref: '#/components/responses/NotFoundError' }
}

// ❌ Bad - Only success documented
responses: {
  200: { description: "Success" }
}
```

## CI/CD Integration

Documentation is validated on every push:

```yaml
# .github/workflows/security-audit.yml
api-documentation:
  runs-on: ubuntu-latest
  steps:
    - name: Validate OpenAPI spec
      run: npx swagger-cli validate src/config/swagger.js
    
    - name: Generate documentation
      run: npx swagger-cli bundle -o api-docs.json src/config/swagger.js
```

## Support

- **Swagger Tools**: https://swagger.io/tools/
- **OpenAPI Docs**: https://spec.openapis.org/
- **JSDoc Swagger**: https://github.com/Surnet/swagger-jsdoc
- **GitHub Issues**: https://github.com/fernandogarzaaa/appforge/issues

---

**Last Updated**: February 3, 2026
