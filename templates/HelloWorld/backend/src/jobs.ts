/**
 * Background Job Examples
 *
 * Demonstrates scheduling and monitoring background jobs using ketrics.Job.
 * Background jobs run asynchronously and can have longer timeouts (up to 15
 * minutes).
 *
 * Background handlers are prefixed with _ by convention: they are invoked by
 * the platform, not by the frontend. They still have to be listed in the
 * "functions" array of ketrics.config.json and re-exported from index.ts, or
 * the platform cannot call them.
 */

import { log } from "./logger";
import { requirePermission } from "./permissions";
import { BackgroundJobPayload } from "./types";

/**
 * Schedule a function to run in the background.
 * Store the returned jobId to track progress with getJobStatus.
 */
const scheduleBackgroundJob = async (payload: {
  functionName?: string;
  data?: Record<string, unknown>;
}) => {
  requirePermission("write");

  const jobId = await ketrics.Job.runInBackground({
    function: payload?.functionName || "_processInBackground",
    payload: payload?.data || { source: "background-job" },
    options: {
      timeout: 60000, // 1 minute timeout
    },
  });

  log.info("scheduleBackgroundJob", `queued job ${jobId}`);

  return { jobId, status: "scheduled" };
};

/**
 * Check the status of a background job.
 */
const getJobStatus = async (payload: { jobId: string }) => {
  requirePermission("read");

  if (!payload?.jobId) {
    throw new Error("jobId is required");
  }

  const status = await ketrics.Job.getStatus(payload.jobId);

  return {
    jobId: status.jobId,
    functionName: status.functionName,
    status: status.status,
    createdAt: status.createdAt,
    startedAt: status.startedAt,
    completedAt: status.completedAt,
    error: status.error,
  };
};

/**
 * Background handler - runs asynchronously, invoked by the platform.
 *
 * It does NOT call requirePermission: there is no interactive requestor behind
 * it. Guard the handler that schedules the job instead.
 *
 * Errors are caught and logged rather than thrown, because nothing is waiting
 * on the result: an unhandled throw here disappears into the job record. Log at
 * the boundaries so a silent failure is visible in CloudWatch.
 */
const _processInBackground = async (payload: BackgroundJobPayload) => {
  log.info("_processInBackground", `started (source=${payload?.source ?? "unknown"})`);

  try {
    // ... long-running work goes here ...
    await new Promise((resolve) => setTimeout(resolve, 100));

    log.info("_processInBackground", "completed");
    return { processed: true, noteId: payload?.noteId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("_processInBackground", `failed: ${message}`);
    return { processed: false, error: message };
  }
};

export { scheduleBackgroundJob, getJobStatus, _processInBackground };
