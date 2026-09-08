/**
 * Cross-cutting helpers
 *
 * Utilities used by several domain files: environment/resource accessors and
 * the download-disposition helper. Keep this small — a helper used by a single
 * domain belongs at the top of that domain's file, not here.
 *
 * Resource codes are never hardcoded. Every resource declared in
 * ketrics.config.json binds to an environment variable — either the name given
 * by "environmentVariable" or one derived from the resource kind and code — and
 * the tenant picks the real resource in the Ketrics portal. Handlers read the
 * code back through the accessors below, so each variable name lives in exactly
 * one place.
 */

/**
 * Read a required environment variable.
 * Fails with the variable name so an unconfigured application is obvious, and
 * never falls back to a hardcoded default.
 */
const requireEnv = (name: string): string => {
  const value = ketrics.environment[name];

  if (!value) {
    throw new Error(
      `Environment variable ${name} is not configured. Set it in the Ketrics portal under Applications > Environment Variables.`,
    );
  }

  return value;
};

/**
 * Volume code — declared as resources.volume "test-volume" in
 * ketrics.config.json with an explicit environmentVariable, so DEMO_VOLUME is
 * also declared under "environment".
 */
const demoVolumeCode = (): string => requireEnv("DEMO_VOLUME");

/**
 * Secret code — declared as resources.secret "apikey" in ketrics.config.json.
 * APIKEY_SECRET is the name derived from the kind and code, so it needs no
 * "environment" entry of its own.
 */
const apiKeySecretCode = (): string => requireEnv("APIKEY_SECRET");

/**
 * SQL data connection code — declared as resources.connection "main-db",
 * bound to the derived MAIN_DB_CONNECTION.
 *
 * Data connections used to be a plain environment entry; since "connection"
 * became a declarable resource kind they belong under "resources", which is
 * what gives the portal a picker and auto-grants connection:{code}.
 */
const mainDbConnectionCode = (): string => requireEnv("MAIN_DB_CONNECTION");

/**
 * DocumentDB code — declared as resources.documentdb "app-data", bound to the
 * derived APP_DATA_DOCDB.
 */
const appDataDocDbCode = (): string => requireEnv("APP_DATA_DOCDB");

/**
 * Parameter code — declared as resources.parameter "app-settings", bound to the
 * derived APP_SETTINGS_PARAMETER. Declaring it is what grants the app access.
 */
const appSettingsParameterCode = (): string => requireEnv("APP_SETTINGS_PARAMETER");

/**
 * Content-Disposition value that forces a browser download.
 *
 * App frontends run in an iframe under a strict `frame-src https://cdn.ketrics.io`
 * CSP, and presigned Volume URLs point at the S3 bucket host, which is not in
 * that allowlist. Without `Content-Disposition: attachment` the browser tries to
 * render the file by navigating the iframe to S3, the CSP blocks the navigation,
 * and the download silently fails. Forcing an attachment short-circuits the
 * rendering path, so the CSP never applies.
 *
 * Pass this to EVERY generateDownloadUrl() call the frontend will follow — not
 * just "export" buttons. RFC 5987 encoding keeps accents and spaces usable in
 * both legacy and modern browsers.
 */
const attachmentDisposition = (filename: string): string => {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};

export {
  requireEnv,
  demoVolumeCode,
  apiKeySecretCode,
  mainDbConnectionCode,
  appDataDocDbCode,
  appSettingsParameterCode,
  attachmentDisposition,
};
