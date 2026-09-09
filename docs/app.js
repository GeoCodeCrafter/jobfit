import { extractSkills, extractYears } from "./skills.js";
import { cvProfile, titleFactor } from "./title.js";

const els = {
  drop: document.getElementById("drop"),
  file: document.getElementById("file"),
  browse: document.getElementById("browse"),
  pasteToggle: document.getElementById("paste-toggle"),
  paste: document.getElementById("paste"),
  status: document.getElementById("status"),
  controls: document.getElementById("controls"),
  results: document.getElementById("results"),
  hideStale: document.getElementById("hide-stale"),
  staleDays: document.getElementById("stale-days"),
  remoteOnly: document.getElementById("remote-only"),
  mySkills: document.getElementById("my-skills"),
};

let jobs = [];
let mine = new Set();
let profile = new Set();

const indexReady = fetch("jobs.json")
  .then((r) => r.json())
  .then((d) => {
    jobs = d.jobs;
  });

// -- scoring ---------------------------------------------------------------

const DAY = 86400000;

function ageOf(job) {
  if (!job.p) return null;
  return Math.round((Date.now() - Date.parse(job.p)) / DAY);
}

function score(job) {
  const need = job.s;
  const matched = need.filter((s) => mine.has(s));
  if (!matched.length) return null;

  // Share of what the job asks for, damped so a job listing one skill you
  // happen to have can't beat a job listing five that you also have.
  const coverage = matched.length / need.length;
  let value = coverage * Math.min(matched.length / 4, 1);

  value *= titleFactor(job.t, profile);

  const age = ageOf(job);
  if (age !== null && age > 90) value *= 0.7;

  return { job, matched, age, score: Math.min(100, Math.round(value * 100)) };
}

function render() {
  const limit = Number(els.staleDays.value);
  const hideStale = els.hideStale.checked;
  const remoteOnly = els.remoteOnly.checked;

  const rows = jobs
    .map(score)
    .filter(Boolean)
    .filter((r) => !(hideStale && r.age !== null && r.age > limit))
    .filter((r) => !(remoteOnly && r.job.r !== "fully_remote"))
    .sort((a, b) => b.score - a.score || (a.age ?? 999) - (b.age ?? 999))
    .slice(0, 200);

  els.status.hidden = false;
  els.status.textContent = `${rows.length} of ${jobs.length.toLocaleString()} jobs match your CV`;

  els.results.innerHTML = rows.map(card).join("");
}

function card(r) {
  const { job, matched, age, score } = r;
  const stale = age !== null && age > 90;
  const ageLabel =
    age === null
      ? `<span class="age unknown" title="This board doesn't publish a reliable date">age unknown</span>`
      : `<span class="age ${stale ? "stale" : ""}">${age} days open</span>`;

  const salary = job.m ? `<span class="salary">£${Number(job.m).toLocaleString()}+</span>` : "";
  const tags = matched.map((s) => `<span class="tag">${s.replace(/_/g, " ")}</span>`).join("");

  return `
    <article class="job">
      <div class="score" style="--v:${score}">${score}</div>
      <div class="body">
        <h3><a href="${job.u}" target="_blank" rel="noopener">${esc(job.t)}</a></h3>
        <p class="meta">${esc(job.c)}${job.l ? ` · ${esc(job.l)}` : ""} ${salary}</p>
        <p class="tags">${tags}</p>
      </div>
      <div class="right">${ageLabel}</div>
    </article>`;
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// -- input -----------------------------------------------------------------

async function useCv(text) {
  await indexReady;

  mine = extractSkills(text);
  profile = cvProfile(text);
  const years = extractYears(text);

  if (!mine.size) {
    els.status.hidden = false;
    els.status.textContent =
      "Couldn't find any recognisable skills in that. Is it definitely a CV?";
    els.controls.hidden = true;
    els.results.innerHTML = "";
    return;
  }

  els.controls.hidden = false;
  els.mySkills.textContent =
    [...mine].map((s) => s.replace(/_/g, " ")).sort().join(", ") +
    (years ? ` · ${years} years` : "");
  render();
}

async function readFile(file) {
  if (file.name.toLowerCase().endsWith(".pdf")) {
    return readPdf(file);
  }
  return file.text();
}

async function readPdf(file) {
  // pdf.js is only loaded if someone actually drops a PDF.
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs";
      s.type = "module";
      s.onload = resolve;
      s.onerror = reject;
      document.head.append(s);
    });
  }
  const lib = window.pdfjsLib;
  if (!lib) throw new Error("could not load the PDF reader");

  lib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
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
  el.addEventListener("change", () => mine.size && render())
);
