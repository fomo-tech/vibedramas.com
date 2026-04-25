"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function PWAUpdateBanner() {
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  const SW_VERSION_STORAGE_KEY = "vibe_sw_build_version";

  const isDevOrLocalHost = () => {
    if (process.env.NODE_ENV !== "production") return true;
    const host = window.location.hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    );
  };

  const readSwBuildVersion = async (): Promise<string | null> => {
    try {
      const res = await fetch(`/sw.js?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return null;
      const text = await res.text();
      const match = text.match(/BUILD_VERSION\s*=\s*["']([^"']+)["']/);
      return match?.[1] || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (isDevOrLocalHost()) {
      setShowModal(false);
      return;
    }
    if (!("serviceWorker" in navigator)) return;

    const handleUpdateFound = (reg: ServiceWorkerRegistration) => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          // New SW installed while an old one is active — update available
          setWaitingWorker(newWorker);
          setShowModal(true);
        }
      });
    };

    let interval: ReturnType<typeof setInterval> | null = null;

    navigator.serviceWorker.ready.then(async (reg) => {
      // Already waiting (e.g. page was open when update arrived)
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
        setShowModal(true);
      }

      const currentVersion = await readSwBuildVersion();
      if (currentVersion) {
        const seenVersion = localStorage.getItem(SW_VERSION_STORAGE_KEY);
        if (seenVersion && seenVersion !== currentVersion) {
          setShowModal(true);
        }
        localStorage.setItem(SW_VERSION_STORAGE_KEY, currentVersion);
      }

      reg.addEventListener("updatefound", () => handleUpdateFound(reg));

      // Check immediately after mount so user sees update modal right away
      reg.update().catch(() => {});

      // Periodically poll for updates
      interval = setInterval(
        () => {
          reg.update().catch(() => {});
        },
        5 * 60 * 1000,
      );
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const clearBrowserCaches = async () => {
    if (!("caches" in window)) return;
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  };

  const handleUpdate = async () => {
    setIsUpdating(true);

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
      {
        once: true,
      },
    );

    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }

    try {
      await clearBrowserCaches();
      const currentVersion = await readSwBuildVersion();
      if (currentVersion) {
        localStorage.setItem(SW_VERSION_STORAGE_KEY, currentVersion);
      }
    } catch {
      // Ignore cache API errors and continue reload flow
    }

    // Fallback reload in case controllerchange doesn't fire quickly
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100000 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.65)] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-linear-to-br from-vibe-pink to-vibe-orange flex items-center justify-center shadow-[0_4px_12px_rgba(255,69,0,0.35)]">
                <RefreshCw
                  size={18}
                  className={`text-white ${isUpdating ? "animate-spin" : ""}`}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  Có phiên bản mới
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Ứng dụng sẽ xóa cache cũ và tải lại tự động.
                </p>
              </div>
            </div>

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="mt-4 w-full px-4 py-3 rounded-xl bg-linear-to-r from-vibe-pink to-vibe-orange text-white text-sm font-black tracking-tight active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Đang cập nhật..." : "Cập nhật ngay"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
