#!/usr/bin/env node

function parseArgs(argv) {
  const out = {
    topic: "",
    text: "",
    source: "discord",
    endpoint: process.env.GEAUXFIND_INGEST_URL || "http://localhost:3000/api/community/ingest",
    apiKey: process.env.GEAUXFIND_INGEST_KEY || "",
  };

  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!value) continue;

    if (key === "--topic") out.topic = value;
    if (key === "--text") out.text = value;
    if (key === "--source") out.source = value;
    if (key === "--endpoint") out.endpoint = value;
    if (key === "--api-key") out.apiKey = value;

    if (["--topic", "--text", "--source", "--endpoint", "--api-key"].includes(key)) i++;
  }

  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.topic.trim()) {
    console.error("Missing required --topic");
    process.exit(1);
  }
  if (!args.text.trim()) {
    console.error("Missing required --text");
    process.exit(1);
  }
  if (!args.apiKey.trim()) {
    console.error("Missing ingest API key. Set GEAUXFIND_INGEST_KEY or pass --api-key.");
    process.exit(1);
  }

  const response = await fetch(args.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": args.apiKey,
    },
    body: JSON.stringify({
      topic: args.topic,
      content: args.text,
      source: args.source,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Ingest failed:", response.status, data);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error("Watcher failed:", err);
  process.exit(1);
});
