/**
 * Messages Examples
 *
 * Demonstrates sending notifications to users via ketrics.Messages.
 * Messages appear in the user's inbox within the Ketrics portal.
 */

/**
 * Send a notification to the current user.
 */
const sendNotification = async (payload: { subject?: string; body?: string }) => {
  if (ketrics.requestor.type !== "USER") {
    throw new Error("This function can only be called by a user");
  }

  const result = await ketrics.Messages.send({
    userId: ketrics.requestor.userId!,
    type: "notification",
    subject: payload?.subject || "Hello from your app!",
    body: payload?.body || `This notification was sent by **${ketrics.application.name}**.`,
    priority: "MEDIUM",
    channels: { inbox: true, push: false },
  });

  return {
    messageId: result.messageId,
    status: result.status,
  };
};

/**
 * Send a notification to multiple users.
 */
const sendBulkNotification = async (payload: {
  userIds: string[];
  subject: string;
  body: string;
}) => {
  if (!payload?.userIds?.length) {
    throw new Error("userIds array is required");
  }

  const result = await ketrics.Messages.sendBulk({
    userIds: payload.userIds,
    type: "announcement",
    subject: payload.subject,
    body: payload.body,
    priority: "HIGH",
    channels: { inbox: true, push: true },
  });

  return {
    total: result.total,
    sent: result.sent,
    failed: result.failed,
  };
};

export { sendNotification, sendBulkNotification };
