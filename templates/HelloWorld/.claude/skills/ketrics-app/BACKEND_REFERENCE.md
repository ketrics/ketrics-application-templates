# Backend SDK Reference

Complete reference for the `ketrics` global object and backend handler patterns. The `ketrics` object is automatically available in all backend handlers — no imports needed. Types come from `@ketrics/sdk-backend` (devDependency).

## Handler function pattern

Every handler is an async function that takes a typed payload and returns a result. Handlers are exported by name and must match the `actions` array in `ketrics.config.json`.

```typescript
interface MyPayload {
  id: string;
  name: string;
}

const myHandler = async (payload: MyPayload) => {
  requireEditor(); // permission check
  const { id, name } = payload;

  // Validate input
  if (!id) throw new Error("id is required");
  if (!name?.trim()) throw new Error("name is required");

  // Get requestor context
  const userId = ketrics.requestor.userId;
  if (!userId) throw new Error("User context is required");

  // ... handler logic ...

  return { item: { id, name } };
};

export { myHandler };
```

## ketrics.environment

Read application environment variables configured in the Ketrics dashboard.

```typescript
// Simple string value
const apiKey = ketrics.environment["API_KEY"];

// JSON-encoded config
const raw = ketrics.environment["DB_CONNECTIONS"];
const connections: { code: string; name: string }[] = JSON.parse(raw);

// With fallback
const docDbCode = ketrics.environment["DOCDB_CODE"] || "default-store";

// Volume reference
const volumeCode = ketrics.environment["EXPORTS_VOLUME"];
if (!volumeCode) throw new Error("EXPORTS_VOLUME not configured");
```

Common environment variables:
- `DB_CONNECTIONS` — JSON array of `{code, name}` for database connection dropdown
- `DOCDB_*` — DocumentDB resource codes
- `EXPORTS_VOLUME` — Volume code for file exports

## ketrics.requestor

Context about the authenticated user making the request.

```typescript
ketrics.requestor.userId              // string — User ID
ketrics.requestor.name                // string — Display name
ketrics.requestor.email               // string — Email address
ketrics.requestor.applicationPermissions  // string[] — e.g., ["editor"]
```

### Permission checking pattern

```typescript
function requireEditor(): void {
  if (!ketrics.requestor.applicationPermissions.includes("editor")) {
    throw new Error("Permission denied: editor role required");
  }
}

// Usage: call at the start of any handler that modifies data
const createItem = async (payload: CreatePayload) => {
  requireEditor();
  // ...
};
```

## ketrics.Database

Connect to SQL databases configured for the tenant. Supports parameterized queries.

### Connect and query

```typescript
const db = await ketrics.Database.connect(connectionCode);
try {
  const result = await db.query<Record<string, unknown>>(sql, params);
  // result.rows: Record<string, unknown>[]
  // result.rowCount: number
} finally {
  await db.close(); // ALWAYS close in finally block
}
```

### Read-only enforcement

Block DML/DDL keywords to ensure read-only access:

```typescript
const FORBIDDEN_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b/i;

if (FORBIDDEN_KEYWORDS.test(sql)) {
  throw new Error("Only SELECT queries are allowed.");
}
```

### Row limiting

Wrap queries to enforce server-side row limits:

```typescript
const MAX_ROWS = 500;
const limitedSql = `SELECT * FROM (${sql}) AS __limited_result LIMIT ${MAX_ROWS}`;
const result = await db.query<Record<string, unknown>>(limitedSql, params);
```

### Parameterized queries (positional)

Use `$1`, `$2`, etc. for positional parameters:

```typescript
const sql = "SELECT * FROM users WHERE status = $1 AND role = $2";
const params = ["active", "admin"];
const result = await db.query<Record<string, unknown>>(sql, params);
```

### Template parameter replacement

Convert `{{paramName}}` placeholders to positional parameters:

```typescript
// Input: "SELECT * FROM users WHERE status = {{status}}"
// Output: "SELECT * FROM users WHERE status = $1"  with values = ["active"]

let parameterizedSql = rawSql;
const values: unknown[] = [];
let paramIndex = 0;

// Detect all {{paramName}} placeholders
const paramNames: string[] = [];
const regex = /\{\{(\w+)\}\}/g;
let match;
while ((match = regex.exec(parameterizedSql)) !== null) {
  if (!paramNames.includes(match[1])) paramNames.push(match[1]);
}

// Replace each with positional $N
for (const pName of paramNames) {
  paramIndex++;
  parameterizedSql = parameterizedSql.replace(
    new RegExp(`\\{\\{${pName}\\}\\}`, "g"),
    () => `$${paramIndex}`
  );
  values.push(paramValues[pName] ?? "");
}
```

### Identifier parameters (table/column names)

For dynamic table or column names, validate and interpolate directly (cannot use positional params):

```typescript
const VALID_IDENTIFIER = /^[a-zA-Z0-9_.\-]+$/;

if (param.isIdentifier) {
  if (!val || !VALID_IDENTIFIER.test(val)) {
    throw new Error(`Invalid identifier: "${val}"`);
  }
  // Direct string interpolation (safe after validation)
  sql = sql.replace(`{{${paramName}}}`, val);
}
```

### Conditional SQL blocks

Support optional sections in SQL using `{{#if param}}...{{/if}}`:

```typescript
parameterizedSql = parameterizedSql.replace(
  /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
  (_, condParam: string, content: string) => {
    const val = paramValues[condParam];
    return (val != null && val.trim() !== "") ? content : "";
  }
);
```

Example SQL:
```sql
SELECT * FROM orders
WHERE status = {{status}}
{{#if date_from}} AND created_at >= {{date_from}} {{/if}}
{{#if date_to}} AND created_at <= {{date_to}} {{/if}}
```

## ketrics.DocumentDb

NoSQL document store with DynamoDB-style partition key (pk) and sort key (sk).

### Connect

```typescript
const docdb = await ketrics.DocumentDb.connect(resourceCode);
// resourceCode matches the "code" in ketrics.config.json resources.documentdb
```

### Put (create or overwrite)

```typescript
const item: Record<string, unknown> = {
  id: crypto.randomUUID(),
  name: "My Item",
  createdBy: userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await docdb.put(`USER#${userId}`, `ITEM#${item.id}`, item);
```

### Get (single item)

```typescript
const item = await docdb.get(`USER#${userId}`, `ITEM#${itemId}`);
if (!item) throw new Error("Not found");
```

### List (query by pk with optional sk prefix)

```typescript
const result = await docdb.list(`USER#${userId}`, {
  skPrefix: "ITEM#",        // Filter by sort key prefix
  scanForward: false,        // Reverse chronological order
  limit: 100,                // Max items to return
});
// result.items: Record<string, unknown>[]
```

### Delete

```typescript
await docdb.delete(`USER#${userId}`, `ITEM#${itemId}`);
```

### Key design patterns

Design composite keys with prefixes for multi-entity storage in a single DocumentDB:

**User-scoped items (each user owns their items):**
```typescript
pk = `USER#${userId}`
sk = `ITEM#${itemId}`
```

**Tenant-wide items (shared across all users):**
```typescript
pk = `TENANT_ITEMS`
sk = `ITEM#${itemId}`
```

**Comments on a target entity:**
```typescript
pk = `COMMENTS#${connectionCode}#${targetKey}`
sk = `COMMENT#${createdAt}#${commentId}`
// Using createdAt in sk gives chronological ordering
```

**Count index for fast lookups:**
```typescript
pk = `INDEX#${scope}`
sk = `KEY#${lookupKey}`
// Store: { lookupKey, count: N, lastUpdatedAt }
```

### CRUD handler template

```typescript
// CREATE
const createItem = async (payload: CreatePayload) => {
  requireEditor();
  const { name } = payload;
  if (!name?.trim()) throw new Error("name is required");

  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const itemId = crypto.randomUUID();
  const now = new Date().toISOString();

  const item = { id: itemId, name: name.trim(), createdBy: userId, createdAt: now, updatedAt: now };
  await docdb.put(`USER#${userId}`, `ITEM#${itemId}`, item);
  return { item };
};

// READ (single)
const getItem = async (payload: { id: string }) => {
  const { id } = payload;
  if (!id) throw new Error("id is required");

  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const item = await docdb.get(`USER#${userId}`, `ITEM#${id}`);
  if (!item) throw new Error("Not found");
  if (item.createdBy !== userId) throw new Error("Access denied");
  return { item };
};

// READ (list)
const listItems = async () => {
  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const result = await docdb.list(`USER#${userId}`, { skPrefix: "ITEM#", scanForward: false });
  return { items: result.items };
};

// UPDATE
const updateItem = async (payload: UpdatePayload) => {
  requireEditor();
  const { id, name } = payload;
  if (!id) throw new Error("id is required");

  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const pk = `USER#${userId}`;
  const sk = `ITEM#${id}`;

  const existing = await docdb.get(pk, sk);
  if (!existing) throw new Error("Not found");
  if (existing.createdBy !== userId) throw new Error("You can only update your own items");

  const item = { ...existing, name: name.trim(), updatedAt: new Date().toISOString() };
  await docdb.put(pk, sk, item);
  return { item };
};

// DELETE
const deleteItem = async (payload: { id: string }) => {
  requireEditor();
  const { id } = payload;
  if (!id) throw new Error("id is required");

  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const pk = `USER#${userId}`;
  const sk = `ITEM#${id}`;

  const existing = await docdb.get(pk, sk);
  if (!existing) throw new Error("Not found");
  if (existing.createdBy !== userId) throw new Error("You can only delete your own items");

  await docdb.delete(pk, sk);
  return { success: true };
};
```

## ketrics.Excel

Create Excel workbooks in memory.

```typescript
const excel = ketrics.Excel.create();
const sheet = excel.addWorksheet("Sheet Name");

// Set columns with headers and widths
sheet.columns = [
  { header: "Name", key: "name", width: 20 },
  { header: "Email", key: "email", width: 30 },
  { header: "Status", key: "status", width: 15 },
];

// Add rows (array of arrays, matching column order)
sheet.addRows(
  data.map(row => [row.name, row.email, row.status])
);

// Get buffer for saving to Volume
const buffer = await excel.toBuffer();
```

### Dynamic column widths

```typescript
sheet.columns = columns.map(col => ({
  header: col,
  key: col,
  width: Math.max(12, col.length + 4),
}));
```

## ketrics.Volume

File storage with presigned download URLs.

```typescript
const volume = await ketrics.Volume.connect(volumeCode);

// Upload a file
const fileKey = `${ketrics.application.id}/${filename}`;
await volume.put(fileKey, buffer);

// Generate download URL
const presigned = await volume.generateDownloadUrl(fileKey);
// presigned.url — time-limited download URL
```

### Complete export pattern (Excel + Volume)

```typescript
const exportData = async (payload: { data: Record<string, unknown>[] }) => {
  requireEditor();
  const { data } = payload;
  if (!data?.length) throw new Error("No data to export");

  const volumeCode = ketrics.environment["EXPORTS_VOLUME"];
  if (!volumeCode) throw new Error("EXPORTS_VOLUME not configured");

  const columns = Object.keys(data[0]);

  // Build Excel
  const excel = ketrics.Excel.create();
  const sheet = excel.addWorksheet("Export");
  sheet.columns = columns.map(col => ({
    header: col,
    key: col,
    width: Math.max(12, col.length + 4),
  }));
  sheet.addRows(data.map(row => columns.map(col => row[col] ?? "")));
  const buffer = await excel.toBuffer();

  // Save to Volume
  const filename = `export_${Date.now()}.xlsx`;
  const fileKey = `${ketrics.application.id}/${filename}`;
  const volume = await ketrics.Volume.connect(volumeCode);
  await volume.put(fileKey, buffer);
  const { url } = await volume.generateDownloadUrl(fileKey);

  return { url, filename };
};
```

## ketrics.Messages

Send notifications to users in the tenant.

```typescript
// Bulk send to specific users
await ketrics.Messages.sendBulk({
  userIds: ["user-id-1", "user-id-2"],
  type: "CUSTOM_EVENT_TYPE",
  subject: "Notification subject",
  body: "**Markdown** content is supported in the body.",
  priority: "MEDIUM",  // "LOW" | "MEDIUM" | "HIGH"
});
```

### Notification on share pattern

```typescript
if (visibility === "shared" && Array.isArray(sharedWith) && sharedWith.length > 0) {
  const senderName = ketrics.requestor.name || ketrics.requestor.email;
  try {
    await ketrics.Messages.sendBulk({
      userIds: sharedWith,
      type: "RESOURCE_SHARED",
      subject: `${senderName} shared a resource with you`,
      body: `**${senderName}** shared **${resourceName}** with you.`,
      priority: "MEDIUM",
    });
  } catch {
    // Non-critical — don't fail the main operation
    ketrics.console.error("Failed to send share notifications");
  }
}
```

## ketrics.Users

List users in the current tenant.

```typescript
const tenantUsers = await ketrics.Users.list();
// Returns: { id: string, firstName: string, lastName: string, email: string }[]

const users = tenantUsers.map(user => ({
  userId: user.id,
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
}));
```

## ketrics.application

```typescript
ketrics.application.id  // Application UUID, useful for namespacing Volume file keys
```

## ketrics.console

```typescript
ketrics.console.error("Error message for logs");
```

Use for non-critical errors where you don't want to throw and fail the handler.

## Comment system pattern

A full comment system using DocumentDB with a count index for efficient lookups.

### Add comment

```typescript
const addComment = async (payload: { targetId: string; text: string }) => {
  const { targetId, text } = payload;
  if (!targetId) throw new Error("targetId is required");
  if (!text?.trim()) throw new Error("text is required");

  const userId = ketrics.requestor.userId;
  const userName = ketrics.requestor.name || ketrics.requestor.email || userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const commentId = crypto.randomUUID();
  const now = new Date().toISOString();

  const comment = {
    commentId,
    text: text.trim(),
    targetId,
    createdBy: userId,
    createdByName: userName,
    createdAt: now,
  };

  // Store comment (chronologically sorted by sk)
  await docdb.put(
    `COMMENTS#${targetId}`,
    `COMMENT#${now}#${commentId}`,
    comment as Record<string, unknown>
  );

  // Update count index
  const indexPk = `COMMENTINDEX#main`;
  const indexSk = `TARGET#${targetId}`;
  const existing = await docdb.get(indexPk, indexSk);
  const count = existing ? (existing.count as number) || 0 : 0;
  await docdb.put(indexPk, indexSk, { targetId, count: count + 1, lastCommentAt: now });

  return { comment };
};
```

### List comments

```typescript
const getComments = async (payload: { targetId: string }) => {
  const { targetId } = payload;
  if (!targetId) throw new Error("targetId is required");

  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const result = await docdb.list(`COMMENTS#${targetId}`, {
    skPrefix: "COMMENT#",
    scanForward: false,  // Newest first
  });

  return { comments: result.items };
};
```

### Get comment counts (batch)

```typescript
const getCommentCounts = async (payload: { targetIds: string[] }) => {
  const { targetIds } = payload;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const result = await docdb.list(`COMMENTINDEX#main`, {
    skPrefix: "TARGET#",
    limit: 1000,
  });

  const counts: Record<string, number> = {};
  const requested = new Set(targetIds || []);
  for (const item of result.items) {
    const key = item.targetId as string;
    if (key && (requested.size === 0 || requested.has(key))) {
      counts[key] = (item.count as number) || 0;
    }
  }
  return { counts };
};
```

### Delete comment (with index update)

```typescript
const deleteComment = async (payload: { targetId: string; commentId: string; createdAt: string }) => {
  const { targetId, commentId, createdAt } = payload;
  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());

  const pk = `COMMENTS#${targetId}`;
  const sk = `COMMENT#${createdAt}#${commentId}`;

  const existing = await docdb.get(pk, sk);
  if (!existing) throw new Error("Comment not found");
  if (existing.createdBy !== userId) throw new Error("You can only delete your own comments");

  await docdb.delete(pk, sk);

  // Decrement count index
  const indexPk = `COMMENTINDEX#main`;
  const indexSk = `TARGET#${targetId}`;
  const indexItem = await docdb.get(indexPk, indexSk);
  if (indexItem) {
    const count = (indexItem.count as number) || 0;
    if (count <= 1) {
      await docdb.delete(indexPk, indexSk);
    } else {
      await docdb.put(indexPk, indexSk, { targetId, count: count - 1, lastCommentAt: indexItem.lastCommentAt });
    }
  }

  return { success: true };
};
```

## Sharing and access control pattern

For resources that can be shared between users:

```typescript
interface SharedResource {
  id: string;
  owner: string;
  visibility: "private" | "shared";
  sharedWith: string[] | "all";
  // ... other fields
}

// Share handler
const shareResource = async (payload: { id: string; visibility: "private" | "shared"; sharedWith: string[] | "all" }) => {
  requireEditor();
  const { id, visibility, sharedWith } = payload;
  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());

  const existing = await docdb.get("TENANT_RESOURCES", `RESOURCE#${id}`);
  if (!existing) throw new Error("Not found");
  if (existing.owner !== userId) throw new Error("Only the owner can share");

  await docdb.put("TENANT_RESOURCES", `RESOURCE#${id}`, {
    ...existing,
    visibility: visibility || "private",
    sharedWith: sharedWith || [],
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
};

// Access check helper
function checkAccess(item: Record<string, unknown>, userId: string): void {
  if (item.owner === userId) return;
  if (item.visibility !== "shared") throw new Error("Access denied");
  const sw = item.sharedWith;
  if (sw === "all") return;
  if (Array.isArray(sw) && sw.includes(userId)) return;
  throw new Error("Access denied");
}

// List with visibility filter
const listResources = async () => {
  const userId = ketrics.requestor.userId;
  const docdb = await ketrics.DocumentDb.connect(getDocDbCode());
  const result = await docdb.list("TENANT_RESOURCES", { skPrefix: "RESOURCE#", scanForward: false });

  const resources = result.items.filter(item => {
    if (item.owner === userId) return true;
    if (item.visibility !== "shared") return false;
    const sw = item.sharedWith;
    if (sw === "all") return true;
    if (Array.isArray(sw) && sw.includes(userId)) return true;
    return false;
  });

  return { resources };
};
```
