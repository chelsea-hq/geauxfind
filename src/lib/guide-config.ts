export type GuideGroup = "food-drink" | "things-to-do";
export type GuideGrouping = "none" | "day" | "month" | "city";

export type GuideCategoryConfig = {
  category: string;
  label: string;
  path: string;
  icon: string;
  title: string;
  description: string;
  group: GuideGroup;
  grouping?: GuideGrouping;
};

export const GUIDE_CATEGORY_LIST: GuideCategoryConfig[] = [
  { category: "happy-hour", label: "Happy Hours", path: "/happy-hours", icon: "🍻", title: "Happy Hours", description: "The most complete happy hour lineup in Acadiana — filtered by day and area.", group: "food-drink", grouping: "day" },
  { category: "daily-special", label: "Daily Specials", path: "/daily-specials", icon: "🍽️", title: "Daily Specials", description: "Find daily lunch and dinner specials across Lafayette and Acadiana.", group: "food-drink", grouping: "day" },
  { category: "late-night", label: "Late Night", path: "/late-night", icon: "🌙", title: "Late Night", description: "Find late-night eats and spots open after hours around Acadiana.", group: "food-drink", grouping: "none" },
  { category: "coffee", label: "Coffee", path: "/coffee", icon: "☕", title: "Coffee Shops", description: "Local coffee shops for work sessions, espresso runs, and weekend hangs.", group: "food-drink", grouping: "city" },
  { category: "brewery", label: "Breweries", path: "/breweries", icon: "🍺", title: "Breweries", description: "Taprooms, craft breweries, and beer-forward stops across Acadiana.", group: "food-drink", grouping: "city" },
  { category: "food-truck", label: "Food Trucks", path: "/food-trucks", icon: "🚚", title: "Food Trucks", description: "Track favorite local food trucks and where they typically pop up.", group: "food-drink", grouping: "city" },
  { category: "weekend-brunch", label: "Brunch", path: "/weekend-brunch", icon: "🥂", title: "Weekend Brunch", description: "Saturday and Sunday brunch across Acadiana — mimosas, Cajun classics, and good vibes.", group: "food-drink", grouping: "day" },
  { category: "kids-eat-free", label: "Kids Eat Free", path: "/kids-eat-free", icon: "🍽️", title: "Kids Eat Free", description: "Acadiana restaurants where kids eat free (or cheap!) organized by day.", group: "food-drink", grouping: "day" },
  { category: "whos-got-it", label: "Who's Got It", path: "/whos-got-it", icon: "👑", title: "Who's Got It", description: "Hot takes and contenders for the best local dishes in Acadiana.", group: "food-drink", grouping: "none" },

  { category: "live-music", label: "Live Music", path: "/live-music", icon: "🎵", title: "Live Music", description: "Cajun, zydeco, blues, and beyond — live music across Acadiana.", group: "things-to-do", grouping: "day" },
  { category: "dance-hall", label: "Dance Halls", path: "/dance-halls", icon: "💃", title: "Dance Halls", description: "Cajun and zydeco dance halls with lessons, live bands, and local history.", group: "things-to-do", grouping: "none" },
  { category: "festival", label: "Festivals", path: "/festivals", icon: "🎪", title: "Festivals", description: "Festival calendar highlights from Lafayette and around Acadiana.", group: "things-to-do", grouping: "month" },
  { category: "outdoor", label: "Outdoor", path: "/outdoor", icon: "🌿", title: "Outdoor Adventures", description: "Outdoor activities, parks, paddles, and nature stops around Acadiana.", group: "things-to-do", grouping: "city" },
  { category: "photo-spot", label: "Photo Spots", path: "/photo-spots", icon: "📸", title: "Photo Spots", description: "Scenic and iconic local spots for your next photo walk.", group: "things-to-do", grouping: "city" },
  { category: "date-night", label: "Date Night", path: "/date-night", icon: "❤️", title: "Date Night", description: "Curated date-night ideas with food, activities, and vibes.", group: "things-to-do", grouping: "none" },
  { category: "farmers-market", label: "Farmers Markets", path: "/farmers-markets", icon: "🥕", title: "Farmers Markets", description: "Farmers markets for produce, local goods, and weekend strolls.", group: "things-to-do", grouping: "day" },
];

export const GUIDE_CATEGORIES = {
  "food-drink": {
    label: "Food & Drink",
    icon: "🍽️",
    items: GUIDE_CATEGORY_LIST.filter((item) => item.group === "food-drink"),
  },
  "things-to-do": {
    label: "Things to Do",
    icon: "🎭",
    items: GUIDE_CATEGORY_LIST.filter((item) => item.group === "things-to-do"),
  },
} as const;

export const GUIDE_BY_PATH = Object.fromEntries(
  GUIDE_CATEGORY_LIST.map((item) => [item.path, item]),
) as Record<string, GuideCategoryConfig>;

export const GUIDE_BY_CATEGORY = Object.fromEntries(
  GUIDE_CATEGORY_LIST.map((item) => [item.category, item]),
) as Record<string, GuideCategoryConfig>;
