import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Generic CRUD API for any table.
 * MVP: just proxies to client-side localStorage via the frontend.
 * When Supabase is connected, this will query the real database.
 *
 * GET /api/data/founders — list all founders
 * POST /api/data/founders — create a founder
 * PATCH /api/data/founders?id=xxx — update a founder
 * DELETE /api/data/founders?id=xxx — delete a founder
 */

// For now, return empty — all data is client-side in localStorage.
// This route exists as the API contract for when we add a real DB.

export async function GET(
  _request: NextRequest,
  { params }: { params: { table: string } }
) {
  return NextResponse.json({
    table: params.table,
    data: [],
    source: "api",
    message: "Data is currently stored client-side. Connect Supabase to enable server persistence.",
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const body = await request.json();
  return NextResponse.json({
    table: params.table,
    data: { id: crypto.randomUUID(), ...body, created_at: new Date().toISOString() },
    source: "api",
  }, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const body = await request.json();
  return NextResponse.json({
    table: params.table,
    data: { id, ...body, updated_at: new Date().toISOString() },
    source: "api",
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json({ table: params.table, deleted: id });
}
