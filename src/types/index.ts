export type CategoryType = "food" | "events" | "music" | "recipes" | "finds";

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
  category: "food" | "music" | "finds";
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
  name: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  price: string;
  description: string;
  image: string;
  ticketLink: string;
  tags: string[];
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
