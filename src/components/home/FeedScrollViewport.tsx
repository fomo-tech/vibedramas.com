"use client";

import React from "react";
import NativeSwipeViewport from "./NativeSwipeViewport";

interface FeedScrollViewportProps {
  children: React.ReactNode;
  onStep?: (direction: 1 | -1) => void;
  swipeEnabled?: boolean;
  swipeClassName: string;
  scrollClassName: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  scrollStyle?: React.CSSProperties;
}

export default function FeedScrollViewport({
  children,
  onStep,
  swipeEnabled = true,
  swipeClassName,
  scrollClassName,
  onScroll,
  scrollRef,
  scrollStyle,
}: FeedScrollViewportProps) {
  return (
    <NativeSwipeViewport
      onStep={onStep}
      enabled={swipeEnabled}
      className={swipeClassName}
    >
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={scrollClassName}
        style={scrollStyle}
      >
        {children}
      </div>
    </NativeSwipeViewport>
  );
}
