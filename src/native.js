// iOS app (Capacitor) glue. Does nothing on the web.
//
// Inside the app's web view, the browser share sheet, window.open() and
// target="_blank" links don't reach WhatsApp, Maps, Calendar or Safari on their own.
// Route them through Capacitor's native Share and App Launcher plugins so every
// existing call site keeps working unchanged.
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { AppLauncher } from "@capacitor/app-launcher";

export const isNative = Capacitor.isNativePlatform();

if (isNative && typeof window !== "undefined") {
  document.documentElement.classList.add("native");

  const openExternal = (href) => {
    try { AppLauncher.openUrl({ url: new URL(href, window.location.href).href }).catch(() => {}); } catch { /* bad URL */ }
  };

  // window.open(url) → Safari, or the matching app (wa.me opens WhatsApp).
  window.open = (url) => { if (url) openExternal(String(url)); return null; };

  // Links that leave the app (website, TikTok, Google Calendar, Maps…).
  document.addEventListener("click", (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (!href || href.startsWith("#")) return;
    let url; try { url = new URL(href, window.location.href); } catch { return; }
    if (url.origin === window.location.origin) return;
    e.preventDefault();
    openExternal(url.href);
  }, true);

  // navigator.share → the iOS share sheet (WhatsApp, Messages, AirDrop…).
  navigator.share = (data = {}) => Share.share({ title: data.title, text: data.text, url: data.url, dialogTitle: data.title });
  navigator.canShare = () => true;
}
