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
  userId: string;
  userName: string;
}

/** Response of the `greet` handler. */
export interface Greeting {
  message: string;
  greetedAt: string;
}

/** Response of the `notifyMe` handler. */
export interface NotificationResult {
  messageId: string;
  status: string;
}

/** Envelope every handler response arrives in. */
export interface ApiResponse<T> {
  success: boolean;
  result: T;
}
