import { NextRequest, NextResponse } from "next/server";
import { createTodo, listTodos } from "@/lib/db";

export async function GET() {
  try {
    const todos = await listTodos();
    return NextResponse.json({ todos }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title : "";
    const todo = await createTodo(title);
    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error."
      },
      { status: 400 }
    );
  }
}
