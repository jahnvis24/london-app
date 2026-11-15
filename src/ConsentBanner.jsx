import { useState } from "react";
import { getConsent, setConsent } from "./analytics.js";

// Small bottom banner asking for analytics consent. Hidden once answered.
export default function ConsentBanner() {
  const [answered, setAnswered] = useState(() => getConsent() !== null);
  if (answered) return null;
  const choose = (granted) => { setConsent(granted); setAnswered(true); };
  const btn = { flex: 1, padding: "10px", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" };
  return (
    <div role="dialog" aria-label="Analytics consent" style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 100000, maxWidth: 420, margin: "0 auto", background: "#3A0B14", color: "#FAF7F2", padding: "14px 16px", boxShadow: "0 6px 24px rgba(0,0,0,.3)" }}>
      <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
        Can we use anonymous analytics to see which features help? We never track your email or share your saves.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => choose(false)} style={{ ...btn, background: "transparent", color: "#FAF7F2", border: "1.5px solid rgba(250,247,242,.4)" }}>No thanks</button>
        <button onClick={() => choose(true)} style={{ ...btn, background: "#3A0B14", color: "#fff" }}>Allow</button>
      </div>
    </div>
  );
}
