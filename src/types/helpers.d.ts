/**
 * Type Helper Utilities for AppForge
 * 
 * This file provides JSDoc-compatible type helpers for common patterns
 * that cause TypeScript errors in the codebase.
 */

/**
 * Helper type for React Query mutation functions
 * Use with JSDoc: @type {import('./types/helpers').MutationFunction<TData, TVariables>}
 */
export type MutationFunction<TData = any, TVariables = any> = (variables: TVariables) => Promise<TData>;

/**
 * Helper type for React Query query functions
 * Use with JSDoc: @type {import('./types/helpers').QueryFunction<TData>}
 */
export type QueryFunction<TData = any> = () => Promise<TData>;

/**
 * Generic API response type
 * Use with JSDoc: @type {import('./types/helpers').ApiResponse<T>}
 */
export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
  success?: boolean;
}

/**
 * Entity data type helper
 * Use with JSDoc: @type {import('./types/helpers').EntityData<T>}
 */
export type EntityData<T = any> = T | { data: T };

/**
 * Mutation variables with ID
 * Use with JSDoc: @type {import('./types/helpers').UpdateVariables<T>}
 */
export interface UpdateVariables<T = any> {
  id: string;
  data: Partial<T>;
}

/**
 * Base entity interface
 */
export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}
