// content.js — runs on facebook.com pages.
// Injects a floating "Send to GeauxFind" button. When clicked, grabs the
// visible thread text (post + comments), prompts for a topic name, and
// asks the background service worker to POST it to the GeauxFind API.

(function () {
  if (window.__geauxfindInjected) return;
  window.__geauxfindInjected = true;

  const BTN_ID = "geauxfind-capture-btn";
  const TOAST_ID = "geauxfind-toast";

  function makeButton() {
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.textContent = "Send to GeauxFind";
    btn.setAttribute("aria-label", "Capture this Facebook thread to GeauxFind");
    Object.assign(btn.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      zIndex: "2147483647",
      padding: "10px 16px",
      borderRadius: "999px",
      border: "none",
      background: "#A32929",
      color: "white",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 8px 24px rgba(163, 41, 41, 0.4)",
      transition: "transform 0.15s ease, opacity 0.15s ease",
    });
    btn.addEventListener("mouseenter", () => (btn.style.transform = "scale(1.04)"));
    btn.addEventListener("mouseleave", () => (btn.style.transform = "scale(1)"));
    btn.addEventListener("click", onCapture);
    return btn;
  }

  function showToast(text, kind) {
    const existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.textContent = text;
    Object.assign(toast.style, {
      position: "fixed",
      right: "20px",
      bottom: "80px",
      zIndex: "2147483647",
      padding: "12px 16px",
      maxWidth: "360px",
      borderRadius: "10px",
      background: kind === "error" ? "#7a1326" : "#1f3d1f",
      color: "white",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "13px",
      lineHeight: "1.4",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      whiteSpace: "pre-wrap",
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 7000);
  }

  function findThreadRoot() {
    // Strategy: walk up from the click target to a sensibly-large container.
    // FB's DOM has no stable IDs, but role="article" wraps each post.
    const articles = document.querySelectorAll('[role="article"]');
    if (!articles.length) return document.body;
    // The first/largest article in viewport is usually the thread we're on.
    let best = articles[0];
    let bestArea = 0;
    for (const a of articles) {
      const r = a.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
      const area = visible * r.width;
      if (area > bestArea) {
        best = a;
        bestArea = area;
      }
    }
    // Walk up to include comment trees that are siblings of the article.
    return best.closest('[role="main"]') || best.parentElement || best;
  }

  function extractText(root) {
    // Get visible text only — innerText respects display:none and CSS.
    const raw = root.innerText || root.textContent || "";
    // Trim each line, drop empty lines, cap at ~50K chars.
    const cleaned = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
    return cleaned.slice(0, 50000);
  }

  function suggestTopic(text) {
    // Look for "best [X]" or "where ... [X]" in the first 500 chars.
    const head = text.slice(0, 500).toLowerCase();
    const m = head.match(/\b(best|favorite|top|where (?:can|to (?:find|get)))\s+(?:place\s+(?:for\s+)?)?([a-z][a-z\s'-]{2,40})\b/);
    if (m && m[2]) {
      return `best ${m[2].trim().replace(/\s+/g, " ")}`;
    }
    return "";
  }

  async function onCapture() {
    const btn = document.getElementById(BTN_ID);
    if (btn) btn.disabled = true;

    try {
      const root = findThreadRoot();
      const text = extractText(root);
      if (text.length < 100) {
        showToast("Couldn't find a thread on this page. Open a specific FB post first.", "error");
        return;
      }

      const suggested = suggestTopic(text);
      const topic = window.prompt(
        "Topic name (e.g. 'best bread pudding' or 'where to find good boudin')",
        suggested,
      );
      if (!topic) return;

      showToast("Sending to GeauxFind…", "info");

      const response = await chrome.runtime.sendMessage({
        type: "GEAUXFIND_CAPTURE",
        topic: topic.trim(),
        content: text,
        sourceUrl: location.href,
      });

      if (!response || !response.ok) {
        const msg = response?.error || "Capture failed. Check your token in the extension popup.";
        showToast("✗ " + msg, "error");
        return;
      }

      const r = response.result;
      const lines = [
        `✓ Saved "${r.topic.name}"`,
        `${r.placesFound} businesses · ${r.absoluteMentions} mentions`,
      ];
      if (r.topic.topBusinesses && r.topic.topBusinesses.length) {
        const top3 = r.topic.topBusinesses.slice(0, 3).map((b, i) => `${i + 1}. ${b.name} (${b.mentionCount})`).join("\n");
        lines.push("\n" + top3);
      }
      showToast(lines.join("\n"), "success");
    } catch (err) {
      showToast("✗ " + (err && err.message ? err.message : "Unknown error"), "error");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function inject() {
    if (document.getElementById(BTN_ID)) return;
    if (!document.body) return;
    document.body.appendChild(makeButton());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
  // Re-inject if FB swaps the body (SPA navigation)
  const obs = new MutationObserver(() => inject());
  obs.observe(document.documentElement, { childList: true, subtree: false });
})();
