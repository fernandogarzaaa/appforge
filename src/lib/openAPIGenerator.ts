/**
 * OpenAPI/Swagger Documentation Generator
 * Auto-generate API specs from functions and endpoints
 */

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description?: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: Record<string, APIResponse>;
  tags?: string[];
  security?: SecurityRequirement[];
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required: boolean;
  schema: SchemaObject;
}

export interface APIRequestBody {
  description?: string;
  required: boolean;
  content: Record<string, MediaType>;
}

export interface APIResponse {
  description: string;
  content?: Record<string, MediaType>;
}

export interface MediaType {
  schema: SchemaObject;
  example?: any;
}

export interface SchemaObject {
  type: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  example?: any;
}

export interface SecurityRequirement {
  [name: string]: string[];
}

export class OpenAPIGenerator {
  private endpoints: APIEndpoint[] = [];
  private schemas: Map<string, SchemaObject> = new Map();
  private securitySchemes: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultSecuritySchemes();
  }

  /**
   * Initialize default security schemes
   */
  private initializeDefaultSecuritySchemes() {
    this.securitySchemes.set('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    });
    
    this.securitySchemes.set('apiKey', {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key'
    });
  }

  /**
   * Analyze function/endpoint and extract API information
   */
  analyzeEndpoint(code: string, filePath: string): APIEndpoint | null {
    // Extract method and path from code/file path
    const method = this.extractMethod(code);
    const path = this.extractPath(filePath, code);
    
    if (!method || !path) return null;
    
    // Extract parameters
    const parameters = this.extractParameters(code);
    
    // Extract request body
    const requestBody = this.extractRequestBody(code);
    
    // Extract responses
    const responses = this.extractResponses(code);
    
    // Extract metadata
    const summary = this.extractSummary(code, filePath);
    const description = this.extractDescription(code);
    const tags = this.extractTags(filePath);
    
    return {
      path,
      method,
      summary,
      description,
      parameters,
      requestBody,
      responses,
      tags,
      security: method !== 'GET' ? [{ bearerAuth: [] }] : undefined
    };
  }

  /**
   * Extract HTTP method from code
   */
  private extractMethod(code: string): 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | null {
    const methodMatch = code.match(/req\.method\s*===?\s*['"](\w+)['"]/);
    if (methodMatch) {
      return methodMatch[1].toUpperCase() as any;
    }
    
    // Check for common patterns
    if (code.includes('req.json()') || code.includes('POST')) return 'POST';
    if (code.includes('PUT')) return 'PUT';
    if (code.includes('DELETE')) return 'DELETE';
    if (code.includes('PATCH')) return 'PATCH';
    
    return 'GET';
  }

  /**
   * Extract API path from file path and code
   */
  private extractPath(filePath: string, code: string): string {
    // Extract from file path: functions/getUser.ts -> /get-user
    const fileName = filePath.split('/').pop()?.replace(/\.ts$/, '') || '';
    
    // Convert camelCase to kebab-case
    let path = fileName.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    // Remove leading dash
    path = path.replace(/^-/, '');
    
    // Check if path includes parameters
    const paramMatch = code.match(/params\.(\w+)|:(\w+)/g);
    if (paramMatch) {
      paramMatch.forEach(match => {
        const param = match.replace(/params\.|:/g, '');
        if (!path.includes(`{${param}}`)) {
          path += `/{${param}}`;
        }
      });
    }
    
    return `/api/${path}`;
  }

  /**
   * Extract parameters from code
   */
  private extractParameters(code: string): APIParameter[] {
    const parameters: APIParameter[] = [];
    
    // Path parameters
    const pathParams = code.match(/params\.(\w+)/g) || [];
    pathParams.forEach(match => {
      const name = match.replace('params.', '');
      parameters.push({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' }
      });
    });
    
    // Query parameters
    const queryParams = code.match(/searchParams\.get\(['"](\w+)['"]\)/g) || [];
    queryParams.forEach(match => {
      const name = match.match(/['"](\w+)['"]/)?.[1];
      if (name) {
        parameters.push({
          name,
          in: 'query',
          required: false,
          schema: { type: 'string' }
        });
      }
    });
    
    return parameters;
  }

  /**
   * Extract request body schema from code
   */
  private extractRequestBody(code: string): APIRequestBody | undefined {
    const jsonMatch = code.match(/await req\.json\(\)/);
    if (!jsonMatch) return undefined;
    
    // Extract expected fields from destructuring or object access
    const destructureMatch = code.match(/const\s*{\s*([^}]+)\s*}\s*=\s*await req\.json\(\)/);
    if (destructureMatch) {
      const fields = destructureMatch[1].split(',').map(f => f.trim());
      const properties: Record<string, SchemaObject> = {};
      const required: string[] = [];
      
      fields.forEach(field => {
        const fieldName = field.split(':')[0].trim();
        properties[fieldName] = { type: 'string' };
        if (!field.includes('?')) {
          required.push(fieldName);
        }
      });
      
      return {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties,
              required
            }
          }
        }
      };
    }
    
    return {
      required: true,
      content: {
        'application/json': {
          schema: { type: 'object' }
        }
      }
    };
  }

  /**
   * Extract response schemas from code
   */
  private extractResponses(code: string): Record<string, APIResponse> {
    const responses: Record<string, APIResponse> = {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      }
    };
    
    // Check for error responses
    if (code.includes('status: 400') || code.includes('400')) {
      responses['400'] = {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      };
    }
    
    if (code.includes('status: 401') || code.includes('unauthorized')) {
      responses['401'] = {
        description: 'Unauthorized'
      };
    }
    
    if (code.includes('status: 404') || code.includes('not found')) {
      responses['404'] = {
        description: 'Not found'
      };
    }
    
    if (code.includes('status: 500') || code.includes('error.message')) {
      responses['500'] = {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      };
    }
    
    return responses;
  }

  /**
   * Extract summary from comments or file name
   */
  private extractSummary(code: string, filePath: string): string {
    // Try to find JSDoc @summary or first line of comment
    const summaryMatch = code.match(/@summary\s+(.+)|\/\*\*\s*\n\s*\*\s*(.+)/);
    if (summaryMatch) {
      return (summaryMatch[1] || summaryMatch[2]).trim();
    }
    
    // Generate from file name
    const fileName = filePath.split('/').pop()?.replace(/\.ts$/, '') || '';
    return fileName.replace(/([A-Z])/g, ' $1').trim();
  }

  /**
   * Extract description from comments
   */
  private extractDescription(code: string): string | undefined {
    const descMatch = code.match(/@description\s+(.+)/);
    return descMatch ? descMatch[1].trim() : undefined;
  }

  /**
   * Extract tags from file path
   */
  private extractTags(filePath: string): string[] {
    const parts = filePath.split('/');
    if (parts.length > 1) {
      return [parts[parts.length - 2]]; // Use parent directory as tag
    }
    return ['API'];
  }

  /**
   * Add endpoint to documentation
   */
  addEndpoint(endpoint: APIEndpoint) {
    this.endpoints.push(endpoint);
  }

  /**
   * Generate full OpenAPI 3.0 specification
   */
  generateSpec(
    title: string,
    version: string,
    description: string,
    serverUrl: string
  ): any {
    return {
      openapi: '3.0.3',
      info: {
        title,
        version,
        description,
        contact: {
          name: 'API Support',
          email: 'support@appforge.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: serverUrl,
          description: 'Production server'
        },
        {
          url: `${serverUrl.replace('https://', 'https://staging.')}`,
          description: 'Staging server'
        }
      ],
      paths: this.generatePaths(),
      components: {
        schemas: Object.fromEntries(this.schemas),
        securitySchemes: Object.fromEntries(this.securitySchemes)
      },
      tags: this.generateTags()
    };
  }

  /**
   * Generate paths object
   */
  private generatePaths(): Record<string, any> {
    const paths: Record<string, any> = {};
    
    this.endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      
      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        security: endpoint.security
      };
    });
    
    return paths;
  }

  /**
   * Generate tags from endpoints
   */
  private generateTags(): any[] {
    const tagSet = new Set<string>();
    
    this.endpoints.forEach(endpoint => {
      endpoint.tags?.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet).map(tag => ({
      name: tag,
      description: `${tag} operations`
    }));
  }

  /**
   * Export as JSON
   */
  toJSON(title: string, version: string, description: string, serverUrl: string): string {
    const spec = this.generateSpec(title, version, description, serverUrl);
    return JSON.stringify(spec, null, 2);
  }

  /**
   * Export as YAML
   */
  toYAML(title: string, version: string, description: string, serverUrl: string): string {
    const spec = this.generateSpec(title, version, description, serverUrl);
    return this.objectToYAML(spec);
  }

  /**
   * Simple object to YAML converter
   */
  private objectToYAML(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.objectToYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.objectToYAML(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }
    
    return yaml;
  }
}

export default OpenAPIGenerator;
