import path from "node:path";

export type CommunityBusiness = {
  slug: string;
  name: string;
  category?: string;
  categories?: string[];
  location?: string | null;
  address?: string | null;
  mentionCount?: number;
  highlights?: string[];
  source?: string;
  sourceThread?: string;
  threads?: string[];
  rank?: number | null;
  tags?: string[];
  specialNotes?: string | null;
};

export type CommunityTopic = {
  slug: string;
  name: string;
  category: string;
  businessCount: number;
  totalMentions: number;
  topBusinesses: Array<{ slug: string; name: string; mentionCount: number }>;
};

export type CommunityRecsData = {
  topics: CommunityTopic[];
  businesses: CommunityBusiness[];
  generatedAt?: string;
  [key: string]: unknown;
};

export type TopicMeta = {
  slug: string;
  name: string;
  category: string;
};

export const TOPIC_CONFIG: Record<string, TopicMeta> = {
  "chicken-salad-raw": {
    slug: "best-chicken-salad-in-acadiana",
    name: "Best Chicken Salad in Acadiana",
    category: "Chicken Salad",
  },
  "sushi-raw": {
    slug: "best-sushi-in-lafayette",
    name: "Best Sushi in Lafayette",
    category: "Sushi",
  },
  "mexican-food-raw": {
    slug: "best-mexican-food-in-lafayette",
    name: "Best Mexican Food in Lafayette",
    category: "Mexican Food",
  },
  "seafood-gumbo-raw": {
    slug: "best-seafood-gumbo-in-lafayette-area",
    name: "Best Seafood Gumbo in Lafayette Area",
    category: "Seafood Gumbo",
  },
};

const MANUAL_ALIASES: Record<string, string[]> = {
  "chops-specialty-meats": ["chops", "chops specialty"],
  "champagnes-market": ["champagne", "champagnes"],
  "little-verons": ["little verons", "verons", "verons on rena"],
  "mamas-fried-chicken": ["mamas fried chicken", "mamas fried", "mama fried"],
  "earls-cajun-market": ["earls", "earls on verot"],
  "rods-supermarket": ["rods", "rods in church point"],
  "rouses-market": ["rouses", "rouses markets"],
  "nunus-fresh-market": ["nunus", "nunu", "nunus in youngsville"],
  "chicken-salad-chick": ["chicken salad chick"],
  "sweet-envie-llc": ["sweet envie"],
  adriens: ["adriens", "adrians", "adrien", "adriens on congress", "adriens congress"],
  "la-marche": ["le marche", "la marche", "le marche in maurice"],
  billeauds: ["billeauds", "billeaud"],
  "heberts-specialty-meats": ["heberts", "heberts in breaux bridge", "heberts specialty"],
  russells: ["russells", "russells in arnaudville"],
  "fuji-sushi-house": ["fuji", "fuji sushi", "fujisushi"],
  "minami-sushi-bar": ["minami", "minami downtown"],
  "ahi-sushi-japanese-cuisine-and-bar": ["ahi", "ahi sushi"],
  "rock-n-sake": ["rock n sake", "rock and sake", "rock-n-sake"],
  "fishbox-sushi": ["fishbox", "fish box", "fishbox sushi"],
  "nhi-taste-of-asia": ["nhi", "nhi taste of asia"],
  "oishi-sushi": ["oishi"],
  "rawz-bistro": ["rawz", "rawz bistro"],
  "sushi-roxx": ["sushi roxx", "sushi rocks"],
  osaka: ["osaka lafayette", "osaka"],
  saketini: ["saketini", "saketini in broussard"],
  "samurai-ambassador": ["samurai", "samarai", "samauri"],
  "sushi-masa-lafayette": ["sushi masa", "sushi masa lafayette"],
  "yoka-japanese-sushi-bar": ["yoka", "yoka in youngsville"],
  "rachels-cafe": ["rachels", "rachael", "rachels cafe", "rachaels cafe", "racheal", "racheals", "racheals cafe"],
  "dons-seafood": ["dons", "dons seafood hut", "dons seafood"],
  "chriss-poboys": ["chris poboys", "chriss poboys", "chris poboy", "chris poor boy"],
  prejeans: ["prejeans", "prejeans cajun", "prejean"],
  "bon-creole": ["bon creole"],
  "chef-roys-frog-city-cafe": ["chef roys", "chef roys frog city", "chef roy"],
  "rascals-cajun-restaurant": ["rascals", "rascals in duson"],
  "la-cuisine-de-maman": ["la cuisine de maman", "cuisine de maman"],
  "zarape-tacos-y-gorditas": ["zarape", "zarapes", "zarape tacos"],
  "taqueria-el-mexicano": ["taqueria el mexicano", "el mexicano"],
  "mezcal-mexican-restaurant": ["mezcal"],
  "la-fiesta": ["la fiesta", "la fiesta in broussard"],
  "la-hacienda": ["la hacienda", "little hacienda"],
  "las-chismosas": ["las chismosas"],
};

const META_LINES = new Set(["Reply", "Share", "Edited", "See translation", "Like", "Comment"]);
const SKIP_PATTERNS = [
  /^anonymous\s+(member|participant)\s*\d*/i,
  /^no\s+photo\s+description/i,
  /^may\s+be\s+an\s+image/i,
  /^https?:\/\//,
  /^\d+[wdyhm]$/,
  /^\d+[wdyhm]\s*·\s*/,
  /^home\s*-/i,
  /^google\.com$/i,
  /^renaissance-market\.com$/i,
];
const NON_BUSINESS_STOPS = new Set([
  "make your own", "make it yourself", "following", "here for the comments", "i'm eating", "i asked", "it's one", "a place in", "not being", "all cajun", "all the food", "you're missing", "go to", "try it", "lol", "haha", "yes", "no", "same", "me too", "agreed", "this", "see comments", "comments", "no coffee",
]);
const ACADIANA_PLACES = new Set([
  "lafayette", "broussard", "youngsville", "scott", "carencro", "opelousas", "abbeville", "new iberia", "breaux bridge", "st martinville", "eunice", "rayne", "crowley", "kaplan", "arnaudville", "duson", "leonville", "church point", "sunset", "maurice", "lydia", "erath", "acadiana", "baton rouge", "destin",
]);
const ALIAS_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "up", "is", "its", "be", "as", "has", "bar", "grill", "inn", "place", "kitchen", "deli", "house", "cafe", "market", "store", "shop", "restaurant", "bistro", "chicken", "sushi", "seafood", "food", "fried", "smoked", "cajun", "pizza", "burger", "taco", "bbq", "meats", "meat", "fresh", "salad", "gumbo", "crawfish", "boudin", "creole", "specialty",
]);

export function normalize(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/[\u2019\u2018''`]/g, "")
    .replace(/'s\b/g, "s")
    .replace(/\b(in|on|at|near)\s+\w+(\s+\w+)?\s*$/i, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAliases(name: string, slug: string): Set<string> {
  const aliases = new Set<string>();
  const n = normalize(name);
  if (n.length >= 2) aliases.add(n);

  const words = n.split(" ").filter(Boolean);
  if (words.length > 0 && words[0].length >= 4 && !ALIAS_STOP_WORDS.has(words[0])) aliases.add(words[0]);
  if (words.length > 1 && !ALIAS_STOP_WORDS.has(words[0]) && !ALIAS_STOP_WORDS.has(words[1])) aliases.add(words.slice(0, 2).join(" "));

  for (const alias of MANUAL_ALIASES[slug] || []) {
    const n2 = normalize(alias);
    if (n2.length >= 2) aliases.add(n2);
  }

  return aliases;
}

export function parseSegments(text: string): string[][] {
  if (!text?.trim()) return [];

  const lines = text.split("\n").map((l) => l.trim());
  const segments: string[][] = [];
  let current: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (/^\d+[wdyhm]$/.test(line) || /^\d+[wdyhm]\s*·\s*/.test(line)) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      while (i + 1 < lines.length && (META_LINES.has(lines[i + 1]) || !lines[i + 1])) i++;
      continue;
    }

    if (META_LINES.has(line) || SKIP_PATTERNS.some((p) => p.test(line))) continue;
    current.push(line);
  }

  if (current.length > 0) segments.push(current);
  return segments;
}

function extractCandidates(segment: string[]): string[] {
  const candidates = new Set<string>();
  const contentLines = segment.slice(1);

  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed) candidates.add(trimmed);

    for (const part of trimmed.split(/\bor\b|\band\b|[,;&!|]+/gi).map((p) => p.trim()).filter((p) => p.length >= 2)) {
      candidates.add(part);
    }
  }

  const fullText = contentLines.join(" ").trim();
  if (fullText) candidates.add(fullText);
  return [...candidates];
}

function looksLikeBusinessName(s: string): boolean {
  const t = s.trim();
  if (t.length < 3 || t.length > 70) return false;
  if (NON_BUSINESS_STOPS.has(t.toLowerCase())) return false;
  if (ACADIANA_PLACES.has(t.toLowerCase())) return false;
  if (!/[a-zA-Z]{2,}/.test(t)) return false;
  if (/^(llc|inc|ltd|corp|co\.)\b/i.test(t)) return false;
  if (/\b(is|are|was|were|have|has|had|do|does|did|will|would|could|should|gets?|got|went|goes|said|says|think|know|makes?|made|tried|try|recommend|suggest|love|like|enjoy|been|going|want|need)\b/i.test(t)) return false;

  const words = t.split(/\s+/);
  if (words.length > 7) return false;

  const BUSINESS_WORDS = /\b(market|cafe|bistro|grill|kitchen|bar|sushi|seafood|poboy|meats|bakery|inn|house|grocery|food|fried|smoked|restaurant|pantry|deli|bbq|mart|store|brewery|winery|pizza|burger|taco|chicken|specialt)\b/i;
  if (words.length === 2 && !BUSINESS_WORDS.test(t)) {
    const [first, second] = words;
    if (/^[A-Z][a-z]{2,}$/.test(first) && /^[A-Z][a-z]{2,}$/.test(second)) return false;
  }

  return /^[A-Z]/.test(t);
}

export function slugify(s: string): string {
  return normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b(\w)/g, (c) => c.toUpperCase());
}

function countMentions(segments: string[][], knownBusinesses: CommunityBusiness[]) {
  const lookup = new Map<string, string>();
  for (const biz of knownBusinesses) {
    for (const alias of buildAliases(biz.name, biz.slug)) {
      if (alias.length >= 2 && !lookup.has(alias)) lookup.set(alias, biz.slug);
    }
  }

  const knownCounts = new Map<string, number>();
  const newCandidates = new Map<string, { name: string; count: number }>();

  for (const segment of segments) {
    const mentionedSlugs = new Set<string>();
    const mentionedNewKeys = new Set<string>();

    for (const candidate of extractCandidates(segment)) {
      const nc = normalize(candidate);
      if (!nc || nc.length < 2) continue;

      let matched = false;
      for (const [alias, slug] of lookup) {
        const aliasRe = alias.length >= 5 ? new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?:\\s|$)`) : null;

        if (
          nc === alias ||
          nc.startsWith(`${alias} `) ||
          alias.startsWith(`${nc} `) ||
          (aliasRe && aliasRe.test(nc)) ||
          (nc.length >= 5 && alias.length >= 5 && alias.includes(nc))
        ) {
          if (!mentionedSlugs.has(slug)) {
            mentionedSlugs.add(slug);
            knownCounts.set(slug, (knownCounts.get(slug) || 0) + 1);
          }
          matched = true;
          break;
        }
      }

      if (!matched && looksLikeBusinessName(candidate)) {
        const key = nc;
        if (!mentionedNewKeys.has(key)) {
          mentionedNewKeys.add(key);
          const existing = newCandidates.get(key);
          if (existing) existing.count++;
          else newCandidates.set(key, { name: candidate.trim(), count: 1 });
        }
      }
    }
  }

  return { knownCounts, newCandidates };
}

export function deriveTopicConfig(stem: string): TopicMeta {
  const name = stem.replace(/-raw$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    slug: `best-${stem.replace(/-raw$/, "")}-in-acadiana`,
    name: `Best ${name} in Acadiana`,
    category: name,
  };
}

export function topicFromInput(topic: string): TopicMeta {
  const clean = topic.trim();
  const safe = clean || "untitled";
  const stem = safe.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const normalized = safe.replace(/\s+/g, " ");
  const title = normalized.replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    slug: `best-${stem}-in-acadiana`,
    name: /^best\s/i.test(title) ? title : `Best ${title} in Acadiana`,
    category: title,
  };
}

function mergeKnownBusinesses(existing: CommunityRecsData): CommunityBusiness[] {
  const bizBySlug = new Map<string, CommunityBusiness>();
  for (const topic of existing.topics || []) {
    for (const tb of topic.topBusinesses || []) {
      if (!bizBySlug.has(tb.slug)) bizBySlug.set(tb.slug, { slug: tb.slug, name: tb.name });
    }
  }
  for (const biz of existing.businesses || []) bizBySlug.set(biz.slug, biz);
  return [...bizBySlug.values()];
}

export function processDumpContent(content: string, topicMeta: TopicMeta, knownBusinesses: CommunityBusiness[]) {
  const segments = parseSegments(content || "");
  const { knownCounts, newCandidates } = countMentions(segments, knownBusinesses);

  const allSlugs = new Set([...knownCounts.keys()]);

  const topBusinesses = [...allSlugs]
    .map((slug) => {
      const biz = knownBusinesses.find((b) => b.slug === slug);
      return { slug, name: biz?.name ?? slug, mentionCount: knownCounts.get(slug) ?? 0 };
    })
    .filter((b) => b.mentionCount > 0)
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 20);

  const newBusinessEntries: Array<{ slug: string; name: string; mentionCount: number }> = [];
  for (const [, info] of newCandidates) {
    if (info.count >= 2) {
      const s = slugify(info.name);
      if (!knownBusinesses.some((b) => b.slug === s)) {
        newBusinessEntries.push({ slug: s, name: toTitleCase(info.name), mentionCount: info.count });
      }
    }
  }

  const totalMentions = topBusinesses.reduce((sum, b) => sum + b.mentionCount, 0);
  return {
    topic: { ...topicMeta, businessCount: topBusinesses.length, totalMentions, topBusinesses },
    newBusinessEntries,
    rawSegmentCount: segments.length,
  };
}

export function upsertTopicFromContent(args: {
  existing: CommunityRecsData;
  topicMeta: TopicMeta;
  content: string;
  source?: string;
}) {
  const { existing, topicMeta, content, source = "facebook-group" } = args;
  const safeExisting: CommunityRecsData = {
    ...existing,
    topics: Array.isArray(existing?.topics) ? existing.topics : [],
    businesses: Array.isArray(existing?.businesses) ? existing.businesses : [],
  };

  const known = mergeKnownBusinesses(safeExisting);
  const { topic, newBusinessEntries } = processDumpContent(content, topicMeta, known);

  const updatedTopics = [...safeExisting.topics];
  const updatedBusinesses = [...safeExisting.businesses];
  const existingTopicIdx = updatedTopics.findIndex((t) => t.slug === topic.slug);
  const previousMentions = existingTopicIdx >= 0 ? updatedTopics[existingTopicIdx].totalMentions || 0 : 0;

  if (existingTopicIdx >= 0) updatedTopics[existingTopicIdx] = topic;
  else updatedTopics.push(topic);

  for (const nb of newBusinessEntries) {
    if (!updatedBusinesses.some((b) => b.slug === nb.slug)) {
      updatedBusinesses.push({
        slug: nb.slug,
        name: nb.name,
        category: topicMeta.category,
        categories: [topicMeta.category],
        location: "Lafayette, LA",
        address: null,
        mentionCount: nb.mentionCount,
        highlights: [],
        source,
        sourceThread: topicMeta.name,
        threads: [topicMeta.name],
        rank: null,
        tags: [],
        specialNotes: null,
      });
    }
  }

  for (const topBiz of topic.topBusinesses) {
    const bizIdx = updatedBusinesses.findIndex((b) => b.slug === topBiz.slug);
    if (bizIdx >= 0) {
      updatedBusinesses[bizIdx] = { ...updatedBusinesses[bizIdx], mentionCount: topBiz.mentionCount };
      if (!updatedBusinesses[bizIdx].threads?.includes(topicMeta.name)) {
        updatedBusinesses[bizIdx].threads = [...(updatedBusinesses[bizIdx].threads || []), topicMeta.name];
      }
    }
  }

  const output: CommunityRecsData = {
    ...safeExisting,
    generatedAt: new Date().toISOString(),
    topics: updatedTopics,
    businesses: updatedBusinesses,
  };

  return {
    output,
    topic,
    placesFound: topic.topBusinesses.length,
    newMentions: Math.max(topic.totalMentions - previousMentions, 0),
    absoluteMentions: topic.totalMentions,
  };
}

export function topicFromDumpFilename(filename: string): TopicMeta {
  const stem = path.basename(filename).replace(/\.txt$/, "");
  return TOPIC_CONFIG[stem] ?? deriveTopicConfig(stem);
}
