"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import GiftBoxButton from "./GiftBoxButton";
import GiftBoxOpenModal from "./GiftBoxOpenModal";
import GiftInfoSheet from "./GiftInfoSheet";
import { useGiftBox } from "@/hooks/useGiftBox";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";

const GIFT_BOX_POSITION_KEY = "vd_gift_box_position_v2";
const BOX_SIZE = 76;
const EDGE_GAP = 12;
const INITIAL_POSITION = { x: 12, y: 96 };

function getDefaultPosition(viewportWidth: number, viewportHeight: number) {
  // Default: above the interaction button stack (right side on feed layout)
  const rightAlignedX = viewportWidth - BOX_SIZE - 14;
  const mobileInteractionStackTop = viewportHeight - 430;
  const desktopInteractionZoneTop = viewportHeight - 280;
  const aboveInteractionY =
    viewportWidth < 1024
      ? mobileInteractionStackTop
      : desktopInteractionZoneTop;
  return { x: rightAlignedX, y: aboveInteractionY };
}

function clampPosition(
  pos: { x: number; y: number },
  viewportWidth: number,
  viewportHeight: number,
) {
  const maxX = Math.max(EDGE_GAP, viewportWidth - BOX_SIZE - EDGE_GAP);
  const maxY = Math.max(EDGE_GAP, viewportHeight - BOX_SIZE - EDGE_GAP);
  return {
    x: Math.min(Math.max(pos.x, EDGE_GAP), maxX),
    y: Math.min(Math.max(pos.y, EDGE_GAP), maxY),
  };
}

export default function GiftBox() {
  const { user, openLoginModal } = useAuthStore();
  const isWatching = useAppStore((s) => s.isWatching);
  const pathname = usePathname();
  const dragMovedRef = useRef(false);
  const dragAreaRef = useRef<HTMLDivElement | null>(null);

  const isFeedRoute = pathname === "/foryou" || pathname?.startsWith("/short");
  const isGiftRoute = isFeedRoute;
  const isLoggedIn = !!user;
  const locked = !isLoggedIn;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState(INITIAL_POSITION);
  const x = useMotionValue(INITIAL_POSITION.x);
  const y = useMotionValue(INITIAL_POSITION.y);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const restorePosition = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const fallback = clampPosition(
        getDefaultPosition(width, height),
        width,
        height,
      );

      setViewport({ width, height });

      try {
        const raw = localStorage.getItem(GIFT_BOX_POSITION_KEY);
        if (!raw) {
          x.set(fallback.x);
          y.set(fallback.y);
          setPosition(fallback);
          return;
        }

        const parsed = JSON.parse(raw) as { x?: number; y?: number };
        if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
          x.set(fallback.x);
          y.set(fallback.y);
          setPosition(fallback);
          return;
        }

        const next = clampPosition({ x: parsed.x, y: parsed.y }, width, height);
        x.set(next.x);
        y.set(next.y);
        setPosition(next);
      } catch {
        x.set(fallback.x);
        y.set(fallback.y);
        setPosition(fallback);
      }
    };

    restorePosition();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({ width, height });
      setPosition((prev) => {
        const next = clampPosition(prev, width, height);
        x.set(next.x);
        y.set(next.y);
        return next;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [x, y]);

  useEffect(() => {
    if (typeof window === "undefined" || viewport.width === 0) return;
    localStorage.setItem(GIFT_BOX_POSITION_KEY, JSON.stringify(position));
  }, [position, viewport.width]);

  const {
    progress,
    rank,
    rankName,
    nextRankName,
    watchExp,
    watchMax,
    coinsReward,
    coinsToday,
    coinsTotal,
    state,
    reward,
    open,
    dismissReward,
  } = useGiftBox({
    active: isWatching,
  });

  const showOpenModal = state === "opening" || state === "collected";
  const canDrag = viewport.width > 0 && viewport.height > 0;
  const dragEnabled = canDrag;

  function handleButtonClick() {
    if (dragMovedRef.current && dragEnabled) return;

    if (locked) {
      openLoginModal();
      return;
    }

    if (state === "ready") {
      open();
      return;
    }
    setSheetOpen(true);
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!showOpenModal && isGiftRoute && (
          <div
            ref={dragAreaRef}
            className="fixed inset-0 z-1200 pointer-events-none"
            style={{ zIndex: 11000 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 360, damping: 24 }}
              drag={dragEnabled}
              dragListener={dragEnabled}
              dragMomentum={dragEnabled}
              dragElastic={dragEnabled ? 0.08 : 0}
              dragTransition={{
                power: 0.15,
                timeConstant: 180,
                bounceStiffness: 280,
                bounceDamping: 26,
              }}
              dragConstraints={dragAreaRef}
              onPointerDownCapture={() => {
                // Prevent stale drag flag from blocking a normal tap.
                dragMovedRef.current = false;
              }}
              onDragStart={() => {
                dragMovedRef.current = false;
              }}
              onDragEnd={() => {
                const current = { x: x.get(), y: y.get() };
                const moved =
                  Math.abs(current.x - position.x) > 8 ||
                  Math.abs(current.y - position.y) > 8;
                dragMovedRef.current = moved;
                const next = clampPosition(
                  current,
                  viewport.width,
                  viewport.height,
                );
                x.set(next.x);
                y.set(next.y);
                setPosition(next);
                window.setTimeout(() => {
                  dragMovedRef.current = false;
                }, 120);
              }}
              whileDrag={{ scale: 1.04 }}
              className={`absolute pointer-events-auto ${dragEnabled ? "touch-none cursor-grab active:cursor-grabbing" : "touch-manipulation cursor-pointer"}`}
              style={{
                left: 0,
                top: 0,
                x,
                y,
                touchAction: dragEnabled ? "none" : "manipulation",
                zIndex: 11001,
              }}
            >
              <GiftBoxButton
                progress={progress}
                rank={rank}
                state={state}
                locked={locked}
                onClick={handleButtonClick}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info sheet (drawer mobile / modal desktop) */}
      <GiftInfoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onClaim={open}
        locked={locked}
        isLoggedIn={isLoggedIn}
        rank={rank}
        rankName={rankName}
        nextRankName={nextRankName}
        coinsReward={coinsReward}
        coinsToday={coinsToday}
        coinsTotal={coinsTotal}
        watchExp={watchExp}
        watchMax={watchMax}
        progress={progress}
        state={state}
      />

      {/* Open animation modal — always mounted for AnimatePresence exit */}
      <GiftBoxOpenModal
        visible={showOpenModal}
        reward={reward}
        rank={rank}
        canDismiss={state === "collected"}
        onDismiss={dismissReward}
      />
    </>
  );
}
