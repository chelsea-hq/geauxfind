// background.js — service worker. Receives capture requests from content
// script and POSTs to the GeauxFind /api/admin/parse-thread endpoint with
// the stored admin token. Cross-origin fetches are unrestricted from the
// service worker (subject to host_permissions in manifest.json).

const DEFAULT_ENDPOINT = "https://geauxfind.vercel.app/api/admin/parse-thread";

async function getConfig() {
  const stored = await chrome.storage.local.get(["adminToken", "endpoint"]);
  return {
    adminToken: stored.adminToken || "",
    endpoint: stored.endpoint || DEFAULT_ENDPOINT,
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "GEAUXFIND_CAPTURE") return;

  (async () => {
    try {
      const { adminToken, endpoint } = await getConfig();
      if (!adminToken) {
        sendResponse({
          ok: false,
          error: "No admin token set. Click the extension icon and paste your token.",
        });
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          topic: msg.topic,
          content: msg.content,
          sourceUrl: msg.sourceUrl,
          commit: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        sendResponse({ ok: false, error: data?.error || `HTTP ${res.status}` });
        return;
      }
      sendResponse({ ok: true, result: data });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || "Network error" });
    }
  })();

  return true; // keep channel open for async sendResponse
});
