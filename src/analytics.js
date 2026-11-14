import mixpanel from "mixpanel-browser";

// Mixpanel project tokens are public by design (they ship in the bundle), so
// a fallback here is fine. Override per-environment with VITE_MIXPANEL_TOKEN.
const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || "82e7ac35c9104625a38ee658da1e898a";
// Set VITE_MIXPANEL_HOST=https://api-eu.mixpanel.com if the project is EU-resident.
const HOST = import.meta.env.VITE_MIXPANEL_HOST;

let ready = false;
try {
  if (typeof window !== "undefined" && TOKEN) {
    mixpanel.init(TOKEN, {
      ...(HOST ? { api_host: HOST } : {}),
      persistence: "localStorage",
      track_pageview: false,
      ip: false,
      // UK GDPR / PECR: nothing is recorded until the user opts in via the banner.
      opt_out_tracking_by_default: true,
    });
    ready = true;
  }
} catch { /* analytics must never break the app */ }

export function mp(event, props = {}) {
  if (!ready) return;
  try { mixpanel.track(event, props); } catch {}
}

// Supabase user id only — never the email — so the Mixpanel profile holds no PII.
export function mpIdentify(userId) {
  if (!ready || !userId) return;
  try { mixpanel.identify(userId); } catch {}
}

export function mpReset() {
  if (!ready) return;
  try { mixpanel.reset(); } catch {}
}

export function deviceType() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  return "desktop_web";
}

export function utm() {
  const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  return { utm_source: p.get("utm_source") || undefined, utm_campaign: p.get("utm_campaign") || undefined };
}

const CONSENT_KEY = "cl_analytics_consent";

// Returns "granted", "denied" or null (not asked yet).
export function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

export function setConsent(granted) {
  try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch {}
  if (!ready) return;
  try { granted ? mixpanel.opt_in_tracking() : mixpanel.opt_out_tracking(); } catch {}
}

// Re-apply a previously saved choice on every page load.
if (ready && getConsent() === "granted") {
  try { mixpanel.opt_in_tracking(); } catch {}
}
