"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Heart, MessageCircle, Share2 } from "lucide-react";
import EpisodeCommentSheet from "./EpisodeCommentSheet";
import { useEpisodeEngagement } from "@/hooks/useEpisodeEngagement";

interface EpisodeInteractionRailProps {
  dramaId: string;
  dramaSlug: string;
  dramaName: string;
  episodeId: string;
  episodeName: string;
  refUserId?: string;
  variant: "pc" | "mobile";
  enabled?: boolean;
}

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K`;
  return n.toString();
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function EpisodeInteractionRail({
  dramaId,
  dramaSlug,
  dramaName,
  episodeId,
  episodeName,
  refUserId,
  variant,
  enabled = true,
}: EpisodeInteractionRailProps) {
  void dramaName;
  const {
    likeCount,
    commentCount,
    liked,
    loading,
    toggleLike,
    loadComments,
    addComment,
    refresh,
  } = useEpisodeEngagement(episodeId, enabled, dramaSlug);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetSending, setSheetSending] = useState(false);
  const [comments, setComments] = useState<
    Array<{
      _id: string;
      userId: string;
      userName: string;
      userAvatar?: string;
      content: string;
      createdAt: string;
    }>
  >([]);
  const [totalComments, setTotalComments] = useState(0);
  const [copied, setCopied] = useState(false);

  const isPC = variant === "pc";
  const iconSize = isPC ? 22 : 26;

  const btnClass = useMemo(
    () =>
      `touch-pan-y flex items-center justify-center rounded-full border border-white/12 transition-all duration-200 will-change-transform ${
        isPC
          ? "h-12 w-12 bg-zinc-900/78 hover:bg-zinc-800/86"
          : "h-11 w-11 bg-black/40 backdrop-blur-md"
      }`,
    [isPC],
  );

  async function openComments() {
    // Set loading TRƯỚC khi mở modal
    setSheetLoading(true);
    setSheetOpen(true);

    const data = await loadComments();
    setComments(data.comments);
    setTotalComments(data.total);
    setSheetLoading(false);
  }

  async function handleSubmitComment(content: string) {
    setSheetSending(true);
    const result = await addComment(dramaId, content);
    if (result.ok) {
      setComments((prev) => [result.comment, ...prev]);
      setTotalComments((prev) => prev + 1);
      await refresh();
    }
    setSheetSending(false);
  }

  async function handleShare() {
    const ref = refUserId ? `?ref=${encodeURIComponent(refUserId)}` : "";
    const url = `${window.location.origin}/short/${dramaSlug}${ref}`;

    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <>
      <div
        className={`pointer-events-auto flex flex-col items-center ${isPC ? "w-16 gap-4" : "w-14 gap-3"}`}
        style={{
          transform: isPC
            ? "translate3d(0, calc(var(--swipe-y, 0px) * 0.04), 0)"
            : "translate3d(calc(var(--swipe-progress, 0) * 4px), calc(var(--swipe-y, 0px) * 0.07), 0)",
        }}
      >
        <div className="w-full flex flex-col items-center select-none">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.88 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 26,
              mass: 0.7,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              void toggleLike();
            }}
            className={btnClass}
            disabled={loading}
          >
            <motion.span
              animate={liked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <Heart
                size={iconSize}
                className={
                  liked ? "fill-vibe-pink text-vibe-pink" : "text-white"
                }
              />
            </motion.span>
          </motion.button>
          <motion.span
            className={`mt-1 h-4 w-full text-center tabular-nums text-[11px] leading-4 font-bold ${liked ? "text-vibe-pink" : "text-white/85"}`}
          >
            {formatCount(likeCount)}
          </motion.span>
        </div>

        <div className="w-full flex flex-col items-center select-none">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 26,
              mass: 0.7,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              void openComments();
            }}
            className={btnClass}
          >
            <MessageCircle size={iconSize} className="text-white" />
          </motion.button>
          <motion.span className="mt-1 h-4 w-full text-center tabular-nums text-[11px] leading-4 font-bold text-white/85">
            {formatCount(commentCount)}
          </motion.span>
        </div>

        <div className="w-full flex flex-col items-center select-none">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 26,
              mass: 0.7,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              void handleShare();
            }}
            className={btnClass}
          >
            <motion.span
              key={copied ? "copied" : "share"}
              initial={{ scale: 0.82, opacity: 0.6, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {copied ? (
                <Check size={iconSize} className="text-green-400" />
              ) : (
                <Share2 size={iconSize} className="text-white" />
              )}
            </motion.span>
          </motion.button>
          <motion.span className="mt-1 h-4 w-full text-center text-[11px] leading-4 font-bold text-white/85">
            Chia sẻ
          </motion.span>
        </div>
      </div>

      <EpisodeCommentSheet
        open={sheetOpen}
        episodeName={episodeName}
        comments={comments}
        total={totalComments}
        sending={sheetSending}
        loading={sheetLoading}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmitComment}
      />
    </>
  );
}
