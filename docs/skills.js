// What to look for in a CV for each skill the index uses.
// The tokens come from the job data; the phrases are what people actually
// write on a CV. Order doesn't matter, longest match wins at scan time.

export const ALIASES = {
  accessibility: ["accessibility", "a11y", "wcag", "aria", "screen reader"],
  android_native: ["android", "jetpack compose"],
  angular: ["angular"],
  astro: ["astro"],
  automation: ["automation", "automated", "scripting", "ci/cd", "workflow automation"],
  aws: ["aws", "amazon web services", "ec2", "s3", "lambda", "dynamodb"],
  bi_tools: ["tableau", "power bi", "looker", "metabase", "qlik"],
  canvas: ["canvas", "2d context"],
  ci: ["ci", "continuous integration", "ci/cd", "jenkins", "github actions", "circleci"],
  cms: ["cms", "contentful", "sanity", "strapi", "prismic"],
  component_arch: ["design system", "component library", "storybook", "component architecture"],
  cpp: ["c++", "cpp"],
  creative_dev: ["creative develop", "creative coding", "generative", "shader", "interactive experience"],
  csharp: ["c#", ".net", "dotnet"],
  css: ["css", "scss", "stylesheet"],
  d3: ["d3", "d3.js"],
  dashboards: ["dashboard", "reporting", "data visualisation", "data visualization"],
  data_eng: ["data engineering", "etl", "elt", "data pipeline", "airflow", "dbt", "spark", "snowflake"],
  data_fetching: ["react query", "tanstack", "swr", "apollo client", "data fetching"],
  docker: ["docker", "container"],
  e2e_testing: ["playwright", "cypress", "selenium", "e2e", "end to end test"],
  figma: ["figma", "sketch", "adobe xd"],
  firebase: ["firebase", "firestore"],
  flutter: ["flutter", "dart"],
  framer_motion: ["framer motion", "framer"],
  game_engines: ["unity", "unreal", "godot", "game engine"],
  git: ["git", "version control"],
  github: ["github", "gitlab", "bitbucket"],
  go: ["golang", "go lang"],
  graphql: ["graphql", "apollo"],
  gsap: ["gsap", "greensock"],
  html: ["html", "semantic markup"],
  java: ["java", "spring boot", "kotlin jvm"],
  javascript: ["javascript", "js", "es6", "ecmascript"],
  kotlin: ["kotlin"],
  kubernetes: ["kubernetes", "k8s", "helm"],
  linting: ["eslint", "prettier", "linting", "biome"],
  mainframe: ["cobol", "mainframe", "as/400"],
  maps: ["mapbox", "leaflet", "openlayers", "geospatial", "gis"],
  ml: ["machine learning", "pytorch", "tensorflow", "scikit", "deep learning", "llm", "nlp"],
  mongodb: ["mongodb", "mongo"],
  monorepo: ["monorepo", "turborepo", "nx ", "lerna"],
  mysql: ["mysql", "mariadb"],
  netlify: ["netlify"],
  nextjs: ["next.js", "nextjs"],
  nodejs: ["node.js", "nodejs", "node "],
  performance: ["performance", "core web vitals", "lighthouse", "optimisation", "optimization"],
  php: ["php", "laravel", "symfony"],
  postgres: ["postgres", "postgresql"],
  prisma: ["prisma"],
  python: ["python", "django", "flask", "fastapi", "pandas", "numpy"],
  react: ["react", "jsx"],
  react_native: ["react native"],
  react_three_fiber: ["react three fiber", "r3f"],
  remix: ["remix"],
  responsive: ["responsive", "mobile first", "media quer"],
  rest_api: ["rest", "restful", "api design", "openapi", "swagger"],
  ruby: ["ruby", "rails"],
  rust: ["rust"],
  salesforce: ["salesforce", "apex", "sfdc"],
  sass: ["sass", "scss", "less"],
  scala: ["scala"],
  seo: ["seo", "search engine optimis", "search engine optimiz"],
  state_mgmt: ["redux", "zustand", "mobx", "state management", "recoil"],
  storybook: ["storybook"],
  styled_components: ["styled components", "styled-components", "emotion"],
  supabase: ["supabase"],
  svelte: ["svelte", "sveltekit"],
  svg: ["svg", "vector graphics"],
  swift: ["swift", "swiftui", "ios"],
  tailwind: ["tailwind"],
  terraform: ["terraform", "infrastructure as code", "pulumi"],
  testing: ["jest", "vitest", "unit test", "testing library", "pytest"],
  threejs: ["three.js", "threejs"],
  typescript: ["typescript"],
  ux: ["ux", "user experience", "user research", "usability", "wireframe"],
  vercel: ["vercel"],
  vite: ["vite"],
  vue: ["vue", "nuxt"],
  webgl: ["webgl", "shader", "glsl"],
  webpack: ["webpack", "rollup", "esbuild", "bundler"],
  wordpress: ["wordpress", "woocommerce"],
};

// Word-boundary scan. Short aliases like "js" or "go" would match inside other
// words without this, and a CV that says "Django" should not claim "go".
export function extractSkills(text) {
  const lower = text.toLowerCase();
  const found = new Set();

  for (const [token, phrases] of Object.entries(ALIASES)) {
    for (const phrase of phrases) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(?<![a-z0-9+#])${escaped}(?![a-z0-9+#])`, "i");
      if (pattern.test(lower)) {
        found.add(token);
        break;
      }
    }
  }
  return found;
}

export function extractYears(text) {
  const matches = [...text.matchAll(/(\d{1,2})\s*\+?\s*years?/gi)].map((m) => Number(m[1]));
  const plausible = matches.filter((n) => n > 0 && n < 50);
  return plausible.length ? Math.max(...plausible) : null;
}
