"use client";

import { create } from "zustand";

export interface ChatMsg {
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

interface ChatState {
  isOpen: boolean;
  roomId: string | null;
  messages: ChatMsg[];
  unread: number;
  isConnected: boolean;
  isTyping: boolean;

  setOpen: (v: boolean) => void;
  setRoomId: (id: string) => void;
  addMessage: (msg: ChatMsg) => void;
  setMessages: (msgs: ChatMsg[]) => void;
  setUnread: (n: number) => void;
  incUnread: () => void;
  setConnected: (v: boolean) => void;
  setTyping: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  roomId: null,
  messages: [],
  unread: 0,
  isConnected: false,
  isTyping: false,

  setOpen: (v) => set({ isOpen: v }),
  setRoomId: (id) => set({ roomId: id || null }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  setUnread: (n) => set({ unread: n }),
  incUnread: () => set((s) => ({ unread: s.unread + 1 })),
  setConnected: (v) => set({ isConnected: v }),
  setTyping: (v) => set({ isTyping: v }),
}));
