import { Event, Place, Recipe } from "@/types";

export const places: Place[] = [
  {
    slug: "pops-poboys-lafayette",
    name: "Pop's Poboys",
    category: "food",
    cuisine: "Po'boys & Plate Lunch",
    city: "Lafayette",
    rating: 4.8,
    price: "$$",
    address: "740 Jefferson St, Lafayette, LA",
    phone: "(337) 408-4265",
    website: "https://example.com/pops-poboys",
    hours: ["Mon-Sat: 10:30am-8pm", "Sun: Closed"],
    description: "Downtown favorite for overstuffed shrimp po'boys and daily Cajun plate lunches.",
    image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["poboy", "downtown", "lunch"],
    reviews: [
      { id: "r1", author: "Mia B.", rating: 5, comment: "Crispy shrimp and soft bread. Exactly right.", date: "2026-03-11" },
      { id: "r2", author: "Trent G.", rating: 4, comment: "Great roast beef gravy and friendly crew.", date: "2026-03-05" }
    ]
  },
  {
    slug: "bon-temps-grill-lafayette",
    name: "Bon Temps Grill",
    category: "food",
    cuisine: "Cajun Seafood",
    city: "Lafayette",
    rating: 4.7,
    price: "$$",
    address: "1211 W Pinhook Rd, Lafayette, LA",
    phone: "(337) 210-5952",
    website: "https://example.com/bon-temps-grill",
    hours: ["Mon-Thu: 11am-9pm", "Fri-Sat: 11am-10pm", "Sun: 10am-2pm"],
    description: "Live-music brunches, rich seafood gumbo, and a strong local following.",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["seafood", "brunch", "live music"],
    reviews: [
      { id: "r3", author: "Jules R.", rating: 5, comment: "Seafood platter and service were both top tier.", date: "2026-03-02" }
    ]
  },
  {
    slug: "fezzos-scott",
    name: "Fezzo's",
    category: "food",
    cuisine: "Cajun Comfort Food",
    city: "Scott",
    rating: 4.6,
    price: "$$",
    address: "6701 Ambassador Caffery Pkwy, Broussard, LA",
    phone: "(337) 330-2030",
    website: "https://example.com/fezzos",
    hours: ["Daily: 11am-9pm"],
    description: "Known for chargrilled oysters, smothered meats, and classic South Louisiana sides.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["oysters", "family", "cajun"],
    reviews: [
      { id: "r4", author: "Lance P.", rating: 4, comment: "Perfect for a Sunday family lunch.", date: "2026-02-28" }
    ]
  },
  {
    slug: "crawfish-town-usa-breaux-bridge",
    name: "Crawfish Town USA",
    category: "food",
    cuisine: "Boiled Seafood",
    city: "Breaux Bridge",
    rating: 4.6,
    price: "$$",
    address: "2815 Grand Point Hwy, Henderson, LA",
    phone: "(337) 667-0761",
    website: "https://example.com/crawfish-town-usa",
    hours: ["Thu-Sun: 5pm-10pm"],
    description: "A destination spot for boiled crawfish, dancing, and swamp-country vibes.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1532635241-17e820acc59f?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["crawfish", "boil", "dancehall"],
    reviews: [
      { id: "r5", author: "Aria K.", rating: 5, comment: "Best atmosphere when the band starts up.", date: "2026-03-09" }
    ]
  },
  {
    slug: "the-wurst-biergarten-lafayette",
    name: "The Wurst Biergarten",
    category: "music",
    cuisine: "Beer Garden",
    city: "Lafayette",
    rating: 4.5,
    price: "$$",
    address: "537 Jefferson St, Lafayette, LA",
    phone: "(337) 534-4299",
    website: "https://example.com/the-wurst-biergarten",
    hours: ["Mon-Thu: 4pm-11pm", "Fri-Sat: 11am-12am", "Sun: 11am-10pm"],
    description: "Craft beer, sausages, and regular live music in the heart of downtown.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["beer", "patio", "live music"],
    reviews: [
      { id: "r6", author: "Cole M.", rating: 4, comment: "Fun late-night set and solid beer list.", date: "2026-03-01" }
    ]
  },
  {
    slug: "blue-moon-saloon-lafayette",
    name: "Blue Moon Saloon",
    category: "music",
    cuisine: "Live Music Venue",
    city: "Lafayette",
    rating: 4.8,
    price: "$$",
    address: "215 E Convent St, Lafayette, LA",
    phone: "(337) 234-2422",
    website: "https://example.com/blue-moon-saloon",
    hours: ["Daily: 5pm-12am"],
    description: "Iconic Lafayette courtyard stage known for Cajun, zydeco, and indie acts.",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["zydeco", "courtyard", "nightlife"],
    reviews: [
      { id: "r7", author: "Nia D.", rating: 5, comment: "Every show feels like a community reunion.", date: "2026-03-07" }
    ]
  },
  {
    slug: "artmosphere-bistro-lafayette",
    name: "Artmosphere",
    category: "music",
    cuisine: "Bistro & Art Bar",
    city: "Lafayette",
    rating: 4.4,
    price: "$$",
    address: "902 Johnston St, Lafayette, LA",
    phone: "(337) 233-3331",
    website: "https://example.com/artmosphere",
    hours: ["Tue-Sat: 11am-11pm", "Sun-Mon: Closed"],
    description: "A creative hangout with rotating art, craft cocktails, and intimate performances.",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1458560871784-56d23406c091?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["art", "cocktails", "acoustic"],
    reviews: [
      { id: "r8", author: "Rae S.", rating: 4, comment: "Cool vibe and unexpected local talent.", date: "2026-02-22" }
    ]
  },
  {
    slug: "lafayette-farmers-market",
    name: "Lafayette Farmers & Artisans Market",
    category: "finds",
    cuisine: "Local Market",
    city: "Lafayette",
    rating: 4.7,
    price: "$",
    address: "2913 Johnston St, Lafayette, LA",
    phone: "(337) 849-8757",
    website: "https://example.com/lafayette-market",
    hours: ["Sat: 8am-12pm", "Wed: 4pm-7pm"],
    description: "Fresh produce, local meats, handmade goods, and weekend community energy.",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["market", "produce", "family"],
    reviews: [
      { id: "r9", author: "Beau H.", rating: 5, comment: "Great spot for local finds every weekend.", date: "2026-03-10" }
    ]
  },
  {
    slug: "the-french-press-lafayette",
    name: "The French Press",
    category: "finds",
    cuisine: "Brunch",
    city: "Lafayette",
    rating: 4.8,
    price: "$$",
    address: "214 E Vermilion St, Lafayette, LA",
    phone: "(337) 233-9449",
    website: "https://example.com/the-french-press",
    hours: ["Tue-Sun: 8am-2pm", "Mon: Closed"],
    description: "A downtown brunch classic with king-cake beignets and boudin benedict.",
    image: "https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["brunch", "coffee", "downtown"],
    reviews: [
      { id: "r10", author: "Kay G.", rating: 5, comment: "Worth every minute of the wait.", date: "2026-03-08" }
    ]
  },
  {
    slug: "acadiana-park-nature-station",
    name: "Acadiana Park Nature Station",
    category: "finds",
    cuisine: "Outdoor Find",
    city: "Lafayette",
    rating: 4.5,
    price: "$",
    address: "1205 E Alexander St, Lafayette, LA",
    phone: "(337) 291-8448",
    website: "https://example.com/nature-station",
    hours: ["Mon-Fri: 8am-5pm", "Sat-Sun: 9am-5pm"],
    description: "A peaceful local gem for trails, bayou learning, and family nature time.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["outdoors", "trails", "kids"],
    reviews: [
      { id: "r11", author: "Parker T.", rating: 4, comment: "Hidden gem when you need fresh air.", date: "2026-03-04" }
    ]
  }
];

export const events: Event[] = [
  {
    slug: "boudin-cook-off-scott",
    name: "Boudin Cook-Off Scott",
    date: "2026-03-27",
    time: "6:00 PM",
    city: "Scott",
    venue: "Scott Event Center",
    price: "$20",
    description: "Local pitmasters and smoke teams compete for Acadiana boudin bragging rights.",
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1400&q=80",
    ticketLink: "https://example.com/boudin-cook-off",
    tags: ["food", "competition", "boudin"]
  },
  {
    slug: "downtown-alive-lafayette",
    name: "Downtown Alive!",
    date: "2026-03-27",
    time: "7:30 PM",
    city: "Lafayette",
    venue: "Parc International",
    price: "Free",
    description: "A Friday night outdoor concert series that brings downtown Lafayette to life.",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1400&q=80",
    ticketLink: "https://example.com/downtown-alive",
    tags: ["music", "downtown", "community"]
  },
  {
    slug: "zydeco-breakfast-cafe-des-amis",
    name: "Zydeco Breakfast at Café des Amis",
    date: "2026-03-28",
    time: "8:30 AM",
    city: "Breaux Bridge",
    venue: "Café des Amis",
    price: "$18",
    description: "Saturday morning zydeco dancing, coffee, and Creole breakfast plates.",
    image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1400&q=80",
    ticketLink: "https://example.com/zydeco-breakfast",
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
    description: "Open-air makers market with food trucks, live acoustic sets, and local art.",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1400&q=80",
    ticketLink: "https://example.com/sugar-cane-stroll",
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
    description: "Sunday evening unplugged jam sessions with local Cajun and roots musicians.",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80",
    ticketLink: "https://example.com/bayou-sunset-jam",
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
    image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80",
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
    image: "https://images.unsplash.com/photo-1604908176997-4317dac0d4f6?auto=format&fit=crop&w=1400&q=80",
    inspiredBy: "Boudin Cook-Off Scott",
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
    image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=1400&q=80",
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
    image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=1400&q=80",
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
    image: "https://images.unsplash.com/photo-1582114578221-89b8f8f7d4d3?auto=format&fit=crop&w=1400&q=80",
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
