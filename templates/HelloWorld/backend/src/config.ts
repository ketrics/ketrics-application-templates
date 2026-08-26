/**
 * Resource Configuration
 *
 * Resource codes are never hardcoded. Every resource declared in
 * ketrics.config.json binds to an environment variable - either the name given
 * by "environmentVariable" or one derived from the resource kind and code - and
 * the tenant picks the real resource in the Ketrics portal. Handlers read the
 * code back from ketrics.environment through the helpers below.
 */

/**
 * Read a required environment variable.
 * Fails with the variable name so an unconfigured application is obvious.
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
 * Volume code - declared as resources.volume "test-volume" in
 * ketrics.config.json, bound to DEMO_VOLUME.
 */
const demoVolumeCode = (): string => requireEnv("DEMO_VOLUME");

/**
 * Secret code - declared as resources.secret "apikey" in ketrics.config.json.
 * APIKEY_SECRET is the name derived from the kind and code.
 */
const apiKeySecretCode = (): string => requireEnv("APIKEY_SECRET");

/**
 * SQL data connection code - declared in the config's "environment" block.
 * Data connections are not a "resources" kind, so this is a plain variable.
 */
const databaseConnectionCode = (): string => requireEnv("DATABASE_CONNECTION");

export { requireEnv, demoVolumeCode, apiKeySecretCode, databaseConnectionCode };
