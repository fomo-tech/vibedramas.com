"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import DramaSection from "./DramaSection";

export default function PersonalizedSection({ fallback }: { fallback: any[] }) {
  const [dramas, setDramas] = useState<any[]>(fallback);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dramas/recommendations")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setDramas(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DramaSection
      title="Dành Cho Bạn"
      icon={Sparkles}
      subtitle="Gợi ý dựa trên xu hướng và phim bạn có thể thích"
      dramas={dramas}
      seeMoreHref="/foryou"
    />
  );
}
