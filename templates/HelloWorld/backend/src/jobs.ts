/**
 * Background Job Examples
 *
 * Demonstrates scheduling and monitoring background jobs using ketrics.Job.
 * Background jobs run asynchronously and can have longer timeouts (up to 15 minutes).
 */

/**
 * Schedule a function to run in the background.
 */
const scheduleBackgroundJob = async (payload: {
  functionName?: string;
  data?: Record<string, unknown>;
}) => {
  const jobId = await ketrics.Job.runInBackground({
    function: payload?.functionName || "echo",
    payload: payload?.data || { source: "background-job" },
    options: {
      timeout: 60000, // 1 minute timeout
    },
  });

  return { jobId, status: "scheduled" };
};

/**
 * Check the status of a background job.
 */
const getJobStatus = async (payload: { jobId: string }) => {
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

export { scheduleBackgroundJob, getJobStatus };
