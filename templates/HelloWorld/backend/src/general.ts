/**
 * General handlers
 *
 * Context and diagnostics. These live in a domain file rather than in index.ts,
 * which is a pure re-export manifest.
 */

import { log } from "./logger";
import { requirePermission } from "./permissions";

/**
 * Echo handler - returns the payload along with full context info.
 * Useful for debugging and verifying SDK access.
 */
const echo = async (payload: unknown) => {
  requirePermission("read");

  log.info(
    "echo",
    `called by ${ketrics.requestor.type}:${ketrics.requestor.userId || ketrics.requestor.serviceAccountCode}`,
  );

  return {
    payload,
    context: {
      tenant: ketrics.tenant,
      application: ketrics.application,
      requestor: ketrics.requestor,
      runtime: ketrics.runtime,
      environment: ketrics.environment,
    },
  };
};

/**
 * Info handler - returns runtime environment details.
 */
const info = async () => {
  requirePermission("read");

  return {
    tenant: { id: ketrics.tenant.id, code: ketrics.tenant.code, name: ketrics.tenant.name },
    application: {
      id: ketrics.application.id,
      code: ketrics.application.code,
      name: ketrics.application.name,
      version: ketrics.application.version,
    },
    runtime: ketrics.runtime,
  };
};

export { echo, info };
