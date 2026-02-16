/**
 * Database Examples
 *
 * Demonstrates external SQL database operations using ketrics.Database.
 * Data connections must be configured and granted to the application in the Ketrics portal.
 *
 * Supports PostgreSQL, MySQL, SQL Server, and Oracle databases.
 */

/**
 * Query records from a database.
 */
const queryUsers = async (payload: { limit?: number }) => {
  const db = await ketrics.Database.connect("my-database");

  try {
    const result = await db.query<{ id: number; name: string; email: string }>(
      "SELECT id, name, email FROM users ORDER BY name LIMIT $1",
      [payload?.limit || 10],
    );

    return {
      users: result.rows,
      rowCount: result.rowCount,
    };
  } finally {
    await db.close();
  }
};

/**
 * Insert a record into a database.
 */
const insertRecord = async (payload: { name: string; email: string }) => {
  if (!payload?.name || !payload?.email) {
    throw new Error("name and email are required");
  }

  const db = await ketrics.Database.connect("my-database");

  try {
    const result = await db.execute(
      "INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW())",
      [payload.name, payload.email],
    );

    return {
      affectedRows: result.affectedRows,
      insertId: result.insertId,
    };
  } finally {
    await db.close();
  }
};

/**
 * Perform a database transaction - demonstrates atomic multi-step operations.
 * Transactions automatically commit on success or rollback on error.
 */
const transferFunds = async (payload: {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
}) => {
  if (!payload?.fromAccountId || !payload?.toAccountId || !payload?.amount) {
    throw new Error("fromAccountId, toAccountId, and amount are required");
  }

  if (payload.amount <= 0) {
    throw new Error("Amount must be positive");
  }

  const db = await ketrics.Database.connect("my-database");

  try {
    const result = await db.transaction(async (tx) => {
      // Debit source account
      const debit = await tx.execute(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1",
        [payload.amount, payload.fromAccountId],
      );

      if (debit.affectedRows === 0) {
        throw new Error("Insufficient funds or account not found");
      }

      // Credit destination account
      await tx.execute(
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        [payload.amount, payload.toAccountId],
      );

      // Log the transfer
      await tx.execute(
        "INSERT INTO transfers (from_account, to_account, amount, created_at) VALUES ($1, $2, $3, NOW())",
        [payload.fromAccountId, payload.toAccountId, payload.amount],
      );

      return { transferred: payload.amount };
    });

    return result;
  } finally {
    await db.close();
  }
};

export { queryUsers, insertRecord, transferFunds };
