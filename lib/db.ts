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

export async function listTodos() {
  await ensureSchema();
  return sql<TodoRecord[]>`
    SELECT id, title, completed, created_at, updated_at
    FROM todos
    ORDER BY created_at DESC;
  `;
}

export async function createTodo(title: string) {
  await ensureSchema();
  const trimmed = title.trim();

  if (!trimmed) {
    throw new Error("Todo title is required.");
  }

  const rows = await sql<TodoRecord[]>`
    INSERT INTO todos (title)
    VALUES (${trimmed})
    RETURNING id, title, completed, created_at, updated_at;
  `;

  return rows[0];
}

export async function updateTodo(
  id: number,
  patch: { title?: string; completed?: boolean }
) {
  await ensureSchema();

  const existing = await sql<TodoRecord[]>`
    SELECT id, title, completed, created_at, updated_at
    FROM todos
    WHERE id = ${id}
    LIMIT 1;
  `;

  if (!existing[0]) {
    return null;
  }

  const nextTitle =
    patch.title !== undefined ? patch.title.trim() : existing[0].title;
  const nextCompleted =
    patch.completed !== undefined ? patch.completed : existing[0].completed;

  if (!nextTitle) {
    throw new Error("Todo title cannot be empty.");
  }

  const rows = await sql<TodoRecord[]>`
    UPDATE todos
    SET title = ${nextTitle},
        completed = ${nextCompleted},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, title, completed, created_at, updated_at;
  `;

  return rows[0];
}

export async function deleteTodo(id: number) {
  await ensureSchema();
  const rows = await sql<TodoRecord[]>`
    DELETE FROM todos
    WHERE id = ${id}
    RETURNING id, title, completed, created_at, updated_at;
  `;

  return rows[0] ?? null;
}
