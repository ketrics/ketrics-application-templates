/**
 * Ketrics Application Backend - entry point
 *
 * This file is a MANIFEST, not a place for logic. It does two jobs and only
 * two: import handlers from domain files and re-export them. Every name in the
 * "functions" array of ketrics.config.json must appear here, including
 * background handlers prefixed with _.
 *
 * Handlers live in domain files (greeting.ts, notifications.ts, ...) alongside
 * the private helpers they need. Add a new file per feature area rather than
 * growing this one - esbuild bundles the whole src/ tree into a single
 * dist/index.js, so multi-file source costs nothing at runtime.
 *
 * The `ketrics` global object is automatically typed via @ketrics/sdk-backend.
 * No imports needed - just use `ketrics.*` directly:
 *
 * - ketrics.tenant, ketrics.application, ketrics.requestor, ketrics.runtime,
 *   ketrics.environment (context)
 * - ketrics.console (logging to CloudWatch; prefer ./logger, which gates on DEBUG_LEVEL)
 * - ketrics.http (HTTP client for external APIs)
 * - ketrics.DocumentDb.connect(code) (NoSQL document storage)
 * - ketrics.Volume.connect(code) (S3-backed file storage)
 * - ketrics.Database.connect(code) (SQL data connections)
 * - ketrics.Secret.get(code) (encrypted secrets)
 * - ketrics.Parameter.get(code) (shared, unencrypted JSON config)
 * - ketrics.Excel.create() / ketrics.Excel.read(buffer) (Excel workbooks)
 * - ketrics.Pdf.create() / ketrics.Pdf.read(buffer) (PDF documents)
 * - ketrics.Job.runInBackground(params) (background job execution)
 * - ketrics.Messages.send(params) (user messaging)
 * - ketrics.Users.list() (tenant users)
 *
 * Resource codes are never hardcoded: they are read from ketrics.environment
 * through the accessors in ./helpers, using the variables bound by the
 * resources declared in ketrics.config.json.
 *
 * Handlers are guarded with requirePermission() from ./permissions, whose
 * capabilities mirror the "actions" declared in ketrics.config.json.
 */

import { getPermissions } from "./permissions";
import { echo, greet } from "./greeting";
import { notifyMe } from "./notifications";

export {
  // Permissions
  getPermissions,
  // Greeting
  echo,
  greet,
  // Notifications
  notifyMe,
};
