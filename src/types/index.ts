export type CategoryType = "food" | "events" | "music" | "recipes" | "finds" | "outdoors" | "shopping";

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Place {
  slug: string;
  name: string;
  category: "food" | "music" | "finds" | "events" | "outdoors" | "shopping";
  cuisine?: string;
  city: string;
  rating: number;
  price: "$" | "$$" | "$$$";
  address: string;
  phone: string;
  website: string;
  hours: string[];
  description: string;
  image: string;
  gallery: string[];
  tags: string[];
  reviews: Review[];
  google_place_id?: string;
  google_maps_url?: string;
  photo_references?: string[];
  price_level?: string;
  smartTags?: string[];
  featured?: boolean;
  featuredReason?: string;
}

export interface Event {
  slug: string;
  title: string;
  date: string;
  endDate: string;
  time: string;
  venue: string;
  address: string | null;
  city: string;
  description: string;
  category: "music" | "food" | "festival" | "community" | "arts" | "sports" | "nightlife" | "family";
  image: string | null;
  link: string | null;
  source: "do337" | "lafayettetravel" | "eventbrite" | "facebook" | "developinglafayette" | "theadvertiser";
  free: boolean;
  price: string | null;
}

export interface Recipe {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prepTime: string;
  cookTime: string;
  servings: number;
  rating: number;
  image: string;
  inspiredBy: string;
  ingredients: string[];
  steps: string[];
}

export interface WhatsNewItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  url: string;
  excerpt: string;
  date: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  city?: string;
}

export type ClaimRole = "owner" | "manager" | "marketing";

export interface BusinessClaim {
  id: string;
  placeSlug: string;
  businessName: string;
  claimantName: string;
  email: string;
  phone: string;
  role: ClaimRole;
  status: "pending";
  createdAt: string;
}

export interface BusinessProfile {
  slug: string;
  description: string;
  phone: string;
  website: string;
  hours: string[];
  specials: { id: string; text: string; createdAt: string }[];
  updatedAt: string;
}

export interface AlertSubscription {
  id: string;
  email: string;
  types: string[];
  createdAt: string;
}

export interface CommunitySubmission {
  id: string;
  type: "Food tip" | "Hidden gem" | "Event" | "Review" | "Photo";
  placeSlug?: string;
  placeName: string;
  text: string;
  authorName: string;
  photoUrl?: string;
  moderation: "approved" | "queued" | "rejected";
  moderationReason?: string;
  createdAt: string;
}
