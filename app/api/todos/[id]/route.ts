import { NextRequest, NextResponse } from "next/server";
import { deleteTodo, updateTodo } from "@/lib/db";

function parseTodoId(value: string) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseTodoId(rawId);
    if (!id) {
      return NextResponse.json({ error: "Invalid todo id." }, { status: 400 });
    }

    const body = await request.json();
    const patch: { title?: string; completed?: boolean } = {};

    if (typeof body?.title === "string") {
      patch.title = body.title;
    }

    if (typeof body?.completed === "boolean") {
      patch.completed = body.completed;
    }

    if (!("title" in patch) && !("completed" in patch)) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const todo = await updateTodo(id, patch);
    if (!todo) {
      return NextResponse.json({ error: "Todo not found." }, { status: 404 });
    }

    return NextResponse.json({ todo }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error."
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseTodoId(rawId);
    if (!id) {
      return NextResponse.json({ error: "Invalid todo id." }, { status: 400 });
    }

    const todo = await deleteTodo(id);
    if (!todo) {
      return NextResponse.json({ error: "Todo not found." }, { status: 404 });
    }

    return NextResponse.json({ todo }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error."
      },
      { status: 400 }
    );
  }
}
