import data from "../../data/cajun-connection.json";

export const cajunCategories = [
  "Seasonings & Spices",
  "Cooking Supplies",
  "Specialty Ingredients",
  "Local Products",
  "Restaurants/Food Vendors",
] as const;

export type CajunCategory = (typeof cajunCategories)[number];

export type CajunBusiness = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: CajunCategory;
  categories: CajunCategory[];
  location: string;
  website: string;
  socials: Partial<Record<"facebook" | "instagram" | "tiktok" | "youtube", string>>;
  logo: string;
  coverPhoto: string;
  tags: string[];
  offerings: string[];
  featured: boolean;
  createdAt: string;
};

export type CajunFluencer = {
  slug: string;
  name: string;
  bio: string;
  specialty: string;
  specialtyTags: string[];
  location: string;
  profilePhoto: string;
  featuredContent: Array<{ title: string; url: string }>;
  socials: Partial<Record<"facebook" | "instagram" | "tiktok" | "youtube", { url: string; followers: number }>>;
  validation: {
    followersOver1k: boolean;
    cajunContentOver50: boolean;
    activeLast30Days: boolean;
    louisianaConnection: boolean;
    legitimateAccount: boolean;
  };
  verified: boolean;
};

export const cajunConnectionData = data as {
  businesses: CajunBusiness[];
  influencers: CajunFluencer[];
};

export const platformLabels = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
} as const;

export function totalFollowers(fluencer: CajunFluencer) {
  return Object.values(fluencer.socials).reduce((sum, platform) => sum + (platform?.followers ?? 0), 0);
}

export function isFeaturedFluencer(fluencer: CajunFluencer) {
  return Object.values(fluencer.socials).some((platform) => (platform?.followers ?? 0) >= 10000);
}

export function formatFollowers(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}
