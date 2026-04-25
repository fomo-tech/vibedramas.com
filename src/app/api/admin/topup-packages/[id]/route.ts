import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopupPackage from "@/models/TopupPackage";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  return session;
}

// PATCH update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const body = await req.json();
  const pkg = await TopupPackage.findByIdAndUpdate(id, body, {
    returnDocument: "after",
  });
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pkg);
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  await TopupPackage.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
