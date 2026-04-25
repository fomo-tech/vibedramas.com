"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  X,
  Share,
  Plus,
  ArrowDown,
  CheckCircle,
  Sparkles,
  Zap,
} from "lucide-react";

// ─── Context ──────────────────────────────────────────────────────────────────
interface PWAContextType {
  showInstallModal: () => void;
  canInstall: boolean;
  isMobile: boolean;
}

const PWAContext = createContext<PWAContextType>({
  showInstallModal: () => {},
  canInstall: false,
  isMobile: false,
});

export const usePWA = () => useContext(PWAContext);

// ─── Provider ─────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    const mobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    setIsMobile(mobile);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const showInstallModal = useCallback(() => {
    if (!isMobile || isStandalone) return;
    setShowModal(true);
  }, [isMobile, isStandalone]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowModal(false);
        setDeferredPrompt(null);
      }
    }
  };

  const canInstall = isMobile && !isStandalone && (!!deferredPrompt || isIOS);

  return (
    <PWAContext.Provider value={{ showInstallModal, canInstall, isMobile }}>
      {children}

      {/* Install Modal */}
      <AnimatePresence>
        {showModal && !showIOSGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
              onClick={() => setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[9999] max-w-md mx-auto"
            >
              <div className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-vibe-pink/40 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(255,42,109,0.4)]">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-vibe-pink/5 via-transparent to-orange-500/5 animate-pulse pointer-events-none" />

                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 z-10 text-white/50 hover:text-white transition-colors"
                >
                  <X size={22} strokeWidth={2.5} />
                </button>

                <div className="relative p-8 pt-10">
                  {/* Icon */}
                  <div className="flex justify-center mb-5">
                    <motion.div
                      animate={{
                        rotate: [0, -5, 5, -5, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-vibe-pink/30 blur-3xl" />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-vibe-pink via-orange-500 to-rose-500 rounded-3xl flex items-center justify-center shadow-2xl">
                        <Download
                          className="w-12 h-12 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl font-black text-center mb-3 bg-gradient-to-r from-white via-vibe-pink to-white bg-clip-text text-transparent leading-tight">
                    Tải ứng dụng VibeDrama
                  </h3>

                  <p className="text-white/50 text-center mb-7 text-sm leading-relaxed">
                    Trải nghiệm như native app với hiệu suất tối ưu
                  </p>

                  {/* Features */}
                  <div className="space-y-3.5 mb-7">
                    {[
                      {
                        icon: Zap,
                        title: "Tốc độ cực nhanh",
                        desc: "Tải trang tức thì",
                      },
                      {
                        icon: Sparkles,
                        title: "Giao diện mượt mà",
                        desc: "Animations 60fps",
                      },
                      {
                        icon: CheckCircle,
                        title: "Dùng offline",
                        desc: "Xem phim không cần mạng",
                      },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3.5"
                      >
                        <div className="w-9 h-9 bg-vibe-pink/15 rounded-xl flex items-center justify-center shrink-0 border border-vibe-pink/20">
                          <item.icon
                            size={18}
                            className="text-vibe-pink"
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-white font-bold text-sm mb-0.5">
                            {item.title}
                          </p>
                          <p className="text-white/40 text-xs">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-vibe-pink via-orange-500 to-rose-500 hover:shadow-[0_0_40px_rgba(255,42,109,0.6)] text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 text-base"
                  >
                    <Download className="w-5 h-5" strokeWidth={2.5} />
                    Tải ngay
                  </button>

                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full mt-3 text-white/30 hover:text-white/50 text-sm font-bold py-2 transition-colors"
                  >
                    Để sau
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* iOS Guide */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-lg z-[9998]"
              onClick={() => {
                setShowIOSGuide(false);
                setShowModal(false);
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[9999] max-h-[90vh] overflow-hidden pb-[env(safe-area-inset-bottom,0px)]"
            >
              <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-t-2 border-vibe-pink/40 rounded-t-3xl shadow-[0_-10px_80px_rgba(255,42,109,0.4)]">
                {/* Handle */}
                <div className="flex justify-center pt-4 pb-3">
                  <div className="w-14 h-1.5 bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pb-5 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black text-white">
                      Cài đặt trên iPhone
                    </h3>
                    <button
                      onClick={() => {
                        setShowIOSGuide(false);
                        setShowModal(false);
                      }}
                      className="text-white/40 hover:text-white/80 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <p className="text-white/40 text-sm">3 bước đơn giản</p>
                </div>

                {/* Steps */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-5">
                  <div className="space-y-5 pb-6">
                    {[
                      {
                        icon: Share,
                        title: "1. Nhấn nút Chia sẻ",
                        desc: "Tìm biểu tượng Chia sẻ ở thanh dưới Safari",
                        visual: (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 border-2 border-blue-400 rounded-2xl flex items-center justify-center bg-blue-400/10">
                              <Share
                                size={28}
                                className="text-blue-400"
                                strokeWidth={2}
                              />
                            </div>
                            <ArrowDown
                              className="text-vibe-pink animate-bounce"
                              size={20}
                            />
                          </div>
                        ),
                      },
                      {
                        icon: Plus,
                        title: "2. Chọn 'Thêm vào Màn hình Chính'",
                        desc: "Cuộn xuống và tìm tùy chọn này trong menu",
                        visual: (
                          <div className="flex flex-col items-center gap-2">
                            <div className="bg-white/10 rounded-xl px-5 py-3 border border-white/10">
                              <div className="flex items-center gap-2.5">
                                <Plus
                                  size={20}
                                  className="text-blue-400"
                                  strokeWidth={2.5}
                                />
                                <span className="text-white/80 text-sm font-bold">
                                  Thêm vào Màn hình Chính
                                </span>
                              </div>
                            </div>
                            <ArrowDown
                              className="text-vibe-pink animate-bounce"
                              size={20}
                            />
                          </div>
                        ),
                      },
                      {
                        icon: CheckCircle,
                        title: "3. Nhấn 'Thêm'",
                        desc: "Xác nhận để hoàn tất cài đặt",
                        visual: (
                          <div className="flex flex-col items-center gap-2">
                            <button className="bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-black shadow-lg">
                              Thêm
                            </button>
                          </div>
                        ),
                      },
                    ].map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="relative border-2 border-vibe-pink/20 bg-vibe-pink/5 rounded-2xl p-5"
                      >
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-vibe-pink to-orange-500 rounded-full flex items-center justify-center text-white font-black shadow-lg border-4 border-zinc-950">
                          {i + 1}
                        </div>

                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <div className="w-14 h-14 bg-vibe-pink/20 rounded-2xl flex items-center justify-center border border-vibe-pink/30">
                              <step.icon
                                className="w-7 h-7 text-vibe-pink"
                                strokeWidth={2}
                              />
                            </div>
                          </div>

                          <div className="flex-1">
                            <h4 className="text-white font-black text-base mb-1.5">
                              {step.title}
                            </h4>
                            <p className="text-white/50 text-sm mb-4 leading-relaxed">
                              {step.desc}
                            </p>

                            <div className="relative w-full h-44 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
                              {step.visual}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 bg-gradient-to-t from-black/80 to-transparent border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowIOSGuide(false);
                      setShowModal(false);
                    }}
                    className="w-full bg-vibe-pink hover:bg-vibe-pink/90 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PWAContext.Provider>
  );
}
