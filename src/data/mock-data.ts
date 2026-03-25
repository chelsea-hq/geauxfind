import seedData from "../../scripts/seed-data.json";
import { Event, Place, Recipe } from "@/types";

export const places: Place[] = seedData.places as Place[];

export const events: Event[] = [
  {
    slug: "boudin-cook-off-scott",
    name: "Scott Boudin Festival",
    date: "2026-03-27",
    time: "6:00 PM",
    city: "Scott",
    venue: "Scott City Park",
    price: "$20",
    description: "Local pitmasters and boudin makers compete for Acadiana boudin bragging rights in Scott, the Boudin Capital of the World.",
    image: "https://scottboudinfestival.com/files/2024/12/0K6A8873.jpg",
    ticketLink: "https://scottboudinfestival.com",
    tags: ["food", "competition", "boudin"]
  },
  {
    slug: "downtown-alive-lafayette",
    name: "Downtown Alive!",
    date: "2026-03-27",
    time: "7:30 PM",
    city: "Lafayette",
    venue: "Parc Sans Souci",
    price: "Free",
    description: "A First Friday outdoor concert series presented by Evangeline Maid that brings downtown Lafayette to life with local and national acts.",
    image: "https://images.squarespace-cdn.com/content/v1/697a3b0daca38f0f7443529d/44f6f0d0-e402-458a-a7dc-3d11dc6a4479/2025-Lafayette-Blue-Moon-Saloon-5122.jpg?format=1500w",
    ticketLink: "https://www.downtownlafayette.org/downtown-alive",
    tags: ["music", "downtown", "community"]
  },
  {
    slug: "zydeco-breakfast-cafe-des-amis",
    name: "Zydeco Breakfast at Café des Amis",
    date: "2026-03-28",
    time: "8:30 AM",
    city: "Breaux Bridge",
    venue: "Café des Amis, 140 E Bridge St",
    price: "$18",
    description: "Saturday morning zydeco dancing, coffee, and Creole breakfast plates at the legendary Café des Amis on Bridge Street.",
    image: "https://fezzos.com/wp-content/uploads/2021/01/cajuntrio.jpg",
    ticketLink: "https://www.cafedesamis.com",
    tags: ["zydeco", "breakfast", "dance"]
  },
  {
    slug: "sugar-cane-stroll-youngsville",
    name: "Sugar Cane Stroll Night Market",
    date: "2026-03-28",
    time: "5:00 PM",
    city: "Youngsville",
    venue: "Sugar Mill Pond",
    price: "Free",
    description: "Open-air makers market with food trucks, live acoustic sets, and local art on the beautiful Sugar Mill Pond waterfront.",
    image: "https://marketatmoncuspark.com/wp-content/uploads/2023/03/Cajun-Jam-2023.jpg",
    ticketLink: "https://www.youngsville-la.gov",
    tags: ["market", "family", "outdoors"]
  },
  {
    slug: "bayou-sunset-jam-lake-martin",
    name: "Bayou Sunset Jam",
    date: "2026-03-29",
    time: "6:30 PM",
    city: "Breaux Bridge",
    venue: "Lake Martin Landing",
    price: "$10",
    description: "Sunday evening unplugged jam sessions with local Cajun and roots musicians overlooking the cypress-lined Lake Martin.",
    image: "https://images.squarespace-cdn.com/content/v1/697a3b0daca38f0f7443529d/a1f70278-7c5f-4a4e-9006-49d26d475d9a/bl1.jpg?format=1500w",
    ticketLink: "https://www.cajuncountry.org",
    tags: ["music", "bayou", "sunset"]
  }
];

export const recipes: Recipe[] = [
  {
    slug: "crawfish-etouffee",
    title: "Crawfish Étouffée",
    difficulty: "Easy",
    prepTime: "20 min",
    cookTime: "40 min",
    servings: 6,
    rating: 4.9,
    image: "https://fezzos.com/wp-content/uploads/2021/01/ettoufe.jpg",
    inspiredBy: "Bon Temps Grill",
    ingredients: ["1/2 cup butter", "1/2 cup flour", "Onion, celery, bell pepper", "2 lbs crawfish tails", "2 cups seafood stock", "Green onion", "Parsley"],
    steps: ["Build a blond roux with butter and flour.", "Add trinity and cook until tender.", "Stir in stock and seasonings.", "Fold in crawfish tails and simmer 15 minutes.", "Serve over rice with green onion."]
  },
  {
    slug: "boudin-balls",
    title: "Crispy Boudin Balls",
    difficulty: "Medium",
    prepTime: "25 min",
    cookTime: "20 min",
    servings: 8,
    rating: 4.8,
    image: "https://fezzos.com/wp-content/uploads/2021/01/boudinballs.jpg",
    inspiredBy: "Scott Boudin Festival",
    ingredients: ["1 lb boudin", "2 eggs", "Panko breadcrumbs", "Flour", "Cajun seasoning", "Oil for frying"],
    steps: ["Remove boudin casing and chill filling.", "Roll into golf-ball sized portions.", "Dredge in flour, egg wash, then breadcrumbs.", "Fry until golden brown.", "Serve with spicy remoulade."]
  },
  {
    slug: "king-cake",
    title: "Mardi Gras King Cake",
    difficulty: "Hard",
    prepTime: "35 min",
    cookTime: "30 min",
    servings: 12,
    rating: 4.7,
    image: "https://fezzos.com/wp-content/uploads/2021/01/breadpudding.jpg",
    inspiredBy: "Local Family Kitchens",
    ingredients: ["Bread flour", "Yeast", "Butter", "Milk", "Cinnamon sugar filling", "Cream cheese glaze", "Purple, green, gold sugar"],
    steps: ["Mix and knead enriched dough, then proof.", "Roll out dough and spread filling.", "Shape into a ring and proof again.", "Bake until golden and fully set.", "Glaze and decorate with Mardi Gras sugars."]
  },
  {
    slug: "crawfish-bread",
    title: "Cheesy Crawfish Bread",
    difficulty: "Easy",
    prepTime: "15 min",
    cookTime: "18 min",
    servings: 6,
    rating: 4.8,
    image: "https://fezzos.com/wp-content/uploads/2021/01/crawfishdip.jpg",
    inspiredBy: "Festival Grounds Favorite",
    ingredients: ["French bread", "Crawfish tails", "Cream cheese", "Monterey jack", "Green onion", "Cajun seasoning"],
    steps: ["Mix crawfish with cheeses and seasoning.", "Split loaf and spread mixture generously.", "Bake until bubbling and golden.", "Broil 1-2 minutes for crisp edges.", "Slice and serve hot."]
  },
  {
    slug: "shrimp-and-grits",
    title: "Louisiana Shrimp and Grits",
    difficulty: "Medium",
    prepTime: "20 min",
    cookTime: "35 min",
    servings: 4,
    rating: 4.9,
    image: "https://fezzos.com/wp-content/uploads/2021/01/creamyshrimppasta.jpg",
    inspiredBy: "The French Press",
    ingredients: ["Stone-ground grits", "Sharp cheddar", "Gulf shrimp", "Bacon", "Garlic", "Lemon", "Green onion"],
    steps: ["Cook grits low and slow until creamy.", "Stir in butter and cheddar.", "Render bacon and saute shrimp with garlic.", "Deglaze pan with lemon and a splash of stock.", "Plate shrimp over grits and garnish."]
  }
];

export const weekendHighlights = {
  intro:
    "From Friday night downtown sets to Sunday bayou sunsets, here is your GeauxFind weekend game plan across Acadiana.",
  foodSpecials: [
    "Fezzo's: Friday crawfish platter special",
    "Pop's Poboys: shrimp po'boy + gumbo combo",
    "Bon Temps Grill: Sunday live-music brunch"
  ],
  music: ["Blue Moon Saloon Cajun Jam", "Artmosphere Acoustic Saturday", "Downtown Alive! headline set"],
  weather: "Warm Gulf breeze — 73°F high · 64°F low · 25% rain chance"
};
