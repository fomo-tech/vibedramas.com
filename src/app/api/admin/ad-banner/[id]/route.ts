import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdBanner from "@/models/AdBanner";
import { getSession } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return unauthorized();

  const { id } = await params;
  await dbConnect();
  const body = await req.json();
  const banner = await AdBanner.findByIdAndUpdate(id, body, {
    returnDocument: "after",
  });
  if (!banner)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(banner);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return unauthorized();

  const { id } = await params;
  await dbConnect();
  await AdBanner.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
