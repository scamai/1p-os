"use client";

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    swRegistration = registration;
    console.log("[1P OS] Service worker registered");
    return registration;
  } catch (err) {
    console.error("[1P OS] Service worker registration failed:", err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

export function sendLocalNotification(
  title: string,
  body: string,
  url?: string
): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  // Use service worker notification if available (works when app is backgrounded)
  if (swRegistration) {
    swRegistration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: url || "/company" },
    });
    return;
  }

  // Fallback to basic Notification API
  const notification = new Notification(title, {
    body,
    icon: "/icon-192.png",
  });

  if (url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}
