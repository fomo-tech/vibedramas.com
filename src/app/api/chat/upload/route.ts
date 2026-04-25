import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getUserSession } from "@/lib/auth";
import { getSession } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  // Allow both users and admins
  const user = await getUserSession();
  const admin = await getSession();
  if (!user && !admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 5MB)" },
      { status: 400 },
    );
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WEBP, GIF allowed" },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "vibe-chat",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  return NextResponse.json({ url: result.secure_url });
}
