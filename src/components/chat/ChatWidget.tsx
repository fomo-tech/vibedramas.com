"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatMsg, useChatStore } from "@/store/useChatStore";
import { disconnectSocket, getSocket } from "@/lib/socket";

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function MsgBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.senderRole === "user";

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <Avatar name={msg.senderName} src={msg.senderAvatar || undefined} />
      )}
      <div
        className={`flex max-w-[70%] flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}
      >
        {!isUser && (
          <p className="pl-1 text-[10px] text-white/40">{msg.senderName}</p>
        )}
        {msg.type === "image" && msg.imageUrl ? (
          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={msg.imageUrl}
              alt="Shared"
              className={`max-h-52 rounded-2xl border border-white/10 object-cover ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`}
            />
          </a>
        ) : (
          <div
            className={`break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              isUser
                ? "rounded-br-sm bg-vibe-pink text-white"
                : "rounded-bl-sm bg-white/10 text-white/90"
            }`}
          >
            {msg.content}
          </div>
        )}
        <p className="px-1 text-[9px] text-white/25">
          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { user, openLoginModal } = useAuthStore();
  const {
    isOpen,
    setOpen,
    roomId,
    setRoomId,
    messages,
    setMessages,
    addMessage,
    setUnread,
    incUnread,
    isConnected,
    setConnected,
    isTyping,
    setTyping,
  } = useChatStore();

  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [socketToken, setSocketToken] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) return;

    disconnectSocket();
    setSocketToken(null);
    setConnected(false);
    setRoomId("");
    setMessages([]);
    setUnread(0);
    setOpen(false);
    setIsRoomReady(false);
    setSendError(null);
  }, [user, setConnected, setMessages, setOpen, setRoomId, setUnread]);

  useEffect(() => {
    if (!user) return;

    fetch("/api/chat/token")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              : data.error || "Không lấy được token chat.",
          );
        }

        return data;
      })
      .then((data) => {
        if (data.token) {
          console.log("[ChatWidget] Got socket token");
          setSendError(null);
          setSocketToken(data.token);
        } else {
          throw new Error("Token chat không hợp lệ.");
        }
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể khởi tạo kết nối chat.";
        console.error("[ChatWidget] Token fetch error:", message);
        setSocketToken(null);
        setConnected(false);
        setIsRoomReady(false);
        setSendError(message);
        if (message.includes("đăng nhập")) {
          openLoginModal();
        }
      });
  }, [user, openLoginModal, setConnected]);

  useEffect(() => {
    if (!socketToken) return;

    console.log(
      "[ChatWidget] Initializing socket with token:",
      socketToken.substring(0, 20) + "...",
    );
    const socket = getSocket(socketToken);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ChatWidget] Socket connected!");
      setConnected(true);
      setSendError(null);
    });
    socket.on("disconnect", () => {
      console.log("[ChatWidget] Socket disconnected");
      setConnected(false);
      setIsRoomReady(false);
    });
    socket.on("connect_error", (error: Error) => {
      console.error("[ChatWidget] Socket connect_error:", error.message);
      setConnected(false);
      setIsRoomReady(false);
      setSendError(
        error.message === "Invalid token" || error.message === "No token"
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : `Kết nối chat thất bại: ${error.message}`,
      );
    });

    socket.on("new_message", (msg: ChatMsg) => {
      addMessage(msg);
      if (!isOpen && msg.senderRole === "admin") {
        incUnread();
      }
    });

    socket.on("typing", ({ role }: { role: string }) => {
      if (role !== "admin") return;

      setTyping(true);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTyping(false), 2000);
    });

    socket.on("room_closed", () => {
      setOpen(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("new_message");
      socket.off("typing");
      socket.off("room_closed");
    };
  }, [
    socketToken,
    addMessage,
    incUnread,
    isOpen,
    setConnected,
    setOpen,
    setTyping,
  ]);

  useEffect(() => {
    if (!user || !isOpen || !isConnected) return;

    const init = async () => {
      try {
        setIsRoomReady(false);
        setSendError(null);

        const roomResponse = await fetch("/api/chat/room");
        if (!roomResponse.ok) {
          throw new Error("Failed to init room");
        }

        const room = await roomResponse.json();
        setRoomId(room._id);

        const messagesResponse = await fetch(
          `/api/chat/messages?roomId=${room._id}`,
        );

        if (messagesResponse.ok) {
          const chatMessages = await messagesResponse.json();
          setMessages(chatMessages);
        }

        socketRef.current?.emit("join_room", room._id);
        await fetch("/api/chat/room", { method: "PATCH" });
        setUnread(0);
        setIsRoomReady(true);
      } catch {
        setSendError("Không thể mở hội thoại lúc này.");
      }
    };

    void init();
  }, [user, isOpen, isConnected, setMessages, setRoomId, setUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendText = useCallback(() => {
    const text = draft.trim();
    if (
      !text ||
      sending ||
      uploading ||
      !socketRef.current ||
      !isConnected ||
      !roomId ||
      !isRoomReady
    ) {
      return;
    }

    const originalText = text;
    setSending(true);
    setSendError(null);
    setDraft("");

    socketRef.current.emit(
      "send_message",
      { content: text, type: "text" },
      (result?: { ok?: boolean; error?: string }) => {
        setSending(false);
        if (!result?.ok) {
          setDraft(originalText);
          setSendError(result?.error || "Không gửi được tin nhắn.");
        }
      },
    );
  }, [draft, sending, uploading, isConnected, roomId, isRoomReady]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendText();
    }

    if (socketRef.current && isConnected && roomId && isRoomReady) {
      socketRef.current.emit("typing", {});
    }
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (
      !file ||
      !socketRef.current ||
      !isConnected ||
      !roomId ||
      !isRoomReady
    ) {
      setSendError("Hội thoại chưa sẵn sàng để gửi ảnh.");
      return;
    }

    setUploading(true);
    setSendError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await response.json();

      socketRef.current.emit(
        "send_message",
        { content: "", imageUrl: url, type: "image" },
        (result?: { ok?: boolean; error?: string }) => {
          if (!result?.ok) {
            setSendError(result?.error || "Không gửi được ảnh.");
          }
        },
      );
    } catch {
      setSendError("Upload ảnh thất bại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-36 right-4 z-[501] flex w-[92vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-[0_20px_60px_rgba(0,0,0,0.7)] sm:w-96 lg:bottom-24"
          style={{ maxHeight: "70vh" }}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#0a0a0a] px-4 py-3">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vibe-pink">
                <MessageCircle size={16} className="text-white" />
              </div>
              {isConnected && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0a0a0a] bg-green-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Hỗ trợ khách hàng</p>
              <p className="text-[10px] text-white/40">
                {sendError
                  ? "Kết nối lỗi"
                  : isConnected
                    ? isRoomReady
                      ? "Đang online"
                      : "Đang mở hội thoại..."
                    : "Đang kết nối..."}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 hover:bg-white/15"
            >
              <X size={14} className="text-white/60" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 overscroll-contain">
            {messages.length === 0 && (
              <div className="py-8 text-center">
                <CheckCircle2
                  size={28}
                  className="mx-auto mb-2 text-white/20"
                />
                <p className="text-sm text-white/40">
                  Xin chào! Chúng tôi có thể giúp gì cho bạn?
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <MsgBubble key={msg._id} msg={msg} />
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vibe-pink/40">
                  <MessageCircle size={12} className="text-white/60" />
                </div>
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-white/10 bg-[#0a0a0a] px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            {sendError && (
              <p className="mb-2 text-[11px] text-red-400/90">{sendError}</p>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1000}
                disabled={!isConnected || !isRoomReady || sending || uploading}
                placeholder={
                  isConnected && isRoomReady
                    ? "Nhập tin nhắn..."
                    : "Đang chuẩn bị hội thoại..."
                }
                className="flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-white/30"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !isConnected || !isRoomReady}
                className="text-white/40 transition-colors hover:text-white/70 disabled:opacity-30"
              >
                {uploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ImageIcon size={18} />
                )}
              </button>
              <button
                onClick={sendText}
                disabled={
                  !draft.trim() ||
                  sending ||
                  uploading ||
                  !isConnected ||
                  !isRoomReady
                }
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-vibe-pink transition-colors hover:bg-pink-500 disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 size={13} className="animate-spin text-white" />
                ) : (
                  <Send size={13} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
