import type { CategoryType } from "@/types";

export type CategoryIntro = {
  intro: string;
  faq: Array<{ question: string; answer: string }>;
};

export const CATEGORY_INTROS: Record<CategoryType, CategoryIntro> = {
  food: {
    intro:
      "Lafayette is one of the best food cities in the American South — a dense, competitive restaurant scene stacked with Cajun classics, Creole soul, Vietnamese noodles from the Ruins of Saigon families, and a new wave of young chefs cooking outside the box. These are the places locals actually eat, ranked by community rating and reviewed regularly.",
    faq: [
      {
        question: "Where do locals eat in Lafayette, Louisiana?",
        answer:
          "Locals rotate between plate-lunch Cajun spots (Laura's II, Dwyer's, Chez Francois), iconic boudin stops in Scott, Vietnamese from the Johnston Street corridor, and neighborhood newer concepts along downtown Jefferson Street. Filter this page by city and price to see the specific list by area.",
      },
      {
        question: "What's the difference between Cajun and Creole food?",
        answer:
          "Cajun cooking is rural, one-pot, and spice-forward — jambalaya, étouffée, gumbo without tomatoes, and everything built from a roux. Creole cooking is urban, richer, and more French-influenced, with a bigger role for tomatoes, cream, and seafood. Both live side-by-side across Acadiana.",
      },
      {
        question: "When is crawfish season in Lafayette?",
        answer:
          "Crawfish season typically runs January through June, with peak supply and best pricing usually April–May. See our live crawfish prices page for daily pricing across Acadiana.",
      },
    ],
  },
  music: {
    intro:
      "Live music runs in Acadiana's bloodstream — Cajun jams on downtown stages, zydeco Saturday mornings at the legendary Zydeco Breakfast, songwriter nights at the Blue Moon Saloon, and everything in between. These venues keep the culture alive seven nights a week.",
    faq: [
      {
        question: "Where can I see live Cajun music in Lafayette tonight?",
        answer:
          "Check our /live-music/tonight page for a real-time list of Acadiana venues with music on tonight, organized by day of the week.",
      },
      {
        question: "What is zydeco music?",
        answer:
          "Zydeco is a Creole-rooted Louisiana genre that fuses accordion-and-rubboard instrumentation with R&B, blues, and soul. It's distinct from Cajun music, which is French-rooted and played by descendants of the Acadians.",
      },
      {
        question: "Is there live music during the day in Lafayette?",
        answer:
          "Yes — brunch spots like Café Sydnie Mae in Breaux Bridge run weekend brunch with live Cajun music, and the legendary Zydeco Breakfast happens every Saturday morning at venues around the region.",
      },
    ],
  },
  events: {
    intro:
      "Acadiana's calendar is built around culture — Mardi Gras, Festival International, crawfish boils, boucherie weekends, Festivals Acadiens et Créoles, and hundreds of smaller community gatherings. This is the full rolling list of upcoming events across the region, updated from Eventbrite and local news sources every few hours.",
    faq: [
      {
        question: "What's happening in Lafayette this weekend?",
        answer:
          "See our /this-weekend page for a Friday–Sunday roundup of events, or /tonight for a by-the-hour look at what's on today.",
      },
      {
        question: "When is Festival International?",
        answer:
          "Festival International de Louisiane happens every April in downtown Lafayette — five days of free outdoor world-music programming across several stages.",
      },
      {
        question: "Are there free events in Acadiana?",
        answer:
          "Many of Acadiana's biggest events are free — Festival International, most festival weekends, and regular community gatherings. Filter the events list or browse upcoming festivals for free options.",
      },
    ],
  },
  recipes: {
    intro:
      "Cajun and Creole cooking has a deep pantry — boudin, crawfish étouffée, gumbo, jambalaya, fricassée, couche-couche, and king cake. These recipes are the ones we come back to, with prep tips and locally-inspired notes.",
    faq: [
      {
        question: "What's the easiest Cajun recipe for beginners?",
        answer:
          "Crawfish étouffée is a forgiving one-pot Cajun classic — a blond roux, the holy trinity (onion, celery, bell pepper), and crawfish tails. See our step-by-step recipe.",
      },
      {
        question: "Where can I buy Cajun ingredients outside Louisiana?",
        answer:
          "Many specialty Cajun seasonings, smoked meats, and crawfish tail meat ship nationwide from Louisiana producers — check our Cajun Connection directory for vendors.",
      },
    ],
  },
  finds: {
    intro:
      "The Acadiana spots that aren't in any guidebook — roadside boudin windows, downtown vintage shops, neighborhood bars with no Instagram, and the kind of places locals send family members when they visit.",
    faq: [
      {
        question: "Where are Lafayette's hidden gems?",
        answer:
          "Our Finds list is a rotating set of locally-beloved, off-the-beaten-path spots across the region — filter by city to zero in on a specific neighborhood.",
      },
    ],
  },
  outdoors: {
    intro:
      "Bayou paddles, cypress swamps, and state park trails — Acadiana's outdoor scene is wetter and more alive than most places in the South. Good boots, good bug spray, and go.",
    faq: [
      {
        question: "What outdoor activities are near Lafayette?",
        answer:
          "The Atchafalaya Basin is the largest river swamp in North America — airboat tours, kayak rentals, and birding trips launch daily from Henderson and Breaux Bridge.",
      },
    ],
  },
  shopping: {
    intro:
      "From downtown Lafayette vintage to Breaux Bridge antique stores and roadside Cajun market stands, Acadiana shopping has personality — and a lot of it is locally-made.",
    faq: [
      {
        question: "Where do locals shop for Cajun food gifts?",
        answer:
          "The Cajun Connection directory lists Louisiana-made seasonings, sauces, and specialty food vendors who ship nationwide.",
      },
    ],
  },
};
