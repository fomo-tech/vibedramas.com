"use client";

import { useState } from "react";
import {
  Download,
  Share,
  Home,
  Check,
  Smartphone,
  ChevronRight,
} from "lucide-react";

export default function IOSInstallPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Mở Safari",
      description:
        "Truy cập Vibe Drama bằng trình duyệt Safari trên iPhone/iPad của bạn",
      icon: <Smartphone className="w-12 h-12 text-vibe-pink" />,
    },
    {
      title: "Nhấn nút Share",
      description:
        "Chạm vào biểu tượng Share (chia sẻ) ở thanh công cụ phía dưới",
      icon: <Share className="w-12 h-12 text-vibe-pink" />,
    },
    {
      title: "Chọn 'Add to Home Screen'",
      description:
        "Cuộn xuống và tìm tùy chọn 'Add to Home Screen' (Thêm vào Màn hình chính)",
      icon: <Download className="w-12 h-12 text-vibe-pink" />,
    },
    {
      title: "Xác nhận",
      description: "Nhấn 'Add' (Thêm) ở góc trên bên phải để hoàn tất",
      icon: <Check className="w-12 h-12 text-green-500" />,
    },
    {
      title: "Hoàn thành!",
      description:
        "Biểu tượng Vibe Drama sẽ xuất hiện trên màn hình chính của bạn. Nhấn vào để mở app!",
      icon: <Home className="w-12 h-12 text-vibe-pink" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-vibe-pink to-orange-500 mb-6">
            <Download className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4">
            Cài đặt Vibe Drama trên iOS
          </h1>
          <p className="text-lg text-white/70">
            Trải nghiệm xem phim như một ứng dụng native với PWA
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border transition-all duration-300 ${
                currentStep === index
                  ? "border-vibe-pink bg-vibe-pink/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <button
                onClick={() => setCurrentStep(index)}
                className="w-full p-6 flex items-center gap-4 text-left"
              >
                {/* Step Number */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    currentStep === index
                      ? "bg-vibe-pink text-white"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/60">{step.description}</p>
                </div>

                {/* Icon */}
                <div className="flex-shrink-0">{step.icon}</div>
              </button>

              {/* Expanded Content */}
              {currentStep === index && (
                <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4 rounded-xl bg-black/30 border border-vibe-pink/20">
                    <p className="text-white/90 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Trước
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() =>
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
              }
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-vibe-pink to-orange-500 hover:shadow-xl hover:shadow-vibe-pink/40 text-white font-bold flex items-center gap-2 transition-all"
            >
              Tiếp theo
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <a
              href="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:shadow-green-500/40 text-white font-bold flex items-center gap-2 transition-all"
            >
              <Check className="w-5 h-5" />
              Về trang chủ
            </a>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-3">
            Tại sao nên cài đặt PWA?
          </h3>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Truy cập nhanh chóng từ màn hình chính</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Trải nghiệm toàn màn hình, không có thanh địa chỉ</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Hoạt động offline với cache thông minh</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Nhận thông báo về phim mới</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
