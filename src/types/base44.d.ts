/**
 * Base44 SDK Type Definitions
 * 
 * This file provides proper TypeScript type definitions for the base44 SDK
 * to fix common errors like:
 * - Property 'data' does not exist on type 'never'
 * - Property 'data' does not exist on type 'void'
 * - API response types returning void instead of actual types
 */

import '@base44/sdk';

/**
 * Generic response wrapper for base44 API calls
 */
export interface Base44Response<T> {
  data: T;
  error?: string;
  message?: string;
  success?: boolean;
}

/**
 * Entity CRUD operations interface with proper typing
 */
export interface Entity<T = any> {
  /**
   * List all entities with optional sorting and pagination
   */
  list(sort?: string, limit?: number, skip?: number, fields?: string[]): Promise<T[]>;
  
  /**
   * Filter entities based on query
   */
  filter(query: Partial<T>, sort?: string, limit?: number, skip?: number, fields?: string[]): Promise<T[]>;
  
  /**
   * Get a single entity by ID
   */
  get(id: string): Promise<T>;
  
  /**
   * Create a new entity
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: string, data: Partial<T>): Promise<T>;
  
  /**
   * Delete an entity by ID
   */
  delete(id: string): Promise<{ success: boolean }>;
  
  /**
   * Delete multiple entities matching query
   */
  deleteMany(query: Partial<T>): Promise<{ success: boolean; deleted: number }>;
  
  /**
   * Bulk create entities
   */
  bulkCreate(data: Partial<T>[]): Promise<T[]>;
  
  /**
   * Query with advanced options
   */
  query(options: any): Promise<T[]>;
  
  /**
   * Insert (alias for create)
   */
  insert(data: Partial<T>): Promise<T>;
  
  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (event: { type: string; data: T; id: string; timestamp: string }) => void): () => void;
}

/**
 * Response wrapper that includes the data property
 * Use this when the API returns { data: T } instead of T directly
 */
export interface EntityCRUD<T = any> {
  filter(query: Partial<T>, sort?: string, limit?: number, skip?: number, fields?: string[]): Promise<T[]>;
  list(sort?: string, limit?: number, skip?: number, fields?: string[]): Promise<T[]>;
  get(id: string): Promise<T>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<{ success: boolean }>;
  deleteMany(query: Partial<T>): Promise<{ success: boolean; deleted: number }>;
  bulkCreate(data: Partial<T>[]): Promise<T[]>;
  query(options: any): Promise<T[]>;
  insert(data: Partial<T>): Promise<T>;
  subscribe(callback: (event: { type: string; data: T; id: string; timestamp: string }) => void): () => void;
}

/**
 * Typed entity response for list operations
 */
export interface EntityListResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Typed entity response for single item operations
 */
export interface EntityItemResponse<T> {
  data: T;
  success?: boolean;
}

declare module '@base44/sdk' {
  /**
   * Override the EntityCRUD interface to return proper types with data property
   */
  interface EntityCRUD<T = any> {
    filter(query: Partial<T>, sort?: string, limit?: number, skip?: number, fields?: string[]): Promise<T[]>;
    list(sort?: string, limit?: number, skip?: number, fields?: string[]): Promise<T[]>;
    get(id: string): Promise<T>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<{ success: boolean }>;
    deleteMany(query: Partial<T>): Promise<{ success: boolean; deleted: number }>;
    bulkCreate(data: Partial<T>[]): Promise<T[]>;
    query(options: any): Promise<T[]>;
    insert(data: Partial<T>): Promise<T>;
    subscribe(callback: (event: { type: string; data: T; id: string; timestamp: string }) => void): () => void;
  }

  /**
   * Extended Base44Client with proper typing
   */
  interface Base44Client {
    analytics: {
      capture: (event: string, properties?: any) => Promise<{ skipped: boolean }> | void;
      flush: () => Promise<{ skipped: boolean }> | void;
    };
    integrations: any;
    asServiceRole: Base44Client;
    agents: any;
    queries: any;
    mutations: any;
    appLogs?: any;
    cleanup?: () => void;
    setToken?: (token: string) => void;
    getConfig?: () => any;
    
    // Top-level shortcuts
    query?: (entity: string, options?: any) => Promise<any[]>;
    create?: (entity: string, data: any) => Promise<any>;
    update?: (entity: string, id: string, data: any) => Promise<any>;
    delete?: (entity: string, id: string) => Promise<{ success: boolean }>;
    
    // Allow dynamic entity access
    [key: string]: any;
  }

  /**
   * Auth client interface
   */
  interface AuthClient {
    me(): Promise<{ id?: string; email?: string; name?: string; role?: string; full_name?: string }>;
    getLoginUrl(redirect?: string): string;
    redirectToLogin(redirect?: string): void;
    logout(): void;
    getCurrentUser(): Promise<any>;
    loginViaEmailPassword(credentials: any): Promise<any>;
  }

  /**
   * Functions module interface
   */
  interface FunctionsModule {
    execute(functionName: string, data?: Record<string, any>): Promise<any>;
    invoke(functionName: string, data?: Record<string, any>): Promise<any>;
    call(functionName: string, data?: Record<string, any>): Promise<any>;
  }

  /**
   * Entities module with dynamic entity access
   */
  interface EntitiesModule {
    [key: string]: EntityCRUD | any;
  }

  /**
   * Pages module interface
   */
  interface PagesModule {
    list(options?: any): Promise<any[]>;
    get(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<{ success: boolean }>;
  }

  /**
   * Components module interface
   */
  interface ComponentsModule {
    list(options?: any): Promise<any[]>;
    get(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<{ success: boolean }>;
  }

  /**
   * Data module interface
   */
  interface DataModule {
    query(entity: string, options?: any): Promise<any[]>;
    get(entity: string, id: string): Promise<any>;
    create(entity: string, data: any): Promise<any>;
    update(entity: string, id: string, data: any): Promise<any>;
    delete(entity: string, id: string): Promise<{ success: boolean }>;
  }

  /**
   * Storage module interface
   */
  interface StorageModule {
    upload(file: any): Promise<{ url: string }>;
    delete(url: string): Promise<{ success: boolean }>;
  }

  /**
   * Client creation options
   */
  interface CreateClientOptions {
    appId: string;
    token?: string;
    functionsVersion?: string;
    serverUrl?: string;
    requiresAuth?: boolean;
    appBaseUrl?: string;
  }

  /**
   * Create client function
   */
  function createClient(options: CreateClientOptions): Base44Client;
  function createClientFromRequest(req: Request): Base44Client;
}

/**
 * Helper type for extracting data from responses
 * Usage: const data = extractData(response);
 */
export function extractData<T>(response: T | { data: T }): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response;
}

/**
 * Type guard for checking if response has data property
 */
export function hasDataProperty<T>(response: any): response is { data: T } {
  return response && typeof response === 'object' && 'data' in response;
}

export {};
