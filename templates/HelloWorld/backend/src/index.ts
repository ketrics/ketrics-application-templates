/**
 * Ketrics Application Backend
 *
 * Exports handler functions compatible with Ketrics Runtime API.
 *
 * The `ketrics` global object is automatically typed via @ketrics/sdk-backend.
 * No imports needed - just use `ketrics.*` directly.
 *
 * Available SDK features:
 * - ketrics.tenant, ketrics.application, ketrics.requestor, ketrics.runtime, ketrics.environment (context)
 * - ketrics.console (logging to CloudWatch)
 * - ketrics.http (HTTP client for external APIs)
 * - ketrics.Volume.connect(code) (S3-backed file storage)
 * - ketrics.Database.connect(code) (external SQL databases)
 * - ketrics.Secret.get(code) (encrypted secrets)
 * - ketrics.Excel.create() / ketrics.Excel.read(buffer) (Excel workbooks)
 * - ketrics.Pdf.create() / ketrics.Pdf.read(buffer) (PDF documents)
 * - ketrics.Job.runInBackground(params) (background job execution)
 * - ketrics.Messages.send(params) (user messaging)
 */

// Volume examples: save, read, list, download URL, copy files
import {
  saveFile,
  readFile,
  listFiles,
  generateDownloadUrl,
  copyFile,
} from "./volumes";

// Database examples: query, insert, transaction
import {
  queryUsers,
  insertRecord,
  transferFunds,
} from "./database";

// PDF examples: create invoice, create report
import {
  createInvoicePdf,
  createSimplePdf,
} from "./pdf";

// Excel examples: create spreadsheet, export data
import {
  createSpreadsheet,
  exportDataToExcel,
} from "./excel";

// Secret management examples
import { getSecret } from "./secrets";

// Messaging examples
import { sendNotification, sendBulkNotification } from "./messages";

// Background job examples
import { scheduleBackgroundJob, getJobStatus } from "./jobs";

// HTTP client examples
import { fetchExternalApi } from "./http";

// ============================================================================
// Basic Handlers
// ============================================================================

/**
 * Echo handler - returns the payload along with full context info.
 * Useful for debugging and verifying SDK access.
 */
const echo = async (payload: unknown) => {
  ketrics.console.log(
    `Echo called by ${ketrics.requestor.type}:${ketrics.requestor.userId || ketrics.requestor.serviceAccountCode}`,
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

export {
  // Basic
  echo,
  info,
  // Volumes
  saveFile,
  readFile,
  listFiles,
  generateDownloadUrl,
  copyFile,
  // Database
  queryUsers,
  insertRecord,
  transferFunds,
  // PDF
  createInvoicePdf,
  createSimplePdf,
  // Excel
  createSpreadsheet,
  exportDataToExcel,
  // Secrets
  getSecret,
  // Messages
  sendNotification,
  sendBulkNotification,
  // Jobs
  scheduleBackgroundJob,
  getJobStatus,
  // HTTP
  fetchExternalApi,
};
