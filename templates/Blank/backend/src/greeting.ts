/**
 * Greeting domain
 *
 * The starting point for your own handlers. Group code by domain / feature -
 * one file per coherent area of the app - and keep index.ts a pure re-export
 * manifest. esbuild bundles the whole src/ tree into a single dist/index.js, so
 * multi-file source costs nothing at runtime.
 */

import { optionalEnv } from "./helpers";
import { log } from "./logger";
import { requirePermission } from "./permissions";
import { EchoPayload, GreetPayload } from "./types";

/**
 * Echo handler - returns the payload along with full context info.
 * Useful for debugging and verifying SDK access.
 */
export const echo = async (payload: EchoPayload) => {
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
 * Greet handler - reads the WELCOME_MESSAGE environment variable declared in
 * ketrics.config.json. An admin fills its value in the Ketrics portal; until
 * then the fallback below is used.
 */
export const greet = async (payload: GreetPayload) => {
  requirePermission("read");

  const name = payload?.name?.trim() || ketrics.requestor.name || "there";
  const template = optionalEnv("WELCOME_MESSAGE", "Hello, {name}! Welcome to {app}.");

  const message = template
    .replace("{name}", name)
    .replace("{app}", ketrics.application.name);

  log.debug("greet", `greeting "${name}"`);

  return { message, greetedAt: new Date().toISOString() };
};
