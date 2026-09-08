/**
 * Secret Examples
 *
 * Demonstrates encrypted secret retrieval using ketrics.Secret.
 * Secrets must be created and granted to the application in the Ketrics portal.
 */

import { apiKeySecretCode } from "./helpers";
import { requirePermission } from "./permissions";

/**
 * Retrieve an encrypted secret by code.
 * Defaults to the secret declared in ketrics.config.json (APIKEY_SECRET).
 */
const getSecret = async (payload: { code?: string }) => {
  requirePermission("read");

  const secretCode = payload?.code || apiKeySecretCode();
  const value = await ketrics.Secret.get(secretCode);

  // In production, never return the secret value directly.
  // This is only for demonstration purposes.
  return {
    code: secretCode,
    retrieved: true,
    valueLength: value.length,
  };
};

export { getSecret };
