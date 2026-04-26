const DEFAULT_ENDPOINT = "https://geauxfind.vercel.app/api/admin/parse-thread";
const SEEN_KEY = "geauxfindSeenThreads";

const tokenEl = document.getElementById("token");
const endpointEl = document.getElementById("endpoint");
const autoEl = document.getElementById("auto");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");
const statsEl = document.getElementById("stats");

async function load() {
  const stored = await chrome.storage.local.get(["adminToken", "endpoint", "autoCapture", SEEN_KEY]);
  tokenEl.value = stored.adminToken || "";
  endpointEl.value = stored.endpoint || DEFAULT_ENDPOINT;
  autoEl.checked = !!stored.autoCapture;

  const seen = stored[SEEN_KEY] || {};
  const count = Object.keys(seen).length;
  if (count > 0) {
    const newest = Math.max(...Object.values(seen));
    const ago = Date.now() - newest;
    const mins = Math.round(ago / 60000);
    const fmt = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`;
    statsEl.textContent = `${count} thread${count === 1 ? "" : "s"} captured · last ${fmt}`;
  } else {
    statsEl.textContent = "No captures yet.";
  }
}

function setStatus(text, ok) {
  statusEl.textContent = text;
  statusEl.className = "status " + (ok ? "ok" : "err");
  if (text) setTimeout(() => (statusEl.textContent = ""), 3500);
}

// Auto-save the auto-capture toggle immediately so the content script
// reacts without waiting for the user to click Save.
autoEl.addEventListener("change", async () => {
  await chrome.storage.local.set({ autoCapture: autoEl.checked });
  setStatus(autoEl.checked ? "Auto-capture ON" : "Auto-capture OFF", true);
});

saveBtn.addEventListener("click", async () => {
  const adminToken = tokenEl.value.trim();
  const endpoint = (endpointEl.value.trim() || DEFAULT_ENDPOINT).replace(/\/+$/, "");
  if (!adminToken) {
    setStatus("Token required.", false);
    return;
  }
  await chrome.storage.local.set({
    adminToken,
    endpoint,
    autoCapture: autoEl.checked,
  });
  setStatus("Saved.", true);
});

load();
