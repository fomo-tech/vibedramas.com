"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstaller() {
  useEffect(() => {
    const host = window.location.hostname;
    const isLocalHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    const isProduction = process.env.NODE_ENV === "production" && !isLocalHost;

    // In development, aggressively disable SW + caches to avoid stale bundles.
    if ("serviceWorker" in navigator && !isProduction) {
      const cleanupLocalPwa = async () => {
        try {
          const wasControlled = Boolean(navigator.serviceWorker.controller);
          const registrations = await navigator.serviceWorker.getRegistrations();
          const unregisterResults = await Promise.all(
            registrations.map((registration) => registration.unregister()),
          );

          if ("caches" in window) {
            const names = await caches.keys();
            await Promise.all(names.map((name) => caches.delete(name)));
          }

          // unregister() does not release the current tab immediately. Reload
          // exactly once so localhost is no longer controlled by the stale SW.
          const reloadKey = "vibe_local_sw_cleanup_reloaded";
          if (
            wasControlled &&
            unregisterResults.some(Boolean) &&
            sessionStorage.getItem(reloadKey) !== "1"
          ) {
            sessionStorage.setItem(reloadKey, "1");
            window.location.reload();
            return;
          }
          sessionStorage.removeItem(reloadKey);
        } catch (error) {
          console.warn("Local PWA cleanup failed:", error);
        }
      };

      void cleanupLocalPwa();
    }

    // Register service worker only in production
    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);
          registration.update().catch(() => {});
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    };

    if ("serviceWorker" in navigator && isProduction) {
      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker, { once: true });
      }
    }

    // Handle install prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;

      // Show custom install button/banner
      const installBtn = document.getElementById("pwa-install-btn");
      if (installBtn) {
        installBtn.style.display = "block";
        installBtn.addEventListener("click", async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installBtn.style.display = "none";
          }
        });
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Track if app was launched from home screen
    const handleAppInstalled = () => {
      console.log("PWA was installed");
      deferredPrompt = null;
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if running as standalone PWA
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    if (isStandalone) {
      console.log("Running as PWA");
    }

    return () => {
      window.removeEventListener("load", registerServiceWorker);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null; // This is a utility component
}
