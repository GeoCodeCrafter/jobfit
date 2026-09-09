// Free-text location -> country and region tokens.
// Mirrors scripts/places.py, which does the same job when building the
// snapshot index. Live results have to be classified here instead.

const ANYWHERE = [
  "anywhere", "worldwide", "global", "remote (global)", "fully remote",
  "anywhere in the world", "any location", "location independent",
];

const REGIONS = {
  europe: ["europe", "european union", "eea"],
  emea: ["emea"],
  north_america: ["north america", "northern america", "americas"],
  latam: ["latam", "latin america", "south america", "central america"],
  apac: ["apac", "apjc", "asia pacific", "asia-pacific", "oceania", "anz", "japan"],
  africa: ["africa"],
  middle_east: ["middle east", "gcc"],
};

const COUNTRIES = {
  gb: ["united kingdom", "uk", "england", "scotland", "wales", "northern ireland",
       "great britain", "britain"],
  ie: ["ireland", "eire"],
  us: ["united states", "usa", "u.s.", "america"],
  ca: ["canada"], de: ["germany", "deutschland"], fr: ["france"],
  es: ["spain"], pt: ["portugal"], it: ["italy"], nl: ["netherlands", "holland"],
  be: ["belgium"], ch: ["switzerland"], at: ["austria"], pl: ["poland"],
  cz: ["czechia", "czech republic"], ro: ["romania"], ua: ["ukraine"],
  se: ["sweden"], no: ["norway"], dk: ["denmark"], fi: ["finland"],
  gr: ["greece"], tr: ["turkey"], il: ["israel"], ae: ["united arab emirates", "uae", "dubai"],
  in: ["india"], sg: ["singapore"], jp: ["japan"], au: ["australia"],
  nz: ["new zealand"], br: ["brazil"], mx: ["mexico"], ar: ["argentina"],
  za: ["south africa"], tw: ["taiwan"],
};

const CITIES = {
  gb: ["london", "manchester", "birmingham", "bristol", "leeds", "glasgow",
       "edinburgh", "cardiff", "belfast", "liverpool", "sheffield", "newcastle",
       "nottingham", "cambridge", "oxford", "brighton", "southampton", "reading"],
  ie: ["dublin", "cork", "galway"],
  us: ["new york", "san francisco", "seattle", "austin", "boston", "chicago",
       "los angeles", "denver", "atlanta", "miami", "portland", "dallas",
       "houston", "philadelphia", "phoenix", "san diego", "nyc", "sf", "chi", "sea"],
  ca: ["toronto", "vancouver", "montreal", "ottawa", "calgary"],
  de: ["berlin", "munich", "münchen", "hamburg", "cologne", "frankfurt", "stuttgart"],
  fr: ["paris", "lyon", "marseille"], es: ["madrid", "barcelona", "valencia"],
  nl: ["amsterdam", "rotterdam", "utrecht", "eindhoven"],
  pt: ["lisbon", "lisboa", "porto"], pl: ["warsaw", "krakow", "kraków"],
  in: ["bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "pune", "chennai"],
  au: ["sydney", "melbourne", "brisbane", "perth"], sg: ["singapore"],
  jp: ["tokyo", "osaka"], br: ["sao paulo", "são paulo"], il: ["tel aviv"],
  ro: ["bucharest", "cluj"], tw: ["taipei"],
};

const US_STATES = [
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
  "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho", "illinois",
  "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland",
  "massachusetts", "michigan", "minnesota", "mississippi", "missouri", "montana",
  "nebraska", "nevada", "new hampshire", "new jersey", "new mexico",
  "north carolina", "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania",
  "rhode island", "south carolina", "tennessee", "texas", "utah", "vermont",
  "virginia", "washington", "wisconsin",
];

const US_ABBR = /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/;

function has(text, phrase) {
  return new RegExp(`(?<![a-z])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`)
    .test(text);
}

export function classify(location) {
  if (!location || !location.trim()) return [];

  const text = ` ${location.toLowerCase().trim()} `;
  if (ANYWHERE.some((a) => has(text, a))) return ["any"];

  const tokens = new Set();
  for (const [region, phrases] of Object.entries(REGIONS)) {
    if (phrases.some((p) => has(text, p))) tokens.add(region);
  }
  for (const [code, names] of Object.entries(COUNTRIES)) {
    if (names.some((n) => has(text, n))) tokens.add(code);
  }
  for (const [code, cities] of Object.entries(CITIES)) {
    if (cities.some((c) => has(text, c))) tokens.add(code);
  }
  if (US_ABBR.test(location) || US_STATES.some((s) => has(text, s))) tokens.add("us");

  return [...tokens].sort();
}
