import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const sql = neon(databaseUrl);

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
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
  const rows = await sql`
    SELECT id, title, completed, created_at, updated_at
    FROM todos
    ORDER BY created_at DESC;
  `;
  return rows.map(toTodoRecord);
}

export async function createTodo(title: string): Promise<TodoRecord> {
  await ensureSchema();
  const trimmed = title.trim();

  if (!trimmed) {
    throw new Error("Todo title is required.");
  }

  const rows = await sql`
    INSERT INTO todos (title)
    VALUES (${trimmed})
    RETURNING id, title, completed, created_at, updated_at;
  `;

  return toTodoRecord(rows[0]);
}

export async function updateTodo(
  id: number,
  patch: { title?: string; completed?: boolean }
): Promise<TodoRecord | null> {
  await ensureSchema();

  const existingRows = await sql`
    SELECT id, title, completed, created_at, updated_at
    FROM todos
    WHERE id = ${id}
    LIMIT 1;
  `;

  if (!existingRows[0]) {
    return null;
  }
  const existing = toTodoRecord(existingRows[0]);

  const nextTitle =
    patch.title !== undefined ? patch.title.trim() : existing.title;
  const nextCompleted =
    patch.completed !== undefined ? patch.completed : existing.completed;

  if (!nextTitle) {
    throw new Error("Todo title cannot be empty.");
  }

  const rows = await sql`
    UPDATE todos
    SET title = ${nextTitle},
        completed = ${nextCompleted},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, title, completed, created_at, updated_at;
  `;

  return rows[0] ? toTodoRecord(rows[0]) : null;
}

export async function deleteTodo(id: number): Promise<TodoRecord | null> {
  await ensureSchema();
  const rows = await sql`
    DELETE FROM todos
    WHERE id = ${id}
    RETURNING id, title, completed, created_at, updated_at;
  `;

  return rows[0] ? toTodoRecord(rows[0]) : null;
}
