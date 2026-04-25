"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useMotionValueEvent,
  type MotionStyle,
} from "framer-motion";

type SwipeDirection = 1 | -1;

interface NativeSwipeViewportProps {
  children: React.ReactNode;
  className?: string;
  onStep?: (direction: SwipeDirection) => void;
  enabled?: boolean;
}

const BLOCK_SELECTOR =
  "button,a,input,textarea,select,[role='button'],[data-no-pause='true']";

export default function NativeSwipeViewport({
  children,
  className = "",
  onStep,
  enabled = true,
}: NativeSwipeViewportProps) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastMoveTimeRef = useRef<number>(0);
  const lastMoveYRef = useRef<number>(0);
  const pendingYRef = useRef(0);
  const moveRafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const blockedStartRef = useRef(false);
  const wheelLockedRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const stepCooldownUntilRef = useRef(0);

  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const viewportStyle: MotionStyle = {
    y,
    scale,
    willChange: "transform",
    touchAction: enabled && !isDesktop ? "none" : "auto",
  };

  useMotionValueEvent(y, "change", (latest) => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty("--swipe-y", `${latest.toFixed(2)}px`);
    el.style.setProperty("--swipe-progress", `${(latest / 86).toFixed(4)}`);
    el.style.setProperty(
      "--swipe-abs",
      `${Math.min(1, Math.abs(latest) / 110).toFixed(4)}`,
    );
  });

  const isBlockedTarget = useCallback((target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return Boolean(el.closest(BLOCK_SELECTOR));
  }, []);

  const settle = useCallback(
    (velocity = 0) => {
      animate(y, 0, {
        type: "spring",
        stiffness: 300,
        damping: 28,
        mass: 0.68,
        velocity,
      });
      animate(scale, 1, {
        type: "spring",
        stiffness: 310,
        damping: 28,
        mass: 0.64,
      });
    },
    [scale, y],
  );

  const triggerStep = useCallback(
    (direction: SwipeDirection, delayMs: number) => {
      const now = performance.now();
      if (now < stepCooldownUntilRef.current) return;
      stepCooldownUntilRef.current = now + 150;
      window.setTimeout(() => onStep?.(direction), delayMs);
    },
    [onStep],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!enabled || !onStep) return;
      const absDelta = Math.abs(e.deltaY);
      if (absDelta < 10) return;
      if (wheelLockedRef.current) return;
      if (isBlockedTarget(e.target)) return;

      const isTrackpad = e.deltaMode === 0 && absDelta < 56;

      e.preventDefault();
      wheelAccumRef.current += e.deltaY;

      const triggerThreshold = isTrackpad ? 14 : 26;
      if (Math.abs(wheelAccumRef.current) < triggerThreshold) {
        const micro = Math.max(-18, Math.min(18, wheelAccumRef.current * 0.36));
        y.set(micro);
        return;
      }

      wheelLockedRef.current = true;

      const wheelMagnitude = Math.min(320, Math.abs(wheelAccumRef.current));
      const direction: SwipeDirection = wheelAccumRef.current > 0 ? 1 : -1;
      wheelAccumRef.current = 0;
      const impulse = isTrackpad
        ? Math.min(112, 30 + wheelMagnitude * 0.26)
        : Math.min(130, 40 + wheelMagnitude * 0.28);
      animate(y, direction > 0 ? -impulse : impulse, {
        duration: 0.19,
        ease: [0.22, 1, 0.36, 1],
      })
        .then(() =>
          animate(y, direction > 0 ? -56 : 56, {
            duration: 0.16,
            ease: [0.22, 1, 0.36, 1],
          }),
        )
        .then(() => settle());

      // Delay step slightly so the visual impulse starts first (feels less abrupt).
      const wheelDelay = isTrackpad
        ? Math.min(118, 56 + wheelMagnitude * 0.17)
        : Math.min(140, 64 + wheelMagnitude * 0.2);
      triggerStep(direction, Math.round(wheelDelay));

      window.setTimeout(() => {
        wheelLockedRef.current = false;
      }, 150);
    },
    [enabled, isBlockedTarget, onStep, settle, triggerStep, y],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!enabled || !onStep) return;
      blockedStartRef.current = isBlockedTarget(e.target);
      startYRef.current = e.touches[0]?.clientY ?? null;
      currentYRef.current = startYRef.current;
      startTimeRef.current = performance.now();
      lastMoveTimeRef.current = startTimeRef.current;
      lastMoveYRef.current = startYRef.current ?? 0;
      draggingRef.current = true;
      if (containerRef.current) {
        containerRef.current.dataset.swiping = "true";
      }
    },
    [enabled, isBlockedTarget, onStep],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!enabled || !onStep || !draggingRef.current) return;
      if (startYRef.current == null) return;

      const rawDelta =
        (e.touches[0]?.clientY ?? startYRef.current) - startYRef.current;
      if (blockedStartRef.current && Math.abs(rawDelta) < 12) {
        return;
      }

      // Prevent browser vertical scrolling/rubber-band during gesture handling.
      e.preventDefault();

      const currentY = e.touches[0]?.clientY ?? startYRef.current;
      const now = performance.now();
      currentYRef.current = currentY;
      lastMoveTimeRef.current = now;
      lastMoveYRef.current = currentY;
      const delta = currentY - startYRef.current;
      const sign = delta < 0 ? -1 : 1;
      const absDelta = Math.abs(delta);
      // Resistance curve: follows finger quickly then slows near the edge.
      const resisted =
        absDelta <= 128 ? absDelta : 128 + (absDelta - 128) * 0.62;
      const clamped = Math.min(276, resisted) * sign;

      pendingYRef.current = clamped;
      if (moveRafRef.current == null) {
        moveRafRef.current = window.requestAnimationFrame(() => {
          moveRafRef.current = null;
          const blended = y.get() * 0.28 + pendingYRef.current * 0.72;
          y.set(blended);
          scale.set(0.996);
        });
      }
    },
    [enabled, onStep, scale, y],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!enabled || !onStep || !draggingRef.current) return;
      const startY = startYRef.current;
      const endY = currentYRef.current ?? e.changedTouches[0]?.clientY ?? 0;
      const now = performance.now();
      startYRef.current = null;
      currentYRef.current = null;
      draggingRef.current = false;
      blockedStartRef.current = false;
      if (moveRafRef.current != null) {
        window.cancelAnimationFrame(moveRafRef.current);
        moveRafRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.dataset.swiping = "false";
      }

      if (startY == null) {
        settle();
        return;
      }

      const delta = endY - startY;
      if (blockedStartRef.current && Math.abs(delta) < 12) {
        settle();
        return;
      }

      const gestureDuration = Math.max(1, now - startTimeRef.current);
      const sampleDuration = Math.max(1, now - lastMoveTimeRef.current);
      const velocityPxMs = (endY - lastMoveYRef.current) / sampleDuration;
      const avgVelocityPxMs = delta / gestureDuration;
      const velocity =
        Math.abs(velocityPxMs) > Math.abs(avgVelocityPxMs)
          ? velocityPxMs
          : avgVelocityPxMs;

      // Faster swipes need less distance to trigger page step.
      const dynamicThreshold = Math.max(18, 48 - Math.abs(velocity) * 56);
      if (Math.abs(delta) < dynamicThreshold && Math.abs(velocity) < 0.3) {
        settle();
        return;
      }

      const direction: SwipeDirection = delta < 0 ? 1 : -1;
      const inertia = Math.min(360, 166 + Math.abs(velocity) * 130);
      const settleVelocityMag = Math.min(3.1, Math.abs(velocity) * 3.2);
      const settleVelocity =
        direction > 0 ? settleVelocityMag : -settleVelocityMag;
      animate(y, direction > 0 ? -inertia : inertia, {
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      })
        .then(() =>
          animate(y, direction > 0 ? -64 : 64, {
            duration: 0.16,
            ease: [0.22, 1, 0.36, 1],
          }),
        )
        .then(() => settle(settleVelocity));
      // Trigger step near the impulse peak for better continuity.
      const touchDelay = Math.round(
        Math.min(126, 70 + Math.abs(velocity) * 16 + Math.abs(delta) * 0.035),
      );
      triggerStep(direction, touchDelay);
    },
    [enabled, onStep, settle, triggerStep, y],
  );

  const handleTouchCancel = useCallback(() => {
    draggingRef.current = false;
    blockedStartRef.current = false;
    startYRef.current = null;
    currentYRef.current = null;
    if (moveRafRef.current != null) {
      window.cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.dataset.swiping = "false";
    }
    settle();
  }, [settle]);

  return (
    <motion.div
      ref={containerRef}
      className={className}
      data-swiping="false"
      style={viewportStyle}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </motion.div>
  );
}
