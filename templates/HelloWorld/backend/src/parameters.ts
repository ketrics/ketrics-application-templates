/**
 * Parameter Examples
 *
 * Demonstrates shared, UNENCRYPTED JSON configuration using ketrics.Parameter -
 * the non-secret twin of ketrics.Secret. A parameter is a tenant-level JSON
 * object several applications can read, so settings that would otherwise be
 * copied into each app's environment live in one place.
 *
 * Requires @ketrics/sdk-backend >= 0.17.0 (that release added the typings) and
 * a CLI >= 0.14.0 (older CLIs reject the "parameter" resource kind).
 *
 * Environment variable, or Parameter?
 *   - environment: a single string, private to this app (threshold, base URL,
 *     feature flag, and every resource code).
 *   - Parameter: a JSON object owned by the tenant and read by several apps
 *     (chart of accounts, tax tables, a company registry).
 *   - Secret: anything that is a credential. Parameter values are stored in
 *     PLAINTEXT and are readable by anyone holding parameter:DescribeParameter
 *     for a matching pattern - never put API keys or tokens in one.
 */

import { appSettingsParameterCode } from "./helpers";
import { log } from "./logger";
import { requirePermission } from "./permissions";
import { AppSettings } from "./types";

/** Used when the tenant has not created the optional parameter yet. */
const DEFAULT_SETTINGS: AppSettings = {
  currency: "USD",
  taxRate: 0,
  paymentTerms: [{ code: "NET30", days: 30 }],
};

/**
 * Read shared configuration from a Parameter.
 *
 * get() returns the value already parsed - no JSON.parse at the call site - and
 * type it with the generic. The result is deep-frozen and memoized for the
 * invocation, so reading it in five helpers costs one lookup; copy before
 * changing anything locally.
 */
const getAppSettings = async () => {
  requirePermission("read");

  try {
    const settings = await ketrics.Parameter.get<AppSettings>(appSettingsParameterCode());

    log.debug("getAppSettings", `loaded settings (currency=${settings.currency})`);

    return { settings, source: "parameter" as const };
  } catch (error) {
    if (error instanceof ketrics.Parameter.NotFoundError) {
      throw new Error("Application settings have not been created for this tenant");
    }
    if (error instanceof ketrics.Parameter.AccessDeniedError) {
      throw new Error(
        "This application is not granted access to the settings parameter — declare it under resources.parameter and redeploy",
      );
    }
    throw error;
  }
};

/**
 * Read the same parameter as genuinely optional configuration.
 *
 * exists() answers without throwing. It returns false both when the parameter
 * does not exist and when the app has no grant for it — the two are
 * deliberately indistinguishable, so an app cannot probe for codes outside its
 * own scope.
 */
const getOptionalAppSettings = async () => {
  requirePermission("read");

  const code = appSettingsParameterCode();

  if (!(await ketrics.Parameter.exists(code))) {
    log.warn("getOptionalAppSettings", "parameter missing or not granted; using defaults");
    return { settings: DEFAULT_SETTINGS, source: "defaults" as const };
  }

  const settings = await ketrics.Parameter.get<AppSettings>(code);
  return { settings, source: "parameter" as const };
};

export { getAppSettings, getOptionalAppSettings };
