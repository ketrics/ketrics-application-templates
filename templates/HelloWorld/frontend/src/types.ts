/**
 * Shared frontend types
 *
 * Mirror the backend's response shapes here so components and the service layer
 * agree on what a handler returns.
 */

/**
 * What the current user can do, as reported by the `getPermissions` handler.
 *
 * These are capabilities, not roles: a user may hold several roles, and the UI
 * only cares about the union of what they grant.
 */
export interface Permissions {
  canRead: boolean;
  canWrite: boolean;
  canExport: boolean;
  canApprove: boolean;
  userId: string;
  userName: string;
}

/** A document stored by the DocumentDB handlers. */
export interface Note {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Shared, unencrypted JSON configuration read from a Parameter. */
export interface AppSettings {
  currency: string;
  taxRate: number;
  paymentTerms?: { code: string; days: number }[];
}

/** A tenant user, as returned by `listUsers`. */
export interface TenantUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Envelope every handler response arrives in. */
export interface ApiResponse<T> {
  success: boolean;
  result: T;
}
