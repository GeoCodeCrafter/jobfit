// Fetch company job boards live, in the visitor's browser.
//
// Greenhouse and Ashby both send access-control-allow-origin: *, so this needs
// no proxy and no server. Each person's search hits the boards themselves and
// sees whatever is posted right now.
//
// Costs, measured: a Greenhouse board averages 56KB, so all 100 is about 5.5MB.
// Ashby ships the full description of every job and averages 649KB a board,
// which is 27MB for the set. That is why Ashby is opt-in.

import { classify } from "./places.js";

const GREENHOUSE = "https://boards-api.greenhouse.io/v1/boards";
const ASHBY = "https://api.ashbyhq.com/posting-api/job-board";

/** Run `worker` over `items`, `limit` at a time. */
async function pool(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        await worker(item);
      } catch {
        // A dead board token is normal. Companies close boards and rename
        // themselves, and one 404 shouldn't stop the other ninety-nine.
      }
    }
  });
  await Promise.all(runners);
}

function fromGreenhouse(token, data) {
  return (data.jobs || []).map((j) => {
    const location = j.location?.name || "";
    return {
      t: j.title,
      c: j.company_name || token,
      u: j.absolute_url,
      l: location,
      // Titles often carry the region ("Solutions Architect, APJC") when the
      // location field says nothing useful, so classify both.
      k: classify(`${location} ${j.title}`),
      p: (j.first_published || j.updated_at || "").slice(0, 10),
      r: /remote/i.test(location) ? "fully_remote" : "unclear",
      m: null,
      // Greenhouse's list endpoint has no description, so matching here works
      // off the title alone.
      text: j.title,
    };
  });
}

function fromAshby(token, data) {
  return (data.jobs || [])
    .filter((j) => j.isListed !== false)
    .map((j) => {
      const location = j.location || j.address?.postalAddress?.addressLocality || "";
      return {
        t: j.title,
        c: token,
        u: j.jobUrl || j.applyUrl,
        l: location,
        k: classify(`${location} ${j.title}`),
        p: (j.publishedAt || "").slice(0, 10),
        r: j.isRemote ? "fully_remote" : "unclear",
        m: null,
        // Ashby gives the whole description, so matching is much better here.
        text: `${j.title}\n${(j.descriptionPlain || "").slice(0, 4000)}`,
      };
    });
}

/**
 * Search every board, calling `onBatch` as each one lands so results can be
 * rendered while the rest are still in flight.
 */
export async function search(boards, { includeAshby, onBatch, onProgress, signal }) {
  const tasks = [
    ...boards.greenhouse.map((t) => ({ ats: "greenhouse", token: t })),
    ...(includeAshby ? boards.ashby.map((t) => ({ ats: "ashby", token: t })) : []),
  ];

  let done = 0;
  let bytes = 0;

  await pool(tasks, 8, async ({ ats, token }) => {
    if (signal?.aborted) return;

    const url =
      ats === "greenhouse" ? `${GREENHOUSE}/${token}/jobs` : `${ASHBY}/${token}`;

    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(String(response.status));

    const body = await response.text();
    bytes += body.length;
    const data = JSON.parse(body);

    const jobs = ats === "greenhouse" ? fromGreenhouse(token, data) : fromAshby(token, data);

    done += 1;
    onProgress?.({ done, total: tasks.length, bytes });
    if (jobs.length) onBatch?.(jobs);
  });

  return { boards: tasks.length, bytes };
}
