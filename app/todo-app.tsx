"use client";

import { FormEvent, useMemo, useState } from "react";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

type Filter = "all" | "active" | "completed";

export function TodoApp({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filteredTodos = useMemo(() => {
    if (filter === "active") {
      return todos.filter((todo) => !todo.completed);
    }
    if (filter === "completed") {
      return todos.filter((todo) => todo.completed);
    }
    return todos;
  }, [filter, todos]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;

  async function createTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to add todo.");

      setTodos((current) => [payload.todo, ...current]);
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  async function updateTodo(id: number, patch: Partial<Pick<Todo, "title" | "completed">>) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to update todo.");

      setTodos((current) =>
        current.map((todo) => (todo.id === id ? payload.todo : todo))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  async function removeTodo(id: number) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE"
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to delete todo.");

      setTodos((current) => current.filter((todo) => todo.id !== payload.todo.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }

  async function saveEdit(id: number) {
    if (!editingTitle.trim()) {
      setError("Todo title cannot be empty.");
      return;
    }

    await updateTodo(id, { title: editingTitle });
    setEditingId(null);
    setEditingTitle("");
  }

  return (
    <div className="panel">
      <h1 className="title">Migration Test Todo App</h1>
      <p className="subtitle">Next.js + Neon Postgres, ready for Vercel deploy.</p>

      <form className="row" onSubmit={createTodo}>
        <input
          type="text"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a new task..."
          disabled={busy}
          maxLength={140}
        />
        <button className="btn-primary" disabled={busy} type="submit">
          Add Todo
        </button>
      </form>

      <div className="row">
        <button
          className={filter === "all" ? "btn-primary" : "btn-muted"}
          onClick={() => setFilter("all")}
          type="button"
        >
          All
        </button>
        <button
          className={filter === "active" ? "btn-primary" : "btn-muted"}
          onClick={() => setFilter("active")}
          type="button"
        >
          Active
        </button>
        <button
          className={filter === "completed" ? "btn-primary" : "btn-muted"}
          onClick={() => setFilter("completed")}
          type="button"
        >
          Completed
        </button>
      </div>

      <p className="status">
        {busy ? "Saving changes..." : "Connected to Neon through Next.js API routes."}
      </p>
      {error ? <p className="error">{error}</p> : null}

      <ul className="list">
        {filteredTodos.map((todo) => (
          <li className={`item ${todo.completed ? "is-completed" : ""}`} key={todo.id}>
            <input
              aria-label={`Mark ${todo.title} as complete`}
              checked={todo.completed}
              onChange={(event) => updateTodo(todo.id, { completed: event.target.checked })}
              type="checkbox"
            />

            {editingId === todo.id ? (
              <input
                autoFocus
                type="text"
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void saveEdit(todo.id);
                  }
                  if (event.key === "Escape") {
                    setEditingId(null);
                    setEditingTitle("");
                  }
                }}
                maxLength={140}
              />
            ) : (
              <span className="todo-title">{todo.title}</span>
            )}

            <div className="actions">
              {editingId === todo.id ? (
                <button className="btn-muted" onClick={() => void saveEdit(todo.id)} type="button">
                  Save
                </button>
              ) : (
                <button className="btn-link" onClick={() => beginEdit(todo)} type="button">
                  Edit
                </button>
              )}
              <button className="btn-link" onClick={() => void removeTodo(todo.id)} type="button">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="counts">
        {activeCount} active, {completedCount} completed, {todos.length} total
      </p>
    </div>
  );
}
