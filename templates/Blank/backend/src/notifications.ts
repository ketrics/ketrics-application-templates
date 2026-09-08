/**
 * Notifications domain
 *
 * A second domain file, to show the split. Its handler is guarded with "write"
 * so both capabilities this app declares are actually enforced by code - a
 * capability no handler checks grants nothing and is just decoration in the
 * role picker.
 */

import { log } from "./logger";
import { requirePermission } from "./permissions";
import { NotifyPayload } from "./types";

/**
 * Send a notification to the current user's Ketrics inbox.
 * Messaging needs no declared resource, which keeps this template free of
 * mandatory empty rows in the tenant's portal.
 */
export const notifyMe = async (payload: NotifyPayload) => {
  requirePermission("write");

  const userId = ketrics.requestor.userId;
  if (!userId) throw new Error("This function can only be called by a user");

  const result = await ketrics.Messages.send({
    userId,
    type: "notification",
    subject: payload?.subject?.trim() || "Hello from your app!",
    body: payload?.body?.trim() || `This notification was sent by **${ketrics.application.name}**.`,
    priority: "MEDIUM",
    channels: { inbox: true, push: false },
  });

  log.info("notifyMe", `sent message ${result.messageId}`);

  return { messageId: result.messageId, status: result.status };
};
