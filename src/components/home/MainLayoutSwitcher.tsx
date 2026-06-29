"use client";

import React, { useRef, useState, useEffect } from "react";
import HeroSlider from "./HeroSlider";
import DramaSection from "./DramaSection";
import PersonalizedSection from "./PersonalizedSection";
import { TrendingUp, Clapperboard, Trophy } from "lucide-react";

/** Render children only once the element has entered the viewport */
function LazySection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }, // start loading 200px before entering view
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{visible ? children : <div className="h-48" />}</div>;
}

export default function MainLayoutSwitcher({
  featuredDramas,
  newReleases,
  trendingDramas,
  topRatedDramas,
  recommendedDramas,
}: any) {
  return (
    <>
      {/* Scrollable content */}
      <div className="flex-1 relative overflow-y-auto">
        <HeroSlider dramas={featuredDramas} />

        <div className="relative z-10 bg-black py-6 lg:py-10 space-y-9 lg:space-y-14">
          {/* ĐANG THỊNH HÀNH — above fold, always rendered */}
          <DramaSection
            title="Đang Thịnh Hành"
            icon={TrendingUp}
            subtitle="Top phim được xem nhiều nhất hôm nay"
            dramas={trendingDramas}
            rank
            featured
            seeMoreHref="/all?sort=view-desc"
          />

          {/* Below-fold sections — lazy mount via IntersectionObserver */}
          <LazySection>
            <DramaSection
              title="Phim Bộ Mới"
              icon={Clapperboard}
              subtitle="Cập nhật liên tục, chọn là xem ngay"
              dramas={newReleases}
              seeMoreHref="/all?sort=newest"
            />
          </LazySection>

          <LazySection>
            <DramaSection
              title="Phim Hay Nhất"
              icon={Trophy}
              subtitle="Những bộ được yêu thích và xem nhiều"
              dramas={topRatedDramas}
              seeMoreHref="/all?sort=view-desc"
            />
          </LazySection>

          <LazySection>
            <PersonalizedSection fallback={recommendedDramas} />
          </LazySection>

          <div className="h-24 lg:h-0" />
        </div>
      </div>
    </>
  );
}
