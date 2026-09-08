/**
 * DEBUG_LEVEL-gated logger
 *
 * Once deployed, CloudWatch is the only window into what the app is doing, but
 * you do not want full verbosity (or its cost) running all the time. This
 * logger reads the DEBUG_LEVEL environment variable once at module load, so an
 * administrator can raise verbosity in the Ketrics portal to diagnose a
 * misbehaving flow and lower it again - with no redeploy.
 *
 * Levels are ordered none < error < warn < info < debug, and each level
 * includes the ones above it. Unset defaults to "error", which matches an app
 * that only ever called ketrics.console.error.
 *
 * Log at the boundaries where data can silently disappear: entry/exit of a
 * batch (counts in, counts out), around every external call (ketrics.http does
 * NOT throw on non-2xx, so log response.status), read/filter paths (raw vs.
 * filtered counts), and each write (the storage key).
 */

type LevelName = "none" | "error" | "warn" | "info" | "debug";

const LEVELS: Record<LevelName, number> = { none: 0, error: 1, warn: 2, info: 3, debug: 4 };

const resolveLevel = (): number => {
  const raw = (ketrics.environment["DEBUG_LEVEL"] ?? "").toString().trim().toLowerCase();
  if (raw in LEVELS) return LEVELS[raw as LevelName];
  return LEVELS.error; // unset / unrecognized -> errors only
};

const active = resolveLevel();

const fmt = (scope: string, msg: string) => `[${scope}] ${msg}`;

/**
 * The first argument is a scope - usually the handler or subsystem name. It
 * prefixes every line as [scope] so CloudWatch stays greppable
 * (`filter [createDocument]`).
 *
 * Never log secrets, tokens or PII: log counts, IDs, storage keys, statuses and
 * timestamps - the shape of the data, not the data itself.
 */
export const log = {
  error: (scope: string, msg: string, data?: unknown) =>
    active >= LEVELS.error && ketrics.console.error(fmt(scope, msg), data ?? ""),
  warn: (scope: string, msg: string, data?: unknown) =>
    active >= LEVELS.warn && ketrics.console.warn(fmt(scope, msg), data ?? ""),
  info: (scope: string, msg: string, data?: unknown) =>
    active >= LEVELS.info && ketrics.console.info(fmt(scope, msg), data ?? ""),
  debug: (scope: string, msg: string, data?: unknown) =>
    active >= LEVELS.debug && ketrics.console.debug(fmt(scope, msg), data ?? ""),
};
