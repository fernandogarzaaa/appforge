/**
 * SCIM 2.0 User Provisioning
 * System for Cross-domain Identity Management
 */

export const SCIM_VERSIONS = {
  V1: '1.1',
  V2: '2.0',
};

export const SCIM_RESOURCE_TYPES = {
  USER: 'User',
  GROUP: 'Group',
  ENTERPRISE_USER: 'EnterpriseUser',
};

export const SCIM_OPERATIONS = {
  ADD: 'add',
  REMOVE: 'remove',
  REPLACE: 'replace',
};

/**
 * SCIM User Resource
 */
export class SCIMUser {
  constructor(data = {}) {
    this.schemas = data.schemas || ['urn:ietf:params:scim:schemas:core:2.0:User'];
    this.id = data.id;
    this.externalId = data.externalId;
    this.userName = data.userName;
    this.name = data.name || {};
    this.displayName = data.displayName;
    this.emails = data.emails || [];
    this.phoneNumbers = data.phoneNumbers || [];
    this.active = data.active !== false;
    this.groups = data.groups || [];
    this.roles = data.roles || [];
    this.meta = data.meta || this._generateMeta();
    
    // Enterprise extension
    if (data.enterpriseUser) {
      this.schemas.push('urn:ietf:params:scim:schemas:extension:enterprise:2.0:User');
      this['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'] = data.enterpriseUser;
    }
  }

  /**
   * Generate metadata
   */
  _generateMeta() {
    const now = new Date().toISOString();
    return {
      resourceType: SCIM_RESOURCE_TYPES.USER,
      created: now,
      lastModified: now,
      version: `W/"${Date.now()}"`,
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    const json = {
      schemas: this.schemas,
      id: this.id,
      userName: this.userName,
      name: this.name,
      displayName: this.displayName,
      emails: this.emails,
      phoneNumbers: this.phoneNumbers,
      active: this.active,
      groups: this.groups,
      roles: this.roles,
      meta: this.meta,
    };

    if (this.externalId) {
      json.externalId = this.externalId;
    }

    if (this['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']) {
      json['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'] = 
        this['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'];
    }

    return json;
  }
}

/**
 * SCIM Group Resource
 */
export class SCIMGroup {
  constructor(data = {}) {
    this.schemas = data.schemas || ['urn:ietf:params:scim:schemas:core:2.0:Group'];
    this.id = data.id;
    this.displayName = data.displayName;
    this.members = data.members || [];
    this.meta = data.meta || this._generateMeta();
  }

  _generateMeta() {
    const now = new Date().toISOString();
    return {
      resourceType: SCIM_RESOURCE_TYPES.GROUP,
      created: now,
      lastModified: now,
      version: `W/"${Date.now()}"`,
    };
  }

  toJSON() {
    return {
      schemas: this.schemas,
      id: this.id,
      displayName: this.displayName,
      members: this.members,
      meta: this.meta,
    };
  }
}

/**
 * SCIM Provisioning Service
 */
export class SCIMProvisioningService {
  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.version = SCIM_VERSIONS.V2;
  }

  /**
   * Get service provider configuration
   */
  getServiceProviderConfig() {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      documentationUri: 'https://appforge.com/docs/scim',
      patch: {
        supported: true,
      },
      bulk: {
        supported: true,
        maxOperations: 1000,
        maxPayloadSize: 1048576, // 1MB
      },
      filter: {
        supported: true,
        maxResults: 200,
      },
      changePassword: {
        supported: true,
      },
      sort: {
        supported: true,
      },
      etag: {
        supported: true,
      },
      authenticationSchemes: [
        {
          type: 'oauthbearertoken',
          name: 'OAuth Bearer Token',
          description: 'Authentication scheme using OAuth Bearer Token',
          specUri: 'https://tools.ietf.org/html/rfc6750',
          documentationUri: 'https://appforge.com/docs/scim/auth',
          primary: true,
        },
      ],
    };
  }

  /**
   * Get resource types
   */
  getResourceTypes() {
    return [
      {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
        id: 'User',
        name: 'User',
        endpoint: '/Users',
        description: 'User Account',
        schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
        schemaExtensions: [
          {
            schema: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
            required: false,
          },
        ],
      },
      {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
        id: 'Group',
        name: 'Group',
        endpoint: '/Groups',
        description: 'Group',
        schema: 'urn:ietf:params:scim:schemas:core:2.0:Group',
      },
    ];
  }

  /**
   * Create user
   */
  async createUser(userData) {
    // Validate required fields
    if (!userData.userName) {
      throw new Error('userName is required');
    }

    // Check for duplicate username
    for (const user of this.users.values()) {
      if (user.userName === userData.userName) {
        throw new Error('User with this userName already exists');
      }
    }

    // Generate ID
    const id = this._generateId();
    
    // Create user
    const user = new SCIMUser({
      ...userData,
      id,
    });

    this.users.set(id, user);

    return user.toJSON();
  }

  /**
   * Get user by ID
   */
  async getUser(id) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user.toJSON();
  }

  /**
   * List users
   */
  async listUsers(options = {}) {
    const { startIndex = 1, count = 100, filter, sortBy, sortOrder } = options;

    let users = Array.from(this.users.values());

    // Apply filter
    if (filter) {
      users = this._applyFilter(users, filter);
    }

    // Apply sorting
    if (sortBy) {
      users = this._applySorting(users, sortBy, sortOrder);
    }

    // Pagination
    const totalResults = users.length;
    const paginatedUsers = users.slice(startIndex - 1, startIndex - 1 + count);

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex,
      itemsPerPage: paginatedUsers.length,
      Resources: paginatedUsers.map(u => u.toJSON()),
    };
  }

  /**
   * Update user (PUT - full replacement)
   */
  async updateUser(id, userData) {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Preserve ID and metadata
    const updatedUser = new SCIMUser({
      ...userData,
      id,
      meta: {
        ...existingUser.meta,
        lastModified: new Date().toISOString(),
        version: `W/"${Date.now()}"`,
      },
    });

    this.users.set(id, updatedUser);

    return updatedUser.toJSON();
  }

  /**
   * Patch user (PATCH - partial update)
   */
  async patchUser(id, patchOps) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    const userData = user.toJSON();

    // Apply operations
    for (const op of patchOps.Operations) {
      this._applyPatchOperation(userData, op);
    }

    // Update user
    const updatedUser = new SCIMUser({
      ...userData,
      meta: {
        ...user.meta,
        lastModified: new Date().toISOString(),
        version: `W/"${Date.now()}"`,
      },
    });

    this.users.set(id, updatedUser);

    return updatedUser.toJSON();
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    this.users.delete(id);
    return { success: true };
  }

  /**
   * Create group
   */
  async createGroup(groupData) {
    if (!groupData.displayName) {
      throw new Error('displayName is required');
    }

    const id = this._generateId();
    const group = new SCIMGroup({
      ...groupData,
      id,
    });

    this.groups.set(id, group);

    return group.toJSON();
  }

  /**
   * Get group by ID
   */
  async getGroup(id) {
    const group = this.groups.get(id);
    if (!group) {
      throw new Error('Group not found');
    }
    return group.toJSON();
  }

  /**
   * List groups
   */
  async listGroups(options = {}) {
    const { startIndex = 1, count = 100, filter } = options;

    let groups = Array.from(this.groups.values());

    // Apply filter
    if (filter) {
      groups = this._applyFilter(groups, filter);
    }

    // Pagination
    const totalResults = groups.length;
    const paginatedGroups = groups.slice(startIndex - 1, startIndex - 1 + count);

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex,
      itemsPerPage: paginatedGroups.length,
      Resources: paginatedGroups.map(g => g.toJSON()),
    };
  }

  /**
   * Update group
   */
  async updateGroup(id, groupData) {
    const existingGroup = this.groups.get(id);
    if (!existingGroup) {
      throw new Error('Group not found');
    }

    const updatedGroup = new SCIMGroup({
      ...groupData,
      id,
      meta: {
        ...existingGroup.meta,
        lastModified: new Date().toISOString(),
        version: `W/"${Date.now()}"`,
      },
    });

    this.groups.set(id, updatedGroup);

    return updatedGroup.toJSON();
  }

  /**
   * Delete group
   */
  async deleteGroup(id) {
    const group = this.groups.get(id);
    if (!group) {
      throw new Error('Group not found');
    }

    this.groups.delete(id);
    return { success: true };
  }

  /**
   * Apply patch operation
   */
  _applyPatchOperation(resource, operation) {
    const { op, path, value } = operation;

    switch (op.toLowerCase()) {
      case SCIM_OPERATIONS.ADD:
        this._addValue(resource, path, value);
        break;
      case SCIM_OPERATIONS.REMOVE:
        this._removeValue(resource, path);
        break;
      case SCIM_OPERATIONS.REPLACE:
        this._replaceValue(resource, path, value);
        break;
      default:
        throw new Error(`Unsupported operation: ${op}`);
    }
  }

  /**
   * Add value to resource
   */
  _addValue(resource, path, value) {
    if (!path) {
      // Add to root
      Object.assign(resource, value);
      return;
    }

    const keys = path.split('.');
    let current = resource;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current[lastKey])) {
      current[lastKey].push(value);
    } else {
      current[lastKey] = value;
    }
  }

  /**
   * Remove value from resource
   */
  _removeValue(resource, path) {
    const keys = path.split('.');
    let current = resource;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) return;
      current = current[keys[i]];
    }

    delete current[keys[keys.length - 1]];
  }

  /**
   * Replace value in resource
   */
  _replaceValue(resource, path, value) {
    if (!path) {
      Object.assign(resource, value);
      return;
    }

    const keys = path.split('.');
    let current = resource;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Apply filter to resources
   */
  _applyFilter(resources, filter) {
    // Simplified filter implementation
    // In production, implement full SCIM filter parser
    
    const filterRegex = /(\w+)\s+(eq|ne|co|sw|ew)\s+"([^"]+)"/i;
    const match = filter.match(filterRegex);

    if (!match) {
      return resources;
    }

    const [, attribute, operator, value] = match;

    return resources.filter(resource => {
      const resourceData = resource.toJSON();
      const attrValue = this._getAttributeValue(resourceData, attribute);

      switch (operator.toLowerCase()) {
        case 'eq':
          return attrValue === value;
        case 'ne':
          return attrValue !== value;
        case 'co':
          return attrValue && attrValue.includes(value);
        case 'sw':
          return attrValue && attrValue.startsWith(value);
        case 'ew':
          return attrValue && attrValue.endsWith(value);
        default:
          return true;
      }
    });
  }

  /**
   * Get attribute value from resource
   */
  _getAttributeValue(resource, path) {
    const keys = path.split('.');
    let value = resource;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Apply sorting to resources
   */
  _applySorting(resources, sortBy, sortOrder = 'ascending') {
    return resources.sort((a, b) => {
      const aValue = this._getAttributeValue(a.toJSON(), sortBy);
      const bValue = this._getAttributeValue(b.toJSON(), sortBy);

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'descending' ? -comparison : comparison;
    });
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SCIMProvisioningService;
