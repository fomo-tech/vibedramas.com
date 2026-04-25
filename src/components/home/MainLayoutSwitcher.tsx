"use client";

import React, { useRef, useState, useEffect } from "react";
import Header from "./Header";
import HeroSlider from "./HeroSlider";
import DramaSection from "./DramaSection";
import PersonalizedSection from "./PersonalizedSection";
import CategoryShowcase from "./CategoryShowcase";
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
  const categorySource = [
    ...(featuredDramas ?? []),
    ...(trendingDramas ?? []),
    ...(newReleases ?? []),
    ...(topRatedDramas ?? []),
  ];

  return (
    <>
      {/* Header */}
      <div className="relative z-50 shrink-0 h-[calc(3.5rem+env(safe-area-inset-top))] lg:h-16">
        <Header activeTab="home" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 relative overflow-y-auto">
        <HeroSlider dramas={featuredDramas} />

        <div className="relative z-10 bg-black py-6 lg:py-10 space-y-8 lg:space-y-12">
          <CategoryShowcase dramas={categorySource} />

          {/* ĐANG THỊNH HÀNH — above fold, always rendered */}
          <DramaSection
            title="Đang Thịnh Hành"
            icon={TrendingUp}
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
              dramas={newReleases}
              seeMoreHref="/all?sort=newest"
            />
          </LazySection>

          <LazySection>
            <DramaSection
              title="Phim Hay Nhất"
              icon={Trophy}
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
