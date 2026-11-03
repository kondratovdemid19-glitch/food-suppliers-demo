# Supplier workspace implementation plan

Goal: replace the demonstration landing with a usable procurement tool matching Goulash.Tech's brief.
Architecture: canonical public JSON shared by TypeScript and a read-only Python/SQLite service; private working notes stay in the browser.

- [x] Extract canonical catalog, add two researched suppliers, retain individual source dates.
- [x] Add failing tests for city/product matching, stored shortlist and CSV formula neutralization. Implement pure matching/state/export helpers.
- [x] Add failing Python endpoint tests for category/region/query validation and injection-like input. Implement SQLite-backed HTTP server and health checks.
- [x] Rebuild app: compact query/filter workspace, supplier dialog, persistent shortlist and notes, comparison dialog, editable purchase request and exports.
- [x] Verify keyboard focus/escape, 390px/1440px layouts, persistence and empty/reset flows in the built-in browser. Fix observed defects.
- [x] Audit dependencies, run all tests and build; update README and actual verification evidence. Publish main and gh-pages through Demid's authenticated account, verify previous URL, restore prior CLI account. No HR messages.
