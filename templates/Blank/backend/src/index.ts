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

export { echo };
