// Custom Next.js server with Socket.io for live chat
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Polyfills for older Node.js versions (e.g. Node 18 on VPS)
if (!Array.prototype.toSorted) {
  Object.defineProperty(Array.prototype, "toSorted", {
    value(compareFn) {
      return [...this].sort(compareFn);
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, "toReversed", {
    value() {
      return [...this].reverse();
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.toSpliced) {
  Object.defineProperty(Array.prototype, "toSpliced", {
    value(start, deleteCount, ...items) {
      const copy = [...this];
      copy.splice(start, deleteCount, ...items);
      return copy;
    },
    configurable: true,
    writable: true,
  });
}

// Load env by mode. dotenv supports `path` as string[] and loads in order.
const nodeEnv = process.env.NODE_ENV || "development";
const dotenvPaths =
  nodeEnv === "production"
    ? [".env.production.local", ".env.production", ".env.local", ".env"]
    : [".env.development.local", ".env.local", ".env.development", ".env"];
dotenv.config({ path: dotenvPaths });

// ── Telegram bot notification helper ──────────────────────────────────────
async function sendTelegramNotification(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch {}
}

const dev = nodeEnv !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── Mongoose models (inline to avoid TS imports) ───────────────────────────
function getModels() {
  const chatRoomSchema = new mongoose.Schema(
    {
      userId: { type: String, required: true, unique: true, index: true },
      userName: { type: String, required: true },
      userAvatar: { type: String, default: "" },
      lastMessage: { type: String, default: "" },
      lastMessageAt: { type: Date, default: Date.now },
      status: { type: String, enum: ["open", "closed"], default: "open" },
      adminUnread: { type: Number, default: 0 },
      userUnread: { type: Number, default: 0 },
    },
    { timestamps: true },
  );

  const chatMessageSchema = new mongoose.Schema(
    {
      roomId: { type: String, required: true, index: true },
      senderId: { type: String, required: true },
      senderName: { type: String, required: true },
      senderRole: { type: String, enum: ["user", "admin"], required: true },
      senderAvatar: { type: String, default: "" },
      content: { type: String, default: "" },
      imageUrl: { type: String },
      type: { type: String, enum: ["text", "image"], default: "text" },
    },
    { timestamps: true },
  );

  const ChatRoom =
    mongoose.models.ChatRoom || mongoose.model("ChatRoom", chatRoomSchema);
  const ChatMessage =
    mongoose.models.ChatMessage ||
    mongoose.model("ChatMessage", chatMessageSchema);

  return { ChatRoom, ChatMessage };
}

// ── JWT verification ────────────────────────────────────────────────────────
let joseModulePromise = null;

async function getJoseModule() {
  if (!joseModulePromise) {
    joseModulePromise = import("jose");
  }
  return joseModulePromise;
}

async function verifyToken(token) {
  try {
    const { jwtVerify } = await getJoseModule();
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[AUTH] CRITICAL: JWT_SECRET env var is not set.");
      return null;
    }
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

app.prepare().then(async () => {
  // Connect MongoDB
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected (socket server)");

  const { ChatRoom, ChatMessage } = getModels();

  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store io globally so API routes can emit events
  global.io = io;

  // ── Auth middleware ────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    console.log("[Socket.io] Auth middleware - token present:", !!token);

    if (!token) {
      console.log("[Socket.io] No token provided");
      return next(new Error("No token"));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      console.log("[Socket.io] Invalid token");
      return next(new Error("Invalid token"));
    }

    console.log(
      "[Socket.io] Token verified for user:",
      payload.userId,
      payload.role,
    );
    socket.data.userId = payload.userId;
    socket.data.userName = payload.name || payload.userId;
    socket.data.userAvatar = payload.avatar || "";
    socket.data.role = payload.role || "user";
    next();
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on("connection", async (socket) => {
    const { userId, userName, userAvatar, role } = socket.data;
    console.log(`Socket connected: ${userName} (${role})`);

    if (role === "admin") {
      // Admin joins the admin room to receive all updates
      socket.join("admin");
    } else {
      // Ensure room exists
      let room = await ChatRoom.findOne({ userId });
      if (!room) {
        room = await ChatRoom.create({ userId, userName, userAvatar });
      }
      const roomId = room._id.toString();
      socket.join(roomId);
      socket.data.roomId = roomId;

      // Notify admin of online user
      io.to("admin").emit("user_online", { roomId, userId });
    }

    // ── Send message ─────────────────────────────────────────────────────────
    socket.on("send_message", async (data, ack) => {
      try {
        const { content, imageUrl, type = "text" } = data;

        let roomId;
        if (role === "admin") {
          roomId = data.roomId;
          if (!roomId) return ack?.({ error: "Missing roomId" });
        } else {
          roomId = socket.data.roomId;
        }

        const msg = await ChatMessage.create({
          roomId,
          senderId: userId,
          senderName: userName,
          senderRole: role,
          senderAvatar: userAvatar,
          content: content || "",
          imageUrl,
          type: imageUrl ? "image" : type,
        });

        // Update room last message
        const updateData = {
          lastMessage: imageUrl ? "[Hình ảnh]" : content,
          lastMessageAt: new Date(),
          status: "open",
        };

        if (role === "admin") {
          Object.assign(updateData, { userUnread: 1 });
          // Reset admin's own unread
          await ChatRoom.updateOne(
            { _id: roomId },
            { ...updateData, adminUnread: 0 },
          );
        } else {
          // User message → increment adminUnread
          await ChatRoom.findOneAndUpdate(
            { userId },
            { ...updateData, $inc: { adminUnread: 1 } },
          );
        }

        const msgPlain = msg.toObject();

        // Broadcast to everyone in the room
        io.to(roomId).emit("new_message", msgPlain);

        // Updated rooms list for admin (only send room update, not duplicate message)
        const updatedRoom = await ChatRoom.findOne(
          role === "admin" ? { _id: roomId } : { userId },
        ).lean();
        io.to("admin").emit("room_updated", updatedRoom);

        // Notify admin via Telegram when user (not admin) sends a message
        if (role !== "admin") {
          const preview = imageUrl
            ? "[Hình ảnh]"
            : (content || "").slice(0, 100);
          sendTelegramNotification(
            `💬 <b>Tin nhắn CSKH mới</b>\n👤 User: <b>${userName}</b>\n📝 Nội dung: ${preview}`,
          );
        }

        ack?.({ ok: true, message: msgPlain });
      } catch (err) {
        console.error("send_message error:", err);
        ack?.({ error: "Server error" });
      }
    });

    // ── Typing indicator ──────────────────────────────────────────────────────
    socket.on("typing", (data) => {
      if (role === "admin") {
        io.to(data.roomId).emit("typing", { role: "admin" });
      } else {
        io.to("admin").emit("typing", {
          roomId: socket.data.roomId,
          role: "user",
        });
      }
    });

    // ── Admin: join specific room ─────────────────────────────────────────────
    socket.on("join_room", (roomId) => {
      if (role === "admin") {
        socket.join(roomId);
      }
    });

    // ── Admin: close room ────────────────────────────────────────────────────
    socket.on("close_room", async (roomId) => {
      if (role !== "admin") return;
      await ChatRoom.updateOne({ _id: roomId }, { status: "closed" });
      io.to(roomId).emit("room_closed");
      io.to("admin").emit("room_updated", { _id: roomId, status: "closed" });
    });

    socket.on("disconnect", () => {
      if (role !== "admin") {
        io.to("admin").emit("user_offline", { roomId: socket.data.roomId });
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
