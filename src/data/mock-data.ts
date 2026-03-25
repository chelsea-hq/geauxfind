import seedData from "../../scripts/seed-data.json";
import eventsData from "../../data/events.json";
import { Event, Place, Recipe } from "@/types";

export const places: Place[] = seedData.places as Place[];

export const events: Event[] = eventsData as Event[];

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
