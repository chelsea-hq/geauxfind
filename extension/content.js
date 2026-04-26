// content.js — runs on facebook.com pages.
//
// Two modes:
//   MANUAL   : floating "Send to GeauxFind" button. Click → captures
//              the visible thread, prompts for topic, posts to admin API.
//   AUTO     : when chrome.storage.local.autoCapture is true, the
//              extension watches FB threads as you scroll past them and
//              auto-captures any thread matching a "best of / where can
//              I find" pattern. Dedupes by URL hash so the same thread
//              never gets captured twice.
//
// Auto mode is what makes this an autonomous private-FB-group pipeline:
// you browse Lafayette Foodies / Acadiana Eats normally, the extension
// silently extracts every "best gumbo" thread it sees, no clicks needed.
// Same TOS risk profile as scrolling FB: it only reads visible text.

(function () {
  if (window.__geauxfindInjected) return;
  window.__geauxfindInjected = true;

  const BTN_ID = "geauxfind-capture-btn";
  const TOAST_ID = "geauxfind-toast";
  const STATUS_ID = "geauxfind-status";
  const SEEN_KEY = "geauxfindSeenThreads";
  const SEEN_TTL_DAYS = 90;

  // What counts as a "best of / where to find" thread worth capturing.
  // Tuned to fire on real recommendation questions, skip promo posts.
  const TRIGGER_REGEX =
    /\b(best\s+\w+\s+(?:in|near|around)|favorite\s+\w+|where\s+(?:can\s+i|do\s+you|to\s+(?:find|get|buy|eat)|should\s+i)|recommend(?:ation)?s?\s+for|anyone\s+(?:tried|know)|need\s+(?:a\s+)?(?:good|great)|y'?all\s+(?:got|know)|looking\s+for\s+(?:a\s+)?good)\b/i;

  // Minimum thread length (chars) before we consider auto-capture —
  // ensures the post has comments/replies, not just an unanswered question.
  const MIN_AUTO_TEXT = 600;

  // ────────────────────────── UI helpers ──────────────────────────

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
    btn.addEventListener("click", onManualCapture);
    return btn;
  }

  function makeStatusPill() {
    const pill = document.createElement("div");
    pill.id = STATUS_ID;
    Object.assign(pill.style, {
      position: "fixed",
      right: "20px",
      bottom: "70px",
      zIndex: "2147483647",
      padding: "4px 10px",
      borderRadius: "999px",
      background: "rgba(0,0,0,0.7)",
      color: "rgba(255,255,255,0.85)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11px",
      fontWeight: "500",
      pointerEvents: "none",
      transition: "opacity 0.2s ease",
    });
    return pill;
  }

  function setStatusPill(text) {
    let pill = document.getElementById(STATUS_ID);
    if (!pill) {
      pill = makeStatusPill();
      document.body.appendChild(pill);
    }
    if (text) {
      pill.textContent = text;
      pill.style.opacity = "1";
    } else {
      pill.style.opacity = "0";
    }
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
      bottom: "100px",
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

  // ────────────────────────── Thread extraction ──────────────────────────

  function findThreadRoot() {
    const articles = document.querySelectorAll('[role="article"]');
    if (!articles.length) return document.body;
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
    return best.closest('[role="main"]') || best.parentElement || best;
  }

  function extractText(root) {
    const raw = root.innerText || root.textContent || "";
    const cleaned = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
    return cleaned.slice(0, 50000);
  }

  function suggestTopic(text) {
    const head = text.slice(0, 500).toLowerCase();
    const m = head.match(
      /\b(best|favorite|top|where (?:can|to (?:find|get)))\s+(?:place\s+(?:for\s+)?)?([a-z][a-z\s'-]{2,40})\b/,
    );
    if (m && m[2]) return `best ${m[2].trim().replace(/\s+/g, " ")}`;
    return "";
  }

  // ────────────────────────── Dedupe (local) ──────────────────────────

  function urlHash(url) {
    // Stable id for deduping the same thread across visits. Strips
    // tracking params + fragments so re-views don't re-capture.
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  // Seen entries store both timestamp AND text length so we can
  // re-capture when the user expands "View more comments" and the
  // visible thread grows. Format: { ts: number, len: number }.
  async function loadSeen() {
    const got = await chrome.storage.local.get(SEEN_KEY);
    const seen = got[SEEN_KEY] || {};
    const cutoff = Date.now() - SEEN_TTL_DAYS * 24 * 60 * 60 * 1000;
    for (const k of Object.keys(seen)) {
      // Migrate old number-only entries to new shape
      if (typeof seen[k] === "number") seen[k] = { ts: seen[k], len: 0 };
      if ((seen[k]?.ts ?? 0) < cutoff) delete seen[k];
    }
    return seen;
  }

  async function markSeen(hash, len) {
    const seen = await loadSeen();
    seen[hash] = { ts: Date.now(), len: len || 0 };
    await chrome.storage.local.set({ [SEEN_KEY]: seen });
  }

  // Returns "fresh" | "grown" | "stale".
  // grown = previously captured but text expanded ≥50% (user clicked
  // "View more comments") → re-capture to refresh mention counts.
  async function captureState(hash, currentLen) {
    const seen = await loadSeen();
    const entry = seen[hash];
    if (!entry) return "fresh";
    const prevLen = entry.len || 0;
    if (currentLen >= prevLen * 1.5 && currentLen - prevLen >= 400) return "grown";
    return "stale";
  }

  // ────────────────────────── Capture flows ──────────────────────────

  async function postToGeauxFind({ topic, text, sourceUrl, silent }) {
    if (!silent) showToast("Sending to GeauxFind…", "info");
    const response = await chrome.runtime.sendMessage({
      type: "GEAUXFIND_CAPTURE",
      topic,
      content: text,
      sourceUrl,
    });
    if (!response || !response.ok) {
      const msg = response?.error || "Capture failed. Check token.";
      if (!silent) showToast("✗ " + msg, "error");
      return null;
    }
    return response.result;
  }

  async function onManualCapture() {
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

      const r = await postToGeauxFind({
        topic: topic.trim(),
        text,
        sourceUrl: location.href,
        silent: false,
      });
      if (!r) return;

      await markSeen(urlHash(location.href), text.length);
      const lines = [`✓ Saved "${r.topic.name}"`, `${r.placesFound} businesses · ${r.absoluteMentions} mentions`];
      if (r.topic.topBusinesses?.length) {
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

  let autoCaptureRunning = false;
  async function tryAutoCapture() {
    if (autoCaptureRunning) return;
    autoCaptureRunning = true;
    try {
      // Only run on actual thread-like URLs (post permalinks, group posts)
      const path = location.pathname;
      const looksLikeThread =
        /\/(posts|permalink|story|groups)\//i.test(path) || /\/groups\/[^/]+\/(posts|permalink)/i.test(path);
      if (!looksLikeThread) return;

      const root = findThreadRoot();
      const text = extractText(root);
      if (text.length < MIN_AUTO_TEXT) return;

      // Use the head of the thread to test the recommendation pattern —
      // captures only "where to find / best X" style threads.
      const head = text.slice(0, 800);
      if (!TRIGGER_REGEX.test(head)) return;

      const hash = urlHash(location.href);
      const state = await captureState(hash, text.length);
      if (state === "stale") {
        setStatusPill("● already captured");
        setTimeout(() => setStatusPill(""), 2000);
        return;
      }

      const topic = suggestTopic(text) || "best of acadiana";

      const verb = state === "grown" ? "re-capturing (more comments)" : "auto-capturing";
      setStatusPill(`◐ ${verb}: ${topic}…`);
      const r = await postToGeauxFind({ topic, text, sourceUrl: location.href, silent: true });
      if (!r) {
        setStatusPill("✗ auto-capture failed");
        setTimeout(() => setStatusPill(""), 3000);
        return;
      }
      await markSeen(hash, text.length);
      const prefix = state === "grown" ? "↻" : "✓";
      setStatusPill(`${prefix} captured: ${r.topic.name} (${r.placesFound} biz)`);
      setTimeout(() => setStatusPill(""), 5000);
    } catch (err) {
      setStatusPill(`✗ ${(err?.message || "err").slice(0, 40)}`);
      setTimeout(() => setStatusPill(""), 3000);
    } finally {
      autoCaptureRunning = false;
    }
  }

  // ────────────────────────── Lifecycle ──────────────────────────

  function inject() {
    if (document.getElementById(BTN_ID)) return;
    if (!document.body) return;
    document.body.appendChild(makeButton());
  }

  let autoEnabled = false;
  let scanTimer = null;

  function scheduleScan(delay = 1500) {
    if (!autoEnabled) return;
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(tryAutoCapture, delay);
  }

  async function refreshAutoSetting() {
    const got = await chrome.storage.local.get("autoCapture");
    autoEnabled = !!got.autoCapture;
    if (autoEnabled) scheduleScan(2500);
  }

  // React to popup toggling auto mode
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if ("autoCapture" in changes) {
      autoEnabled = !!changes.autoCapture.newValue;
      if (autoEnabled) scheduleScan(1000);
    }
  });

  // SPA navigation re-trigger
  let lastUrl = location.href;
  const navObs = new MutationObserver(() => {
    inject();
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      scheduleScan(2000);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      inject();
      refreshAutoSetting();
      navObs.observe(document.documentElement, { childList: true, subtree: false });
    });
  } else {
    inject();
    refreshAutoSetting();
    navObs.observe(document.documentElement, { childList: true, subtree: false });
  }

  // Also re-scan on scroll (debounced) so threads scrolled into view
  // get checked even without URL change.
  let scrollTimer = null;
  window.addEventListener(
    "scroll",
    () => {
      if (!autoEnabled) return;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(tryAutoCapture, 1500);
    },
    { passive: true },
  );
})();
