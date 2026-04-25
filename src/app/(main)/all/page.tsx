import type { Metadata } from "next";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import AllDramasClient from "@/components/home/AllDramasClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tất Cả Phim | Vibe Drama",
  description:
    "Khám phá toàn bộ kho phim ngắn mới nhất: lọc theo thể loại, quốc gia, năm phát hành và độ phổ biến.",
  alternates: {
    canonical: "/all",
  },
  openGraph: {
    title: "Tất Cả Phim | Vibe Drama",
    description: "Khám phá toàn bộ kho phim ngắn mới nhất trên Vibe Drama.",
    url: "/all",
    type: "website",
  },
};

export default async function AllDramasPage() {
  await connectDB();

  // Fetch all dramas with relevant fields for filtering and display
  const allDramas = await Drama.find()
    .select(
      "_id name slug poster_url thumb_url content type status category country year view createdAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  // Serialize data
  const serializedDramas = JSON.parse(JSON.stringify(allDramas));

  return (
    <main className="h-full bg-black">
      <AllDramasClient dramas={serializedDramas} />
    </main>
  );
}
