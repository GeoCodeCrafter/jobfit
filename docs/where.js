// Where the person is, and whether a job is open to them.

// Which regions a country sits inside, so a job listed for "EMEA" matches
// someone in the UK.
const IN_REGION = {
  gb: ["europe", "emea"], ie: ["europe", "emea"], de: ["europe", "emea"],
  fr: ["europe", "emea"], es: ["europe", "emea"], pt: ["europe", "emea"],
  it: ["europe", "emea"], nl: ["europe", "emea"], be: ["europe", "emea"],
  ch: ["europe", "emea"], at: ["europe", "emea"], pl: ["europe", "emea"],
  cz: ["europe", "emea"], ro: ["europe", "emea"], ua: ["europe", "emea"],
  se: ["europe", "emea"], no: ["europe", "emea"], dk: ["europe", "emea"],
  fi: ["europe", "emea"], gr: ["europe", "emea"], tr: ["europe", "emea"],
  il: ["emea", "middle_east"], ae: ["emea", "middle_east"],
  za: ["emea", "africa"],
  us: ["north_america"], ca: ["north_america"], mx: ["north_america", "latam"],
  br: ["latam"], ar: ["latam"],
  in: ["apac"], sg: ["apac"], jp: ["apac"], au: ["apac"], nz: ["apac"],
  tw: ["apac"],
};

export const COUNTRY_NAMES = {
  gb: "United Kingdom", ie: "Ireland", us: "United States", ca: "Canada",
  de: "Germany", fr: "France", es: "Spain", pt: "Portugal", it: "Italy",
  nl: "Netherlands", be: "Belgium", ch: "Switzerland", at: "Austria",
  pl: "Poland", cz: "Czechia", ro: "Romania", ua: "Ukraine", se: "Sweden",
  no: "Norway", dk: "Denmark", fi: "Finland", gr: "Greece", tr: "Turkey",
  il: "Israel", ae: "UAE", in: "India", sg: "Singapore", jp: "Japan",
  au: "Australia", nz: "New Zealand", br: "Brazil", mx: "Mexico",
  ar: "Argentina", za: "South Africa", tw: "Taiwan",
};

// A UK postcode is the strongest signal there is, and people put them on CVs.
const UK_POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;

const DIALLING = { "+44": "gb", "+353": "ie", "+1": "us", "+49": "de", "+33": "fr",
  "+34": "es", "+351": "pt", "+39": "it", "+31": "nl", "+61": "au", "+91": "in" };

const HINTS = {
  gb: ["united kingdom", "england", "scotland", "wales", "london", "manchester",
       "birmingham", "bristol", "leeds", "glasgow", "edinburgh", "cardiff",
       "liverpool", "sheffield", "newcastle", "nottingham", "brighton",
       "southampton", "leicester", "coventry", "reading", "milton keynes"],
  ie: ["ireland", "dublin", "cork", "galway"],
  us: ["united states", "new york", "san francisco", "seattle", "austin",
       "boston", "chicago", "los angeles", "denver", "atlanta"],
  ca: ["canada", "toronto", "vancouver", "montreal"],
  de: ["germany", "berlin", "munich", "hamburg", "frankfurt"],
  fr: ["france", "paris", "lyon"],
  es: ["spain", "madrid", "barcelona"],
  pt: ["portugal", "lisbon", "porto"],
  nl: ["netherlands", "amsterdam", "rotterdam", "utrecht"],
  it: ["italy", "rome", "milan"],
  pl: ["poland", "warsaw", "krakow"],
  in: ["india", "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "pune"],
  au: ["australia", "sydney", "melbourne", "brisbane"],
  br: ["brazil", "sao paulo"],
  za: ["south africa", "cape town", "johannesburg"],
};

/** Best guess at the country a CV belongs to, or null. */
export function detectCountry(text) {
  if (UK_POSTCODE.test(text)) return "gb";

  for (const [prefix, code] of Object.entries(DIALLING)) {
    if (text.includes(prefix)) return code;
  }

  const lower = text.toLowerCase();
  let best = null;
  let bestHits = 0;
  for (const [code, phrases] of Object.entries(HINTS)) {
    const hits = phrases.filter((p) => lower.includes(p)).length;
    if (hits > bestHits) {
      best = code;
      bestHits = hits;
    }
  }
  return best;
}

/**
 * Can someone in `country` take this job?
 * Unknown locations stay in. Guessing them out would hide real jobs on the
 * strength of a blank field.
 */
export function reachable(job, country) {
  if (!country) return true;
  const tokens = job.k;
  if (!tokens || !tokens.length) return true;
  if (tokens.includes("any")) return true;
  if (tokens.includes(country)) return true;

  const regions = IN_REGION[country] || [];
  return tokens.some((t) => regions.includes(t));
}
