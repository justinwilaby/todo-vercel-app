import { listTodos } from "@/lib/db";
import { TodoApp } from "./todo-app";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialTodos = await listTodos();

  return (
    <main>
      <TodoApp initialTodos={initialTodos} />
    </main>
  );
}
