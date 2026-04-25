"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useWindowSize } from "@/hooks/useWindowSize";
import BaseDrawer from "@/components/shared/BaseDrawer";
import BaseModal from "@/components/shared/BaseModal";
import type { EpisodeCommentItem } from "@/hooks/useEpisodeEngagement";

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày`;
  return date.toLocaleDateString("vi-VN");
}

interface EpisodeCommentSheetProps {
  open: boolean;
  episodeName: string;
  comments: EpisodeCommentItem[];
  total: number;
  sending: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
}

export default function EpisodeCommentSheet({
  open,
  episodeName,
  comments,
  total,
  sending,
  loading = false,
  onClose,
  onSubmit,
}: EpisodeCommentSheetProps) {
  const [draft, setDraft] = useState("");
  const { width } = useWindowSize();
  const isDesktop = (width ?? 0) >= 1024; // lg breakpoint

  function handleClose() {
    setDraft("");
    onClose();
  }

  const headerText = useMemo(() => {
    if (total <= 0) return `Bình luận • Tập ${episodeName}`;
    return `${total.toLocaleString("vi-VN")} bình luận • Tập ${episodeName}`;
  }, [episodeName, total]);

  async function handleSend() {
    const value = draft.trim();
    if (!value || sending) return;
    await onSubmit(value);
    setDraft("");
  }

  // Comment list content
  const commentContent = (
    <div className="px-4 py-4 space-y-3">
      {comments.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-10 text-center">
          <MessageCircle size={24} className="mx-auto text-white/35 mb-3" />
          <p className="text-sm text-white/50 leading-relaxed">
            Chưa có bình luận nào
            <br />
            Hãy mở màn thảo luận đầu tiên
          </p>
        </div>
      ) : (
        comments.map((item) => (
          <div
            key={item._id}
            className="rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 px-3 py-3 transition-colors"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-vibe-pink/30 to-orange-500/30 border border-white/10 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {item.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/90 truncate">
                  {item.userName}
                </p>
                <span className="text-[10px] text-white/35">
                  {formatTime(item.createdAt)}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/85 pl-10">
              {item.content}
            </p>
          </div>
        ))
      )}
    </div>
  );

  // Input footer
  const inputFooter = (
    <div className="sticky bottom-0 border-t border-white/10 bg-black/90 backdrop-blur-xl px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
          maxLength={500}
          placeholder="Viết bình luận..."
          className="h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
        <button
          onClick={() => void handleSend()}
          disabled={!draft.trim() || sending}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-vibe-pink to-orange-500 px-4 text-xs font-bold text-white shadow-lg shadow-vibe-pink/25 disabled:opacity-40 disabled:shadow-none transition-all hover:shadow-xl hover:shadow-vibe-pink/40"
        >
          <Send size={14} />
          {sending ? "Đang gửi..." : "Gửi"}
        </button>
      </div>
    </div>
  );

  // Render desktop modal or mobile drawer
  if (isDesktop) {
    return (
      <BaseModal
        open={open}
        onClose={handleClose}
        title={headerText}
        loading={loading}
        size="lg"
      >
        {commentContent}
        {inputFooter}
      </BaseModal>
    );
  }

  return (
    <BaseDrawer
      open={open}
      onClose={handleClose}
      title={headerText}
      loading={loading}
    >
      {commentContent}
      {inputFooter}
    </BaseDrawer>
  );
}
