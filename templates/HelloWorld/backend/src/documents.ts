/**
 * DocumentDB Examples
 *
 * Demonstrates NoSQL document storage using ketrics.DocumentDb - a DynamoDB
 * style pk/sk model with put, get, list, delete and cursor pagination.
 *
 * The resource code comes from APP_DATA_DOCDB, the variable derived from the
 * resources.documentdb "app-data" declaration in ketrics.config.json.
 *
 * Key design used here:
 *
 *   | Entity        | pk                  | sk              |
 *   | ------------- | ------------------- | --------------- |
 *   | Tenant note   | TENANT_NOTES        | NOTE#${id}      |
 *   | User's note   | USER#${userId}      | NOTE#${id}      |
 *
 * Prefixed composite keys let one DocumentDB hold several entity types while
 * keeping each list() query cheap.
 */

import { appDataDocDbCode } from "./helpers";
import { log } from "./logger";
import { requirePermission } from "./permissions";
import { Note } from "./types";

const NOTES_PK = "TENANT_NOTES";
const NOTE_SK = (id: string) => `NOTE#${id}`;

/** Create a note. */
const createDocument = async (payload: { title: string; body?: string }) => {
  requirePermission("write");

  if (!payload?.title?.trim()) throw new Error("title is required");

  const userId = ketrics.requestor.userId;
  if (!userId) throw new Error("User context is required");

  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    title: payload.title.trim(),
    body: payload.body?.trim() || "",
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };

  const docdb = await ketrics.DocumentDb.connect(appDataDocDbCode());
  await docdb.put(NOTES_PK, NOTE_SK(note.id), note as unknown as Record<string, unknown>);

  log.debug("createDocument", `wrote ${NOTES_PK}/${NOTE_SK(note.id)}`);

  return { note };
};

/** Read one note by id. */
const getDocument = async (payload: { id: string }) => {
  requirePermission("read");

  if (!payload?.id) throw new Error("id is required");

  const docdb = await ketrics.DocumentDb.connect(appDataDocDbCode());
  const item = await docdb.get(NOTES_PK, NOTE_SK(payload.id));

  if (!item) throw new Error("Note not found");

  return { note: item as unknown as Note };
};

/**
 * List notes, one page at a time. Pass the cursor from a previous response to
 * fetch the next page.
 */
const listDocuments = async (payload: { limit?: number; cursor?: string }) => {
  requirePermission("read");

  const docdb = await ketrics.DocumentDb.connect(appDataDocDbCode());
  const result = await docdb.list(NOTES_PK, {
    skPrefix: "NOTE#",
    limit: payload?.limit || 50,
    cursor: payload?.cursor,
  });

  log.info("listDocuments", `returned ${result.items.length} note(s)`);

  return {
    notes: result.items as unknown as Note[],
    cursor: result.cursor,
  };
};

/**
 * Update a note. Ownership is verified first: a user may only modify what they
 * created, regardless of the capability their role grants.
 */
const updateDocument = async (payload: { id: string; title?: string; body?: string }) => {
  requirePermission("write");

  if (!payload?.id) throw new Error("id is required");

  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(appDataDocDbCode());
  const existing = (await docdb.get(NOTES_PK, NOTE_SK(payload.id))) as unknown as Note | null;

  if (!existing) throw new Error("Note not found");
  if (existing.createdBy !== userId) {
    throw new Error("You can only modify your own notes");
  }

  const updated: Note = {
    ...existing,
    title: payload.title?.trim() || existing.title,
    body: payload.body?.trim() ?? existing.body,
    updatedAt: new Date().toISOString(),
  };

  await docdb.put(NOTES_PK, NOTE_SK(updated.id), updated as unknown as Record<string, unknown>);

  return { note: updated };
};

/** Delete a note, subject to the same ownership check. */
const deleteDocument = async (payload: { id: string }) => {
  requirePermission("write");

  if (!payload?.id) throw new Error("id is required");

  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(appDataDocDbCode());
  const existing = (await docdb.get(NOTES_PK, NOTE_SK(payload.id))) as unknown as Note | null;

  if (!existing) throw new Error("Note not found");
  if (existing.createdBy !== userId) {
    throw new Error("You can only delete your own notes");
  }

  await docdb.delete(NOTES_PK, NOTE_SK(payload.id));
  log.debug("deleteDocument", `deleted ${NOTES_PK}/${NOTE_SK(payload.id)}`);

  return { deleted: true, id: payload.id };
};

export { createDocument, getDocument, listDocuments, updateDocument, deleteDocument };
