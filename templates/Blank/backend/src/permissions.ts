/**
 * Application Permissions
 *
 * The capabilities this application enforces. These are the SAME codes as the
 * "actions" array in ketrics.config.json - keep the two in sync by hand.
 * Roles in the config compose these capabilities; reorganising who can do what
 * is a role edit, not a code change.
 *
 * Because requirePermission() takes a Permission and not a string, a typo like
 * requirePermission("wirte") is a compile error rather than a handler no role
 * can ever reach.
 */

/** The permissions this application enforces. Keep in sync with `actions` in ketrics.config.json. */
export const PERMISSIONS = ["read", "write"] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Guard a handler with a capability.
 * `ketrics.requestor.applicationPermissions` holds the capabilities granted to
 * the requestor through their roles, or ["*"] for full access.
 *
 * @throws Error when the requestor was not granted the permission
 */
export function requirePermission(permission: Permission): void {
  const granted = ketrics.requestor.applicationPermissions;

  if (!granted.includes("*") && !granted.includes(permission)) {
    throw new Error(`Permission denied: "${permission}" required`);
  }
}
