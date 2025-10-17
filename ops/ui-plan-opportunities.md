Intent: opportunities
Route: opportunities
Company: demo

UI:
- Page sections: header (KPIs), list with filters, right-side detail drawer, bottom query box.
- Fields to show in list: title, category, date or deadline, fit_score, roi_est.
- Actions: “Add to Watchlist”, “Simulate”.
- Detail drawer shows full item JSON and a button to simulate (stub OK).

Data:
- Primary source: POST /api/intent with intent="opportunities", company_id="demo".
- If backend returns error, show an inline message and keep page usable.

Acceptance:
- Page builds on Vercel without TypeScript errors.
- Clicking “Add to Watchlist” and “Simulate” just shows a toast for now (stub).
- No crashes if response fields are missing.
 
<!-- refresh:18581583567 -->
