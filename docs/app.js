import { extractSkills, extractYears } from "./skills.js";
import { cvProfile, cvRoles, sharesRole, titleFactor } from "./title.js";
import { COUNTRY_NAMES, detectCountry, reachable } from "./where.js";
import { search } from "./live.js";

const els = {};
for (const id of [
  "drop", "file", "browse", "paste-toggle", "paste", "status", "controls",
  "results", "hide-stale", "stale-days", "remote-only", "my-skills", "country",
  "where-note", "search-live", "include-ashby", "progress",
]) {
  els[id.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = document.getElementById(id);
}

let snapshot = [];
let live = null; // stays null until a live search runs
let mine = new Set();
let profile = new Set();
let roles = new Set();
let country = null;
let cvText = "";
let aborter = null;

const snapshotReady = fetch("jobs.json")
  .then((r) => r.json())
  .then((d) => {
    snapshot = d.jobs;
  });

const boardsReady = fetch("boards.json").then((r) => r.json());

// -- scoring ---------------------------------------------------------------

const DAY = 86400000;

function ageOf(job) {
  if (!job.p) return null;
  const days = Math.round((Date.now() - Date.parse(job.p)) / DAY);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

function score(job) {
  const need = job.s || [];
  const matched = need.filter((s) => mine.has(s));
  const fit = titleFactor(job.t, profile);

  let value;
  if (!need.length) {
    // Greenhouse's board endpoint has no description, so live results often
    // have nothing to go on but the title. Fetching descriptions would cost
    // 80MB across the boards, so instead: same domain scores like a real
    // match, same job family scores lower, anything else is dropped.
    if (fit >= 1.1) value = 0.5;
    else if (fit >= 1 && sharesRole(job.t, roles)) value = 0.22;
    else return null;
  } else {
    if (!matched.length) return null;
    const coverage = matched.length / need.length;
    value = coverage * Math.min(matched.length / 4, 1);
  }

  value *= fit;

  const age = ageOf(job);
  if (age !== null && age > 90) value *= 0.7;

  return { job, matched, age, score: Math.min(100, Math.round(value * 100)) };
}

// -- rendering -------------------------------------------------------------

function fillCountries() {
  const codes = Object.keys(COUNTRY_NAMES).sort((a, b) =>
    COUNTRY_NAMES[a].localeCompare(COUNTRY_NAMES[b])
  );
  els.country.innerHTML =
    `<option value="">Anywhere</option>` +
    codes.map((c) => `<option value="${c}">${COUNTRY_NAMES[c]}</option>`).join("");
  els.country.value = country || "";
  els.whereNote.textContent = country
    ? "picked up from your CV"
    : "couldn't tell from your CV, so nothing is filtered out";
}

function render() {
  const pool = live ?? snapshot;
  const limit = Number(els.staleDays.value);

  const matches = pool
    .map(score)
    .filter(Boolean)
    .filter((r) => !(els.hideStale.checked && r.age !== null && r.age > limit))
    .filter((r) => !(els.remoteOnly.checked && r.job.r !== "fully_remote"))
    .filter((r) => reachable(r.job, country))
    .sort((a, b) => b.score - a.score || (a.age ?? 999) - (b.age ?? 999));

  const rows = matches.slice(0, 200);
  const source = live ? "searched live" : "from the saved index";

  els.status.hidden = false;
  const shown = rows.length < matches.length ? `Showing the top ${rows.length} of ` : "";
  els.status.textContent = matches.length
    ? `${shown}${matches.length} matches, out of ${pool.length.toLocaleString()} jobs ${source}`
    : "Nothing matched yet. Try widening the filters above.";

  els.results.innerHTML = rows.map(card).join("");

  if (matches.length < 5 && !aborter) {
    els.results.innerHTML +=
      `<p class="empty">These listings are mostly software, design and data
       roles, gathered from tech company job boards. If you work in another
       field there is probably very little here for you yet.</p>`;
  }
}

function card(r) {
  const { job, matched, age, score } = r;
  const stale = age !== null && age > 90;
  const ageLabel =
    age === null
      ? `<span class="age unknown" title="This board doesn't publish a reliable date">age unknown</span>`
      : `<span class="age ${stale ? "stale" : ""}">${age} day${age === 1 ? "" : "s"} open</span>`;

  const salary = job.m ? `<span class="salary">£${Number(job.m).toLocaleString()}+</span>` : "";
  const tags = matched.map((s) => `<span class="tag">${esc(s.replace(/_/g, " "))}</span>`).join("");

  return `
    <article class="job">
      <div class="score" style="--v:${score}">${score}</div>
      <div class="body">
        <h3><a href="${esc(job.u)}" target="_blank" rel="noopener">${esc(job.t)}</a></h3>
        <p class="meta">${esc(job.c)}${job.l ? ` · ${esc(job.l)}` : ""} ${salary}</p>
        <p class="tags">${tags}</p>
      </div>
      <div class="right">${ageLabel}</div>
    </article>`;
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

// -- live search -----------------------------------------------------------

async function runLive() {
  if (aborter) {
    aborter.abort();
    return;
  }

  const boards = await boardsReady;
  aborter = new AbortController();
  live = [];
  els.searchLive.textContent = "Stop";
  els.progress.hidden = false;

  const total =
    boards.greenhouse.length + (els.includeAshby.checked ? boards.ashby.length : 0);
  els.progress.textContent = `Searching ${total} company boards…`;

  try {
    await search(boards, {
      includeAshby: els.includeAshby.checked,
      signal: aborter.signal,
      onProgress: ({ done, total, bytes }) => {
        els.progress.textContent = `Searched ${done} of ${total} boards · ${(
          bytes / 1048576
        ).toFixed(1)} MB`;
      },
      onBatch: (jobs) => {
        for (const job of jobs) job.s = [...extractSkills(job.text)];
        live.push(...jobs);
        render();
      },
    });
    els.progress.textContent = `Done. ${live.length.toLocaleString()} jobs, posted as of right now.`;
  } catch (err) {
    if (err.name !== "AbortError") {
      els.progress.textContent = `Search failed: ${err.message}`;
    }
  } finally {
    aborter = null;
    els.searchLive.textContent = "Search company boards live";
    render();
  }
}

// -- input -----------------------------------------------------------------

async function useCv(text) {
  await snapshotReady;
  cvText = text;

  mine = extractSkills(text);
  profile = cvProfile(text);
  roles = cvRoles(text);
  country = detectCountry(text);
  fillCountries();

  if (!mine.size && !profile.size) {
    els.status.hidden = false;
    els.status.textContent =
      "Couldn't find any skills it recognises in that. The list it matches " +
      "against is mostly software, design and data. If you work in another " +
      "field, this won't be much use to you yet.";
    els.controls.hidden = true;
    els.results.innerHTML = "";
    return;
  }

  const years = extractYears(text);
  els.controls.hidden = false;
  els.mySkills.textContent =
    [...mine].map((s) => s.replace(/_/g, " ")).sort().join(", ") +
    (years ? ` · ${years} years` : "");
  render();
}

async function readFile(file) {
  if (!file.name.toLowerCase().endsWith(".pdf")) return file.text();

  if (!window.pdfjsLib) {
    await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs");
  }
  const lib = window.pdfjsLib;
  if (!lib) throw new Error("could not load the PDF reader");

  lib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    out += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return out;
}

async function handleFile(file) {
  els.status.hidden = false;
  els.status.textContent = `Reading ${file.name}…`;
  try {
    await useCv(await readFile(file));
  } catch (err) {
    els.status.textContent = `Couldn't read that file. ${err.message}`;
  }
}

els.browse.addEventListener("click", () => els.file.click());
els.file.addEventListener("change", () => els.file.files[0] && handleFile(els.file.files[0]));

els.pasteToggle.addEventListener("click", () => {
  els.paste.hidden = !els.paste.hidden;
  if (!els.paste.hidden) els.paste.focus();
});

let typing;
els.paste.addEventListener("input", () => {
  clearTimeout(typing);
  typing = setTimeout(() => els.paste.value.trim() && useCv(els.paste.value), 400);
});

["dragenter", "dragover"].forEach((e) =>
  els.drop.addEventListener(e, (ev) => {
    ev.preventDefault();
    els.drop.classList.add("over");
  })
);
["dragleave", "drop"].forEach((e) =>
  els.drop.addEventListener(e, (ev) => {
    ev.preventDefault();
    els.drop.classList.remove("over");
  })
);
els.drop.addEventListener("drop", (ev) => {
  const file = ev.dataTransfer.files[0];
  if (file) handleFile(file);
});

[els.hideStale, els.staleDays, els.remoteOnly].forEach((el) =>
  el.addEventListener("change", () => cvText && render())
);

els.country.addEventListener("change", () => {
  country = els.country.value || null;
  els.whereNote.textContent = country ? "" : "showing everywhere";
  if (cvText) render();
});

els.searchLive.addEventListener("click", runLive);
