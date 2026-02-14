import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

type GlobalWithPgPool = typeof globalThis & {
  __pgPool?: Pool;
};

const globalWithPgPool = globalThis as GlobalWithPgPool;

const pool =
  globalWithPgPool.__pgPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false }
  });

if (process.env.NODE_ENV !== "production") {
  globalWithPgPool.__pgPool = pool;
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    })();
  }

  await schemaReady;
}

export type TodoRecord = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

function toTodoRecord(row: Record<string, unknown>): TodoRecord {
  return {
    id: Number(row.id),
    title: String(row.title),
    completed: Boolean(row.completed),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export async function listTodos(): Promise<TodoRecord[]> {
  await ensureSchema();
  const result = await pool.query(
    `
      SELECT id, title, completed, created_at, updated_at
      FROM todos
      ORDER BY created_at DESC;
    `
  );
  return result.rows.map((row) => toTodoRecord(row as Record<string, unknown>));
}

export async function createTodo(title: string): Promise<TodoRecord> {
  await ensureSchema();
  const trimmed = title.trim();

  if (!trimmed) {
    throw new Error("Todo title is required.");
  }

  const result = await pool.query(
    `
      INSERT INTO todos (title)
      VALUES ($1)
      RETURNING id, title, completed, created_at, updated_at;
    `,
    [trimmed]
  );

  return toTodoRecord(result.rows[0] as Record<string, unknown>);
}

export async function updateTodo(
  id: number,
  patch: { title?: string; completed?: boolean }
): Promise<TodoRecord | null> {
  await ensureSchema();

  const existingResult = await pool.query(
    `
      SELECT id, title, completed, created_at, updated_at
      FROM todos
      WHERE id = $1
      LIMIT 1;
    `,
    [id]
  );

  if (!existingResult.rows[0]) {
    return null;
  }

  const existing = toTodoRecord(existingResult.rows[0] as Record<string, unknown>);
  const nextTitle = patch.title !== undefined ? patch.title.trim() : existing.title;
  const nextCompleted =
    patch.completed !== undefined ? patch.completed : existing.completed;

  if (!nextTitle) {
    throw new Error("Todo title cannot be empty.");
  }

  const result = await pool.query(
    `
      UPDATE todos
      SET title = $1,
          completed = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, title, completed, created_at, updated_at;
    `,
    [nextTitle, nextCompleted, id]
  );

  return result.rows[0]
    ? toTodoRecord(result.rows[0] as Record<string, unknown>)
    : null;
}

export async function deleteTodo(id: number): Promise<TodoRecord | null> {
  await ensureSchema();
  const result = await pool.query(
    `
      DELETE FROM todos
      WHERE id = $1
      RETURNING id, title, completed, created_at, updated_at;
    `,
    [id]
  );

  return result.rows[0]
    ? toTodoRecord(result.rows[0] as Record<string, unknown>)
    : null;
}

export async function createManyTodos(titles: string[]): Promise<TodoRecord[]> {
  await ensureSchema();
  const created: TodoRecord[] = [];

  for (const title of titles) {
    const trimmed = title.trim();
    if (!trimmed) {
      continue;
    }
    const todo = await createTodo(trimmed);
    created.push(todo);
  }

  return created;
}
