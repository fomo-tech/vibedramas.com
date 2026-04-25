/**
 * Telegram bot notification utility (server-side only)
 * Set TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID in .env to enable
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function sendTelegram(message: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // Non-critical, never throw
  }
}

export function fmtVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
