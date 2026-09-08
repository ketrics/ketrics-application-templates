/**
 * Shared types
 *
 * Interfaces and type aliases used across domain files. No runtime code lives
 * here, so importing from it never pulls logic into a bundle.
 */

/** Payload accepted by the `echo` handler. */
export interface EchoPayload {
  message?: string;
}

/** Payload accepted by the `greet` handler. */
export interface GreetPayload {
  name?: string;
}

/** Payload accepted by the `notifyMe` handler. */
export interface NotifyPayload {
  subject?: string;
  body?: string;
}

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
  userId: string | undefined;
  userName: string | undefined;
}
