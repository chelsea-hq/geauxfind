const DEFAULT_ENDPOINT = "https://geauxfind.vercel.app/api/admin/parse-thread";

const tokenEl = document.getElementById("token");
const endpointEl = document.getElementById("endpoint");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

async function load() {
  const stored = await chrome.storage.local.get(["adminToken", "endpoint"]);
  tokenEl.value = stored.adminToken || "";
  endpointEl.value = stored.endpoint || DEFAULT_ENDPOINT;
}

function setStatus(text, ok) {
  statusEl.textContent = text;
  statusEl.className = "status " + (ok ? "ok" : "err");
  if (text) setTimeout(() => (statusEl.textContent = ""), 3500);
}

saveBtn.addEventListener("click", async () => {
  const adminToken = tokenEl.value.trim();
  const endpoint = (endpointEl.value.trim() || DEFAULT_ENDPOINT).replace(/\/+$/, "");
  if (!adminToken) {
    setStatus("Token required.", false);
    return;
  }
  await chrome.storage.local.set({ adminToken, endpoint });
  setStatus("Saved.", true);
});

load();
