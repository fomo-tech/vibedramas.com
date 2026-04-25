"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import {
  Autoplay,
  Navigation as SwiperNavigation,
  EffectFade,
} from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, Info, Star } from "lucide-react";
import Image from "next/image";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

interface HeroSliderProps {
  dramas: any[]; // Fallback dramas if no config
}

const DELAY = 6000;

const contentVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.1 + 0.15,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(4px)",
    transition: { duration: 0.25 },
  },
};

export default function HeroSlider({ dramas }: HeroSliderProps) {
  const router = useRouter();
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

  // Fetch hero slides config from API
  useEffect(() => {
    async function fetchHeroSlides() {
      try {
        const res = await fetch("/api/admin/hero-slides");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Use configured slides
            setHeroSlides(data.map((s: any) => s.drama).filter(Boolean));
          } else {
            // Fallback to default dramas
            setHeroSlides(dramas.filter((d) => d.poster_url || d.thumb_url));
          }
        } else {
          setHeroSlides(dramas.filter((d) => d.poster_url || d.thumb_url));
        }
      } catch (error) {
        console.error("Error fetching hero slides:", error);
        setHeroSlides(dramas.filter((d) => d.poster_url || d.thumb_url));
      } finally {
        setLoading(false);
      }
    }
    fetchHeroSlides();
  }, [dramas]);

  const slides = heroSlides;

  const onAutoplayTimeLeft = useCallback(
    (_: SwiperType, __: number, ratio: number) => {
      setProgress(1 - ratio);
    },
    [],
  );

  if (loading) {
    return (
      <div className="relative w-full h-[62vh] lg:h-[88vh] bg-black flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  if (!slides.length) return null;

  return (
    <div className="relative w-full h-[62vh] lg:h-[88vh] overflow-hidden group/slider bg-black">
      <Swiper
        modules={[Autoplay, SwiperNavigation, EffectFade]}
        effect="fade"
        speed={900}
        fadeEffect={{ crossFade: true }}
        allowTouchMove={false}
        simulateTouch={false}
        navigation={{ nextEl: ".hero-next", prevEl: ".hero-prev" }}
        autoplay={{ delay: DELAY, disableOnInteraction: false }}
        onSwiper={setSwiper}
        onSlideChange={(s) => {
          setActiveIdx(s.realIndex);
          setProgress(0);
        }}
        onAutoplayTimeLeft={onAutoplayTimeLeft}
        className="h-full w-full"
        style={{ touchAction: "none" }}
      >
        {slides.map((drama, index) => (
          <SwiperSlide key={drama._id}>
            <div className="relative w-full h-full">
              {/* BG image with subtle zoom */}
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 7, ease: "linear" }}
              >
                <Image
                  src={drama.poster_url || drama.thumb_url || ""}
                  alt={drama.name || "Drama"}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="100vw"
                  quality={85}
                />
              </motion.div>

              {/* Layered cinematic gradients */}
              <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/30 to-transparent z-10" />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/10 to-transparent z-10" />
              <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-transparent z-10" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Animated content overlay */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-5 lg:px-20 pb-14 lg:pb-24 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            className="flex flex-col items-start max-w-xl pointer-events-auto"
          >
            {/* Badge row */}
            <motion.div
              custom={0}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center gap-2 mb-3"
            >
              {slides[activeIdx]?.category?.[0] && (
                <span className="px-2.5 py-1 bg-vibe-pink/90 backdrop-blur-sm text-[9px] font-black uppercase tracking-[0.15em] rounded-md shadow-lg shadow-vibe-pink/20">
                  {slides[activeIdx].category[0].name}
                </span>
              )}

              {slides[activeIdx]?.view > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="flex items-center gap-1 text-amber-400/90 text-[10px] font-bold">
                    <Star size={9} fill="currentColor" />
                    {(slides[activeIdx].view / 1000).toFixed(0)}K
                  </span>
                </>
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              custom={1}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-[1.9rem] lg:text-[3.5rem] font-black text-white mb-1.5 uppercase tracking-tight italic leading-[1.05] drop-shadow-2xl"
            >
              {slides[activeIdx]?.name}
            </motion.h2>

            {/* Origin name */}
            {slides[activeIdx]?.origin_name && (
              <motion.p
                custom={2}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-white/40 text-xs lg:text-sm font-medium mb-5 tracking-wide"
              >
                {slides[activeIdx].origin_name}
              </motion.p>
            )}

            {/* Buttons */}
            <motion.div
              custom={3}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                onClick={() => router.push(`/short/${slides[activeIdx]?.slug}`)}
                className="flex items-center gap-2 bg-vibe-pink px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl font-black text-white text-[10px] lg:text-xs tracking-widest uppercase shadow-xl shadow-vibe-pink/30 hover:brightness-110 transition-all"
              >
                <Play size={13} fill="currentColor" />
                Xem ngay
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  router.push(`/short/${slides[activeIdx]?.slug}`);
                }}
                className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 bg-white/10 hover:bg-white/18 backdrop-blur-xl rounded-xl border border-white/15 transition-all"
              >
                <Info size={15} className="text-white/70" />
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicators + progress — bottom right */}
      <div className="absolute bottom-5 lg:bottom-8 right-5 lg:right-20 z-30 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => swiper?.slideTo(i)}
            className="relative h-0.75 rounded-full overflow-hidden transition-all duration-300"
            style={{
              width: i === activeIdx ? 28 : 12,
              background: "rgba(255,255,255,0.2)",
            }}
          >
            {i === activeIdx && (
              <motion.div
                className="absolute inset-y-0 left-0 bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Navigation arrows — PC only */}
      <button className="hero-prev hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/50 hover:text-white hover:bg-black/70 hover:border-white/25 transition-all duration-300 opacity-0 group-hover/slider:opacity-100 backdrop-blur-sm">
        <ChevronLeft size={20} />
      </button>
      <button className="hero-next hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/50 hover:text-white hover:bg-black/70 hover:border-white/25 transition-all duration-300 opacity-0 group-hover/slider:opacity-100 backdrop-blur-sm">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
