// Skill overlap alone will happily rank "Manager, Enterprise Support" as a
// perfect match for a frontend CV, because the tags overlap and nothing knows
// what the job actually is. This looks at the title.

// Broad areas of work. A title in one of these, when the CV lives in another,
// is almost always wrong no matter how the tags line up.
const DOMAINS = {
  frontend: ["frontend", "front end", "front-end", "ui engineer", "web developer"],
  backend: ["backend", "back end", "back-end", "platform engineer", "api engineer"],
  fullstack: ["fullstack", "full stack", "full-stack"],
  mobile: ["ios", "android", "mobile", "react native", "flutter"],
  data: ["data engineer", "data scientist", "analytics engineer", "machine learning", "ml engineer"],
  devops: ["devops", "sre", "site reliability", "infrastructure", "platform ops", "cloud engineer"],
  security: ["security", "appsec", "penetration"],
  design: ["designer", "design lead", "ux", "ui designer", "product design"],
  qa: ["qa engineer", "test engineer", "quality assurance"],
  sales: ["sales", "account executive", "account manager", "business development", "sdr"],
  support: ["support", "customer success", "service desk", "helpdesk"],
  marketing: ["marketing", "growth", "seo specialist", "content"],
  finance: ["finance", "accounting", "controller", "audit", "tax"],
  people: ["recruit", "talent", "human resources", "people ops"],
  legal: ["legal", "counsel", "compliance officer"],
  management: ["project manager", "programme manager", "program manager", "scrum master"],
};

// Domains a technical CV should never be pushed into on tag overlap alone.
const NON_TECHNICAL = new Set([
  "sales", "support", "marketing", "finance", "people", "legal", "management",
]);

function domainsIn(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const [name, phrases] of Object.entries(DOMAINS)) {
    if (phrases.some((p) => lower.includes(p))) found.add(name);
  }
  return found;
}

export function cvProfile(text) {
  // Only look at the top of a CV. Later sections list every technology and
  // every past role, which blurs what the person actually does now.
  return domainsIn(text.slice(0, 1200));
}

export function titleFactor(title, profile) {
  const domains = domainsIn(title);
  if (!domains.size) return 1; // unclassifiable title, judge on tags alone

  for (const d of domains) {
    if (profile.has(d)) return 1.15; // same line of work
  }

  for (const d of domains) {
    if (NON_TECHNICAL.has(d) && !profile.has(d)) return 0.25;
  }

  // A different technical domain. Related, but not what they do.
  return 0.6;
}

// Job families. Used when a live result has no description and the title is
// the only thing to go on: "Software Engineer" is a plausible match for a
// frontend CV even though the title names no domain at all.
const ROLES = {
  engineer: ["engineer", "engineering"],
  developer: ["developer", "development"],
  designer: ["designer", "design"],
  analyst: ["analyst", "analytics"],
  scientist: ["scientist"],
  architect: ["architect"],
  manager: ["manager", "head of", "director"],
  lead: ["lead", "principal", "staff"],
  consultant: ["consultant"],
  specialist: ["specialist"],
};

function rolesIn(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const [role, words] of Object.entries(ROLES)) {
    if (words.some((w) => lower.includes(w))) found.add(role);
  }
  return found;
}

export function cvRoles(text) {
  return rolesIn(text.slice(0, 1200));
}

/** Does this title describe the same kind of job the CV describes? */
export function sharesRole(title, roles) {
  if (!roles.size) return false;
  const theirs = rolesIn(title);
  for (const r of theirs) if (roles.has(r)) return true;
  return false;
}
