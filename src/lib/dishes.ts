export type DishMeta = {
  slug: string;       // /best/[slug]
  dish: string;       // "Boudin"
  tagline: string;
  intro: string;
  matchers: {
    tags?: string[];
    nameKeywords?: string[];
    cuisineKeywords?: string[];
  };
  faq: Array<{ question: string; answer: string }>;
};

export const DISHES: DishMeta[] = [
  {
    slug: "boudin-lafayette",
    dish: "Boudin",
    tagline: "The best boudin in and around Lafayette",
    intro:
      "Boudin is the pork-and-rice sausage that runs through every gas station, meat market, and specialty shop in Acadiana. Scott, Louisiana is officially the Boudin Capital of the World, and the boudin trail spreads out from there across Lafayette, Carencro, Broussard, and beyond.",
    matchers: {
      nameKeywords: ["boudin"],
      tags: ["boudin"],
    },
    faq: [
      {
        question: "Where is the best boudin in Lafayette, Louisiana?",
        answer:
          "Locals regularly argue between Don's Specialty Meats in Scott, The Best Stop, NuNu's, Charlie T's Specialty Meats, Earl's Cajun Market, and Legnon's Boucherie — all within 20 minutes of downtown Lafayette. Each has a distinctive spice and rice ratio.",
      },
      {
        question: "What is boudin?",
        answer:
          "Boudin is a Cajun pork-and-rice sausage flavored with the trinity (onion, celery, bell pepper), green onion, parsley, and often a touch of liver. It's usually steamed or smoked and eaten by squeezing the filling out of the casing.",
      },
      {
        question: "Can you get boudin balls in Lafayette?",
        answer:
          "Yes — most boudin producers also sell crispy boudin balls (deep-fried boudin nuggets), and many restaurants serve them as appetizers. They're easier to share than whole links.",
      },
    ],
  },
  {
    slug: "gumbo-lafayette",
    dish: "Gumbo",
    tagline: "The best gumbo in Acadiana",
    intro:
      "Gumbo is Louisiana's signature one-pot stew — dark roux, the trinity, and whatever protein the cook grew up with. Cajun gumbo skips tomatoes and leans chicken-and-sausage or seafood; Creole gumbo leans richer with okra and tomatoes. Both live side-by-side in Lafayette.",
    matchers: {
      nameKeywords: ["gumbo"],
      tags: ["gumbo"],
    },
    faq: [
      {
        question: "What's the difference between Cajun and Creole gumbo?",
        answer:
          "Cajun gumbo is darker, roux-forward, without tomatoes — usually chicken and andouille, or seafood. Creole gumbo (often called gumbo z'herbes or seafood gumbo) typically includes okra and tomatoes and reflects a more urban, French-Caribbean heritage.",
      },
      {
        question: "What's served with gumbo?",
        answer:
          "Gumbo is always served over white rice. Traditional sides include potato salad (which some people drop straight into the bowl), French bread, and hot sauce or filé powder on the side.",
      },
    ],
  },
  {
    slug: "po-boy-lafayette",
    dish: "Po-Boy",
    tagline: "The best po-boys in Lafayette",
    intro:
      "The po-boy is the Louisiana submarine sandwich — New Orleans-born but beloved across Acadiana. Shrimp, oyster, catfish, roast beef with debris, hot sausage — dressed or undressed, on crusty French bread.",
    matchers: {
      nameKeywords: ["po-boy", "po boy", "poboy"],
      tags: ["po-boy"],
    },
    faq: [
      {
        question: "What does 'dressed' mean on a po-boy?",
        answer:
          "'Dressed' means with lettuce, tomato, pickle, and mayo. Undressed means just the protein on bread. Ordering dressed is the default unless you say otherwise.",
      },
    ],
  },
  {
    slug: "crawfish-etouffee-lafayette",
    dish: "Crawfish Étouffée",
    tagline: "The best crawfish étouffée in Acadiana",
    intro:
      "Étouffée — French for 'smothered' — is crawfish tails cooked in a blond roux with the trinity, served over rice. A springtime Lafayette staple that every cook swears their grandma made best.",
    matchers: {
      nameKeywords: ["étouffée", "etouffee"],
      tags: ["etouffee", "étouffée"],
    },
    faq: [
      {
        question: "When is étouffée season in Lafayette?",
        answer:
          "Crawfish étouffée is best during crawfish season (January through June), when fresh tails are at their sweetest and cheapest.",
      },
    ],
  },
  {
    slug: "beignet-lafayette",
    dish: "Beignets",
    tagline: "Where to find beignets in Lafayette",
    intro:
      "Beignets — the pillowy, powder-sugared French doughnut made famous by Café du Monde — show up across Lafayette at bakeries, breakfast spots, and Cajun-French cafés.",
    matchers: {
      nameKeywords: ["beignet"],
      tags: ["beignet"],
    },
    faq: [
      {
        question: "Can I get beignets outside New Orleans?",
        answer:
          "Yes — Lafayette has several cafés and bakeries serving fresh beignets, particularly weekend mornings. The best ones are piping hot and covered in powdered sugar.",
      },
    ],
  },
  {
    slug: "king-cake-lafayette",
    dish: "King Cake",
    tagline: "Where to buy king cake in Lafayette",
    intro:
      "King cake is the braided cinnamon pastry topped in purple, green, and gold sugar that marks Mardi Gras season in Louisiana. Bakeries around Lafayette bake fresh king cakes from Epiphany through Fat Tuesday.",
    matchers: {
      nameKeywords: ["king cake"],
      tags: ["king cake", "mardi gras"],
    },
    faq: [
      {
        question: "When is king cake season?",
        answer:
          "Traditional king cake season runs from Epiphany (January 6) through Fat Tuesday. Many Lafayette bakeries now keep them available through Carnival and even into early spring.",
      },
    ],
  },
  {
    slug: "cracklins-lafayette",
    dish: "Cracklins",
    tagline: "Where to find cracklins (gratons) in Acadiana",
    intro:
      "Cracklins — called 'gratons' in French — are deep-fried pork belly pieces, seasoned and crispy-on-the-outside, fatty-on-the-inside. Found at most Acadiana boucheries and specialty meat markets.",
    matchers: {
      nameKeywords: ["cracklin", "graton"],
      tags: ["cracklins"],
    },
    faq: [
      {
        question: "What's the difference between cracklins and pork rinds?",
        answer:
          "Cracklins are made from pork belly and include a layer of meat and fat — they're chewier and richer than pork rinds, which are just puffed pork skin. In Acadiana, cracklins are a highway road-trip snack.",
      },
    ],
  },
];

export function getDishBySlug(slug: string): DishMeta | undefined {
  return DISHES.find((d) => d.slug === slug);
}
