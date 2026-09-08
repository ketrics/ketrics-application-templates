/**
 * Shared types
 *
 * Interfaces and type aliases used across domain files. No runtime code lives
 * here, so importing from it never pulls logic into the bundle.
 */

/**
 * What the current user can do, as reported by `getPermissions`.
 *
 * Mirror the app's capabilities (`actions` in ketrics.config.json) as `can*`
 * booleans: a user may hold several roles, and the UI only ever cares about the
 * union of their capabilities, never about which roles produced them.
 */
export interface PermissionsResult {
  canRead: boolean;
  canWrite: boolean;
  canExport: boolean;
  canApprove: boolean;
  userId: string | undefined;
  userName: string | undefined;
}

/** A document stored in the DocumentDB demo. */
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

/** Payload of the `_processInBackground` background handler. */
export interface BackgroundJobPayload {
  noteId?: string;
  source?: string;
}
