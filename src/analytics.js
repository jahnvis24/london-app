import mixpanel from "mixpanel-browser";

// Mixpanel project tokens are public by design (they ship in the bundle), so
// a fallback here is fine. Override per-environment with VITE_MIXPANEL_TOKEN.
const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || "82e7ac35c9104625a38ee658da1e898a";
// The Mixpanel project is EU-resident, so events must go to the EU endpoint.
const HOST = import.meta.env.VITE_MIXPANEL_HOST || "https://api-eu.mixpanel.com";

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

// Events fired before the user answers the consent banner are held (this tab
// only) and sent if they say yes, dropped if they say no. Nothing leaves the
// device until consent is granted.
const QUEUE_KEY = "cl_mp_queue";
function readQueue() { try { return JSON.parse(sessionStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; } }
function writeQueue(q) { try { sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-60))); } catch {} }

export function mp(event, props = {}) {
  if (!ready) return;
  try {
    const c = getConsent();
    if (c === null) { writeQueue([...readQueue(), { event, props, time: Date.now() }]); return; }
    if (c === "granted") mixpanel.track(event, props);
  } catch {}
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
  try {
    if (granted) {
      mixpanel.opt_in_tracking();
      for (const q of readQueue()) mixpanel.track(q.event, { ...q.props, time: q.time / 1000 });
    } else mixpanel.opt_out_tracking();
    writeQueue([]);
  } catch {}
}

// Re-apply a previously saved choice on every page load.
if (ready && getConsent() === "granted") {
  try { mixpanel.opt_in_tracking(); } catch {}
}

// First-touch acquisition source, remembered for the life of the browser.
export function acquisitionSource() {
  try {
    const saved = localStorage.getItem("cl_mp_acq");
    if (saved) return saved;
    const p = new URLSearchParams(window.location.search);
    let src = p.get("utm_source") || (p.get("plan") ? "plan_share" : p.get("invite") ? "friend_invite" : p.get("blist") ? "bucket_list_invite" : null);
    if (!src) { try { src = document.referrer ? new URL(document.referrer).hostname : "direct"; } catch { src = "direct"; } }
    localStorage.setItem("cl_mp_acq", src);
    return src;
  } catch { return "unknown"; }
}

// Maps the app's free-form categories onto the tracking plan's save types.
export function saveType(cat) {
  const c = String(cat || "").toLowerCase();
  if (["restaurant", "cafe"].includes(c)) return "restaurant";
  if (["bar", "nightlife"].includes(c)) return "bar";
  if (c === "event") return "event";
  if (["experience", "outdoor", "museum", "gallery", "market"].includes(c)) return "activity";
  return "other";
}

// Remember a shared-plan link open so a later signup / first save can be
// credited back to it (share_link_converted).
export function rememberShareOpen(planId) {
  try { localStorage.setItem("cl_mp_share_open", JSON.stringify({ planId, ts: Date.now() })); } catch {}
}
export function shareConversion(step) {
  try {
    const raw = localStorage.getItem("cl_mp_share_open");
    if (!raw) return;
    const { planId, ts } = JSON.parse(raw);
    mp("share_link_converted", { plan_id: planId, converted_step: step, days_since_opened: Math.floor((Date.now() - ts) / 86400000) });
    if (step === "first_place_saved") localStorage.removeItem("cl_mp_share_open");
  } catch {}
}
