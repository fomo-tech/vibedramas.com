"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  Loader2,
  X,
  Users,
  CheckCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Socket } from "socket.io-client";
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

interface Room {
  _id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  status: "open" | "closed";
  adminUnread: number;
  userUnread: number;
}

interface Msg {
  _id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin";
  senderAvatar: string;
  content: string;
  imageUrl?: string;
  type: "text" | "image";
  createdAt: string;
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src)
    return (
      <img
        src={src}
        alt={name}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  return (
    <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function MsgBubble({ msg }: { msg: Msg }) {
  const isAdmin = msg.senderRole === "admin";
  return (
    <div
      className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"} items-end`}
    >
      {!isAdmin && (
        <Avatar name={msg.senderName} src={msg.senderAvatar || undefined} />
      )}
      <div
        className={`max-w-[70%] flex flex-col gap-0.5 ${isAdmin ? "items-end" : "items-start"}`}
      >
        {!isAdmin && (
          <p className="text-[10px] text-white/40 pl-1">{msg.senderName}</p>
        )}
        {msg.type === "image" && msg.imageUrl ? (
          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={msg.imageUrl}
              alt="Shared"
              className={`rounded-2xl max-h-48 object-cover border border-white/10 ${isAdmin ? "rounded-br-sm" : "rounded-bl-sm"}`}
            />
          </a>
        ) : (
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
              isAdmin
                ? "bg-pink-600 text-white rounded-br-sm"
                : "bg-white/10 text-white/90 rounded-bl-sm"
            }`}
          >
            {msg.content}
          </div>
        )}
        <p className="text-[9px] text-white/25 px-1">
          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default function AdminChatClient({
  adminToken,
}: {
  adminToken: string;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingRooms, setTypingRooms] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const toast = useToast();
  const { showConfirm } = useAlert();

  // ── Dynamic import socket.io-client (own instance, not shared singleton) ──
  useEffect(() => {
    let sock: Socket;

    const initSocket = async () => {
      const { io } = await import("socket.io-client");
      const serverUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      sock = io(serverUrl, {
        path: "/api/socket",
        auth: { token: adminToken },
        transports: ["polling", "websocket"], // polling first to avoid dev server issues
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      socketRef.current = sock;

      sock.on("connect", () => setIsConnected(true));
      sock.on("disconnect", () => setIsConnected(false));

      sock.on("new_message", (msg: Msg) => {
        if (msg.roomId === activeRoomIdRef.current) {
          setMessages((prev) => {
            // Prevent duplicate messages with same _id
            if (prev.some((m) => m._id === msg._id)) {
              return prev;
            }
            return [...prev, msg];
          });
        }
        setRooms((prev) =>
          prev.map((r) =>
            r._id === msg.roomId
              ? {
                  ...r,
                  lastMessage: msg.imageUrl ? "[Hình ảnh]" : msg.content,
                  lastMessageAt: msg.createdAt,
                  adminUnread:
                    msg.senderRole === "user" &&
                    r._id !== activeRoomIdRef.current
                      ? r.adminUnread + 1
                      : r.adminUnread,
                }
              : r,
          ),
        );
      });

      sock.on("room_updated", (room: Room) => {
        setRooms((prev) => {
          // Remove closed rooms from the list
          if (room.status === "closed") {
            return prev.filter((r) => r._id !== room._id);
          }
          const exists = prev.find((r) => r._id === room._id);
          if (exists)
            return prev.map((r) =>
              r._id === room._id ? { ...r, ...room } : r,
            );
          return [room, ...prev];
        });
        // If the closed room was active, deselect it
        if (room.status === "closed") {
          setActiveRoomId((cur) => (cur === room._id ? null : cur));
          setMessages((msgs) =>
            activeRoomIdRef.current === room._id ? [] : msgs,
          );
        }
      });

      sock.on("user_online", ({ roomId }: { roomId: string }) => {
        setOnlineUsers((s) => new Set([...s, roomId]));
      });

      sock.on("user_offline", ({ roomId }: { roomId: string }) => {
        setOnlineUsers((s) => {
          const next = new Set(s);
          next.delete(roomId);
          return next;
        });
      });

      sock.on(
        "typing",
        ({ roomId, role }: { roomId: string; role: string }) => {
          if (role !== "user") return;
          setTypingRooms((s) => new Set([...s, roomId]));
          const prev = typingTimersRef.current.get(roomId);
          if (prev) clearTimeout(prev);
          typingTimersRef.current.set(
            roomId,
            setTimeout(() => {
              setTypingRooms((s) => {
                const next = new Set(s);
                next.delete(roomId);
                return next;
              });
            }, 2000),
          );
        },
      );

      sock.on("room_closed", () => {
        // Server closed the room we're currently in — refresh rooms list
        const closedRoomId = activeRoomIdRef.current;
        if (closedRoomId) {
          setRooms((prev) => prev.filter((r) => r._id !== closedRoomId));
        }
      });
    };

    initSocket();
    return () => {
      sock?.off("room_closed");
      sock?.off("new_message");
      sock?.off("room_updated");
      sock?.off("user_online");
      sock?.off("user_offline");
      sock?.off("typing");
      sock?.off("connect");
      sock?.off("disconnect");
      sock?.disconnect();
    };
  }, [adminToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track active room in ref for socket callbacks
  const activeRoomIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // ── Load rooms ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/chat/admin/rooms")
      .then((r) => r.json())
      .then((data: Room[]) => setRooms(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // ── Select room ────────────────────────────────────────────────────────────
  const selectRoom = useCallback(async (room: Room) => {
    setActiveRoomId(room._id);
    socketRef.current?.emit("join_room", room._id);

    const res = await fetch(`/api/chat/admin/messages?roomId=${room._id}`);
    if (res.ok) {
      const msgs: Msg[] = await res.json();
      // Remove duplicates by _id (just in case)
      const uniqueMsgs = msgs.filter(
        (msg, index, self) =>
          index === self.findIndex((m) => m._id === msg._id),
      );
      setMessages(uniqueMsgs);
    }

    // Mark admin read
    await fetch("/api/chat/admin/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room._id }),
    });

    setRooms((prev) =>
      prev.map((r) => (r._id === room._id ? { ...r, adminUnread: 0 } : r)),
    );

    // Trigger update in layout
    window.dispatchEvent(new Event("chatUnreadUpdate"));
  }, []);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendText = useCallback(() => {
    const text = draft.trim();
    if (!text || sending || !socketRef.current || !activeRoomId) return;
    setSending(true);
    setDraft("");
    socketRef.current.emit(
      "send_message",
      { roomId: activeRoomId, content: text, type: "text" },
      () => setSending(false),
    );
  }, [draft, sending, activeRoomId]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socketRef.current || !activeRoomId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      socketRef.current.emit("send_message", {
        roomId: activeRoomId,
        content: "",
        imageUrl: url,
        type: "image",
      });
    } catch {
      toast.error("Lỗi", "Upload ảnh thất bại");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const closeRoom = () => {
    if (!activeRoomId) return;
    showConfirm({
      title: "Đóng hội thoại?",
      message: "Cuộc trò chuyện này sẽ bị đóng vĩnh viễn.",
      confirmText: "Đóng hội thoại",
      variant: "danger",
      onConfirm: () => {
        socketRef.current?.emit("close_room", activeRoomId);
        setRooms((prev) => prev.filter((r) => r._id !== activeRoomId));
        setActiveRoomId(null);
        setMessages([]);
      },
    });
  };

  const activeRoom = rooms.find((r) => r._id === activeRoomId);
  const totalUnread = rooms.reduce((sum, r) => sum + (r.adminUnread || 0), 0);

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
      {/* Sidebar — room list */}
      <aside className="w-72 flex flex-col bg-gray-950 border-r border-gray-800 shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-pink-400" />
            <span className="font-bold text-white">Live Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-600"}`}
            />
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="p-6 text-center">
              <Users size={24} className="mx-auto text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">Chưa có hội thoại nào</p>
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room._id}
                onClick={() => selectRoom(room)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-b border-gray-800/50 ${
                  activeRoomId === room._id ? "bg-gray-800" : ""
                }`}
              >
                <div className="relative">
                  <Avatar
                    name={room.userName}
                    src={room.userAvatar || undefined}
                  />
                  {onlineUsers.has(room._id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-gray-950" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white truncate">
                      {room.userName}
                    </p>
                    {room.adminUnread > 0 && (
                      <span className="w-5 h-5 bg-pink-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {room.adminUnread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {typingRooms.has(room._id)
                      ? "Đang nhập..."
                      : room.lastMessage || "Chưa có tin nhắn"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={36} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500">Chọn hội thoại để bắt đầu</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-3 bg-gray-950 border-b border-gray-800 flex items-center gap-3 shrink-0">
              <Avatar
                name={activeRoom.userName}
                src={activeRoom.userAvatar || undefined}
              />
              <div className="flex-1">
                <p className="font-bold text-white text-sm">
                  {activeRoom.userName}
                </p>
                <p className="text-[11px] text-gray-500">
                  {onlineUsers.has(activeRoom._id) ? (
                    <span className="text-green-400">Đang online</span>
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
              <button
                onClick={closeRoom}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-gray-800 hover:border-red-500/30"
              >
                <CheckCheck size={14} />
                Đóng hội thoại
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => (
                <MsgBubble key={msg._id} msg={msg} />
              ))}
              {typingRooms.has(activeRoom._id) && (
                <div className="flex items-center gap-2">
                  <Avatar
                    name={activeRoom.userName}
                    src={activeRoom.userAvatar || undefined}
                  />
                  <div className="bg-white/10 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-gray-950 border-t border-gray-800 shrink-0">
              <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendText();
                    }
                    socketRef.current?.emit("typing", {
                      roomId: activeRoomId,
                    });
                  }}
                  placeholder={`Trả lời ${activeRoom.userName}...`}
                  maxLength={1000}
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500 py-1"
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
                  disabled={uploading}
                  className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  {uploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ImageIcon size={18} />
                  )}
                </button>
                <button
                  onClick={sendText}
                  disabled={!draft.trim() || sending}
                  className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center disabled:opacity-40 hover:bg-pink-500 transition-colors shrink-0"
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
