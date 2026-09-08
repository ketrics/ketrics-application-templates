/**
 * Application Permissions
 *
 * The capabilities this application enforces. These are the SAME codes as the
 * "actions" array in ketrics.config.json - keep the two in sync by hand,
 * because nothing at runtime notices when they drift:
 *
 *   - in the config but not in PERMISSIONS -> no handler can use it;
 *   - in PERMISSIONS but not in the config -> no role can grant it, so every
 *     handler guarding it throws for everyone.
 *
 * Roles in the config compose these capabilities; reorganising who can do what
 * is a role edit, not a code change.
 *
 * Because requirePermission() takes a Permission and not a string, a typo like
 * requirePermission("wirte") is a compile error rather than a handler no role
 * can ever reach.
 */

import { PermissionsResult } from "./types";

/** The permissions this application enforces. Keep in sync with `actions` in ketrics.config.json. */
export const PERMISSIONS = ["read", "write"] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Whether the requestor holds a capability.
 * `ketrics.requestor.applicationPermissions` holds the capabilities granted
 * through their roles, or ["*"] for full access. Never test a role code against
 * it - it contains capabilities, so `includes("editor")` can never match.
 */
export function hasPermission(permission: Permission): boolean {
  const granted = ketrics.requestor.applicationPermissions;
  return granted.includes("*") || granted.includes(permission);
}

/**
 * Guard a handler with a capability. Call it on the first line of the handler.
 *
 * @throws Error when the requestor was not granted the permission
 */
export function requirePermission(permission: Permission): void {
  if (!hasPermission(permission)) {
    throw new Error(`Permission denied: "${permission}" required`);
  }
}

/**
 * Report what the current user can do, so the frontend can hide actions they
 * cannot perform. Hiding a button is a convenience, never a control: every
 * handler still calls requirePermission().
 */
export const getPermissions = async (): Promise<PermissionsResult> => ({
  canRead: hasPermission("read"),
  canWrite: hasPermission("write"),
  userId: ketrics.requestor.userId,
  userName: ketrics.requestor.name,
});
