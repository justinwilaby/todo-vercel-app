import { NextRequest, NextResponse } from "next/server";
import { createManyTodos, listTodos } from "@/lib/db";

const seedTodos = [
  "Set up Vercel project",
  "Provision Neon Postgres",
  "Configure DATABASE_URL",
  "Deploy Next.js app",
  "Create first todo item",
  "Validate CRUD behavior",
  "Prepare Render service config",
  "Run migration workflow test"
];

export async function POST(request: NextRequest) {
  const configuredToken = process.env.SEED_TOKEN;
  if (!configuredToken) {
    return NextResponse.json(
      { error: "SEED_TOKEN is not configured." },
      { status: 400 }
    );
  }

  const suppliedToken = request.headers.get("x-seed-token");
  if (suppliedToken !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "true";
  const existing = await listTodos();

  if (existing.length > 0 && !force) {
    return NextResponse.json(
      {
        message: "Todos already exist. Use ?force=true to append seed data.",
        inserted: 0,
        total: existing.length
      },
      { status: 200 }
    );
  }

  const created = await createManyTodos(seedTodos);
  const all = await listTodos();

  return NextResponse.json(
    {
      message: "Seed complete.",
      inserted: created.length,
      total: all.length
    },
    { status: 201 }
  );
}
