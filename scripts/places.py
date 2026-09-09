"""Turn a job's free-text location into country and region tokens.

Location strings on job boards are whatever the employer typed: "EMEA",
"Texas, USA", "Europe, Germany, Netherlands, UK", "Anywhere in the World".
This normalises them once, at index build time, so the browser only has to
compare short tokens.
"""

from __future__ import annotations

import re

ANYWHERE = {
    "anywhere", "worldwide", "global", "remote (global)", "fully remote",
    "anywhere in the world", "any location", "location independent",
}

# Multi-country regions. A job open to "EMEA" is open to someone in the UK.
REGIONS = {
    "europe": ["europe", "european union", " eu ", "eea", "europe/uk"],
    "emea": ["emea"],
    "north_america": ["north america", "northern america", "americas"],
    "latam": ["latam", "latin america", "south america", "central america"],
    "apac": ["apac", "apjc", "asia pacific", "asia-pacific", "oceania", "anz"],
    "africa": ["africa"],
    "middle_east": ["middle east", "gcc"],
}

COUNTRIES = {
    "gb": ["united kingdom", "uk", "england", "scotland", "wales",
           "northern ireland", "great britain", "britain"],
    "ie": ["ireland", "republic of ireland", "eire"],
    "us": ["united states", "usa", "u.s.", "us ", "america"],
    "ca": ["canada"],
    "de": ["germany", "deutschland"],
    "fr": ["france"],
    "es": ["spain", "españa"],
    "pt": ["portugal"],
    "it": ["italy", "italia"],
    "nl": ["netherlands", "holland"],
    "be": ["belgium"],
    "ch": ["switzerland"],
    "at": ["austria"],
    "pl": ["poland", "polska"],
    "cz": ["czechia", "czech republic"],
    "ro": ["romania"],
    "ua": ["ukraine"],
    "se": ["sweden"],
    "no": ["norway"],
    "dk": ["denmark"],
    "fi": ["finland"],
    "gr": ["greece"],
    "tr": ["turkey", "türkiye"],
    "il": ["israel"],
    "ae": ["united arab emirates", "uae", "dubai"],
    "in": ["india"],
    "sg": ["singapore"],
    "jp": ["japan"],
    "au": ["australia"],
    "nz": ["new zealand"],
    "br": ["brazil", "brasil"],
    "mx": ["mexico"],
    "ar": ["argentina"],
    "za": ["south africa"],
}

# Cities big enough to appear without their country attached.
CITIES = {
    "gb": ["london", "manchester", "birmingham", "bristol", "leeds", "glasgow",
           "edinburgh", "cardiff", "belfast", "liverpool", "sheffield",
           "newcastle", "nottingham", "cambridge", "oxford", "brighton",
           "southampton", "reading", "leicester", "telford"],
    "ie": ["dublin", "cork", "galway"],
    "us": ["new york", "san francisco", "seattle", "austin", "boston", "chicago",
           "los angeles", "denver", "atlanta", "miami", "portland", "dallas",
           "houston", "philadelphia", "phoenix", "san diego", "washington dc"],
    "ca": ["toronto", "vancouver", "montreal", "ottawa", "calgary"],
    "de": ["berlin", "munich", "münchen", "hamburg", "cologne", "frankfurt", "stuttgart"],
    "fr": ["paris", "lyon", "marseille", "toulouse", "bordeaux"],
    "es": ["madrid", "barcelona", "valencia", "seville"],
    "nl": ["amsterdam", "rotterdam", "utrecht", "eindhoven"],
    "pt": ["lisbon", "lisboa", "porto"],
    "pl": ["warsaw", "krakow", "kraków", "wroclaw", "gdansk"],
    "in": ["bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "pune", "chennai"],
    "au": ["sydney", "melbourne", "brisbane", "perth"],
    "sg": ["singapore"],
    "jp": ["tokyo", "osaka"],
    "br": ["sao paulo", "são paulo", "rio de janeiro"],
    "il": ["tel aviv", "jerusalem"],
    "tw": ["taipei"],
    "ro": ["bucharest", "cluj"],
}

# Abbreviations job ads use without ever spelling out the country.
ABBREV = {
    "us": ["nyc", "sf", "sfo", "chi", "sea", "lax", "atx", "pdx", "bos", "dmv"],
}

# US states, so "Austin, TX" and "Boston, Massachusetts" resolve.
US_STATES = [
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
    "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
    "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine",
    "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
    "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey",
    "new mexico", "north carolina", "north dakota", "ohio", "oklahoma",
    "oregon", "pennsylvania", "rhode island", "south carolina", "tennessee",
    "texas", "utah", "vermont", "virginia", "washington", "wisconsin",
]
US_ABBR = re.compile(
    r",\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI"
    r"|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT"
    r"|VA|WA|WV|WI|WY)\b"
)


def _has(text: str, phrase: str) -> bool:
    return re.search(rf"(?<![a-z]){re.escape(phrase.strip())}(?![a-z])", text) is not None


def classify(location: str) -> list[str]:
    """Location string -> tokens like ["gb", "europe"] or ["any"]."""
    if not location or not location.strip():
        return []

    text = " " + location.lower().strip() + " "
    tokens: set[str] = set()

    if any(_has(text, a) for a in ANYWHERE):
        return ["any"]

    for region, phrases in REGIONS.items():
        if any(_has(text, p) for p in phrases):
            tokens.add(region)

    for code, names in COUNTRIES.items():
        if any(_has(text, n) for n in names):
            tokens.add(code)

    for code, cities in CITIES.items():
        if any(_has(text, c) for c in cities):
            tokens.add(code)

    if US_ABBR.search(location) or any(_has(text, s) for s in US_STATES):
        tokens.add("us")

    for code, short in ABBREV.items():
        if any(_has(text, a) for a in short):
            tokens.add(code)

    return sorted(tokens)
