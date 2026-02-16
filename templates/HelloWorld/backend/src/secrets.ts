/**
 * Secret Examples
 *
 * Demonstrates encrypted secret retrieval using ketrics.Secret.
 * Secrets must be created and granted to the application in the Ketrics portal.
 */

/**
 * Retrieve an encrypted secret by code.
 */
const getSecret = async (payload: { code?: string }) => {
  const secretCode = payload?.code || "apikey";
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
