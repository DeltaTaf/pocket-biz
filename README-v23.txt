POCKET BIZ v23
==============
Multi-page static site. This is a review/rebuild of v22 — same product,
cleaner foundation, and several real fixes (not just a lick of paint).

WHAT CHANGED FROM v22
----------------------
Architecture
- The ~20KB country/UI dataset and ~5KB stylesheet were previously copy-pasted
  into all 7 HTML files (a change to one country's data meant editing 7 files
  and hoping you didn't miss one). Both now live once, in assets/data.js and
  assets/styles.css, and every page loads them. Total shipped size dropped
  from ~356KB to a fraction of that, and it's now safe to edit.

Content
- Germany, UAE, United States, China and South Korea previously shared one
  identical, generic paragraph for culture/etiquette/law/market/dos/don'ts
  ("Understand communication style, hierarchy..." — literally the same text
  for all five countries). Each now has real, distinct, written-for-that-market
  content in English, Japanese and Greek, matching the quality already present
  for Japan, Greece and Sweden.

Bugs fixed
- Mobile nav was completely hidden below 620px with no way to reach it — no
  menu, no language switch, nothing. Added a hamburger toggle.
- Compare page let you "compare" a country against itself with no warning.
  Picking the same country in both dropdowns now nudges the other selector
  to a different country automatically.
- Compare page had a dead, never-called `options()` function — removed.
- Compare page's "Communication" row actually just showed the first tag,
  which isn't always about communication (e.g. "Scale-driven"). Relabeled
  to "Style" so it doesn't overclaim.
- Providers page showed a green "✓ Verified Provider" badge on category
  cards even though zero real providers are listed — a false trust signal.
  Replaced with an honest "no providers listed yet" state and application CTA.
- Market Entry's "Research" button calls /api/mistakes, which isn't part of
  this static bundle. If that endpoint isn't deployed, the page now falls
  back to clearly-labeled "Starter guidance" (derived from each country's own
  Don't list) instead of just showing a raw error message to the user.
- Missing form labels (search, region filter, question box, cost fields) —
  added for screen readers.
- No favicon, meta description, or active-page nav indicator — added all three,
  plus a skip-to-content link and visible focus states.

FILES
-----
- index.html          Home
- markets.html        Market directory
- country.html        Dynamic country profile (?country=JP)
- compare.html        Country comparison
- market-entry.html   Risk, research, budget, timeline, checklist
- advisor.html        Deterministic country-specific advisor
- providers.html      Provider directory
- assets/data.js      Shared dataset + helper functions (loaded by every page)
- assets/styles.css   Shared stylesheet
- assets/favicon.svg  Brand mark favicon

API (unchanged from v22, optional)
- api/mistakes.js can be deployed for live, web-grounded Top Mistakes research.
  Without it, Market Entry now degrades gracefully instead of erroring.
- api/advisor.js is not required — the Advisor is fully deterministic.

DEPLOY
------
Upload these files into the GitHub repository root (keep the assets/ folder
alongside the HTML files), preserving the api/ directory if you use it.
Vercel will serve the HTML pages directly.

State is persisted client-side:
- pbSelectedCountry — last-viewed country
- pbLang            — language preference
- pbChecklist_<code> and pbCosts_<code> — per-country checklist and budget entries
