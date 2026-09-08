/**
 * Cross-cutting helpers
 *
 * Utilities shared by several domain files. Keep this small: a helper used by a
 * single domain belongs at the top of that domain's file, not here.
 *
 * Resource codes are never hardcoded. Every resource declared in
 * ketrics.config.json binds to an environment variable - either the name given
 * by "environmentVariable" or one derived from the resource kind and code - and
 * the tenant picks the real resource in the Ketrics portal. Handlers read the
 * code back through an accessor defined here, so the variable name lives in
 * exactly one place and a missing value fails with a clear message.
 */

/**
 * Read a required environment variable.
 * Fails with the variable name so an unconfigured application is obvious, and
 * never falls back to a hardcoded default.
 */
export const requireEnv = (name: string): string => {
  const value = ketrics.environment[name];

  if (!value) {
    throw new Error(
      `Environment variable ${name} is not configured. Set it in the Ketrics portal under Applications > Environment Variables.`,
    );
  }

  return value;
};

/** Read an optional environment variable, falling back to a literal default. */
export const optionalEnv = (name: string, fallback: string): string =>
  ketrics.environment[name] || fallback;

/**
 * Accessor per resource. Add one for every resource declared in
 * ketrics.config.json, for example:
 *
 *   export const appDataDocDbCode = () => requireEnv("APP_DATA_DOCDB");
 *   export const exportsVolumeCode = () => requireEnv("EXPORTS_VOLUME");
 *
 * Never write the resource code itself in handler source - codes differ per
 * tenant and per environment, so a literal ties the bundle to one tenant.
 */
