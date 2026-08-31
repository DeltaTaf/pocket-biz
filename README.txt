POCKET BIZ v22
=============
Multi-page static architecture.

Files:
- index.html          Home
- markets.html        Market directory
- country.html        Dynamic country profile (?country=JP)
- compare.html        Country comparison
- market-entry.html   Risk, research, budget, timeline, checklist
- advisor.html        Deterministic country-specific advisor
- providers.html      Provider directory

API:
- api/mistakes.js can remain for web-grounded Top Mistakes research.
- api/advisor.js is no longer required by the preview Advisor.

Deploy:
Upload the files into the GitHub repository root, preserving the api/ directory.
Vercel will serve the HTML pages directly.

Country state is persisted with localStorage key pbSelectedCountry.
Language state is persisted with pbLang.
