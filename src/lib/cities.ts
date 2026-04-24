export type CityMeta = {
  slug: string;
  name: string;
  tagline: string;
  intro: string;
  fun_fact: string;
};

export const CITIES: CityMeta[] = [
  {
    slug: "lafayette",
    name: "Lafayette",
    tagline: "The beating heart of Acadiana",
    intro:
      "Lafayette, Louisiana is the cultural capital of Acadiana — home to Cajun Country's best restaurants, oldest dance halls, and the annual Festival International de Louisiane. From downtown courtyards to strip-mall gumbo gems, this is where Cajun and Creole traditions run loudest.",
    fun_fact: "Lafayette is one of the most densely-populated restaurant cities per capita in the US South.",
  },
  {
    slug: "broussard",
    name: "Broussard",
    tagline: "Family dinners and quiet crawfish boils",
    intro:
      "Broussard sits just south of Lafayette and has quietly become one of Acadiana's best suburbs for dining out. Family-owned spots, new concepts along Albertsons Parkway, and a growing kids-eat-free lineup make it a weeknight favorite.",
    fun_fact: "Broussard hosts several of the best crawfish pick-up windows in the parish.",
  },
  {
    slug: "youngsville",
    name: "Youngsville",
    tagline: "New kitchens, young families",
    intro:
      "Youngsville has exploded in the last decade — new bakeries, brunch spots, sports pubs, and family-friendly patios along Chemin Metairie. If you want casual-but-polished Acadiana dining, start here.",
    fun_fact: "Youngsville's growth is roughly 5x the state average — and so is its pace of new restaurant openings.",
  },
  {
    slug: "scott",
    name: "Scott",
    tagline: "Boudin capital of the world",
    intro:
      "Scott, Louisiana is officially the Boudin Capital of the World — and the designation is taken seriously. Don's Specialty Meats, Best Stop, and NuNu's are within minutes of each other, each with their own boudin flavor and die-hard fans.",
    fun_fact: "Scott hosts an annual Boudin Festival every April with boudin-eating contests and second-line parades.",
  },
  {
    slug: "carencro",
    name: "Carencro",
    tagline: "Small town, big plates",
    intro:
      "Carencro sits on Lafayette's north side and punches above its weight on Cajun classics — plate lunches, smoked meats, and Saturday boudin runs are a way of life. It's also prime territory for crawfish boils in season.",
    fun_fact: "Carencro's Azalea Trail is one of Acadiana's most photographed blooming spots in March.",
  },
  {
    slug: "breaux-bridge",
    name: "Breaux Bridge",
    tagline: "Crawfish capital of the world",
    intro:
      "Breaux Bridge is the Crawfish Capital of the World and home to Café Des Amis' legendary Zydeco Breakfast. The historic downtown is a walkable mix of Cajun restaurants, antique shops, and live music venues along Bayou Teche.",
    fun_fact: "Breaux Bridge's annual Crawfish Festival draws over 100,000 visitors every May.",
  },
  {
    slug: "opelousas",
    name: "Opelousas",
    tagline: "Zydeco's hometown",
    intro:
      "Opelousas, Louisiana is the historic hometown of zydeco music and a cornerstone of Creole culture in Acadiana. Home of Clifton Chenier and Buckwheat Zydeco, it still hosts some of the region's best zydeco dance halls and the annual Southwest Louisiana Zydeco Music Festival.",
    fun_fact: "Opelousas is the third-oldest city in Louisiana.",
  },
  {
    slug: "new-iberia",
    name: "New Iberia",
    tagline: "Teche river town with a Cajun soul",
    intro:
      "New Iberia sits along the Bayou Teche and is the real-life home of Dave Robicheaux in James Lee Burke's novels. It's home to the Tabasco Factory on Avery Island, Victor's Cafeteria's plate lunches, and some of the prettiest live oak walks in the state.",
    fun_fact: "The Tabasco hot sauce has been made on Avery Island since 1868.",
  },
  {
    slug: "abbeville",
    name: "Abbeville",
    tagline: "Gulf seafood on the plate",
    intro:
      "Abbeville is the gateway to Louisiana's Gulf seafood — oysters, shrimp, redfish, and crabs straight off the docks at Delcambre and Intracoastal City. Dupuy's and Black's are local institutions for oysters and raw bars.",
    fun_fact: "Abbeville hosts the annual Louisiana Cattle Festival every October.",
  },
  {
    slug: "eunice",
    name: "Eunice",
    tagline: "Cajun music lives here",
    intro:
      "Eunice is where Cajun music lives — Saturday morning Rendez-Vous des Cadiens is broadcast live from the Liberty Theatre, and the Cajun Music Hall of Fame sits downtown. It's also home to some of the best Saturday morning boucherie breakfasts in the state.",
    fun_fact: "Eunice was named after the wife of the town's founder, C.C. Duson.",
  },
  {
    slug: "rayne",
    name: "Rayne",
    tagline: "Frog capital of the world",
    intro:
      "Rayne, Louisiana is the Frog Capital of the World — yes, really. The annual Frog Festival, quirky frog-themed public art, and a rich food culture make it a fun stop between Lafayette and Crowley.",
    fun_fact: "Rayne exported frog legs to France and New York City for over a century.",
  },
  {
    slug: "henderson",
    name: "Henderson",
    tagline: "Atchafalaya Basin's front door",
    intro:
      "Henderson sits at the edge of the Atchafalaya Basin — airboat tours, swamp restaurants, and some of the best catfish in the state. Pat's Fisherman's Wharf and Robin's are the signature stops.",
    fun_fact: "The Atchafalaya is the largest river swamp in North America.",
  },
  {
    slug: "crowley",
    name: "Crowley",
    tagline: "Rice capital of America",
    intro:
      "Crowley is the Rice Capital of America and the home of the International Rice Festival. Rice-and-gravy plate lunches are a way of life here, and the historic downtown still hosts a rice mill museum.",
    fun_fact: "Louisiana grows more rice than any other state except Arkansas.",
  },
];

export function getCityBySlug(slug: string): CityMeta | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function cityNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
