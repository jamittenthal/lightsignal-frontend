Customer Reviews & Reputation Intelligence

This page is implemented at `/reviews` (server page: `app/reviews/page.tsx`, client: `app/reviews/ReviewsClient.tsx`).

Features implemented (minimal, per spec):
- Backend-first fetch to POST `${NEXT_PUBLIC_API_URL}/api/ai/reviews/full` via `lib/api.ts::fetchReviewsFull`, with a safe stub fallback `REVIEWS_STUB`.
- KPI cards, Integrations list, Unified feed with right-side response drawer, AI analysis panel, Campaign/QR builder stub, Reports/Exports buttons.
- Draft reply flow uses `lib/api.ts::draftReviewReply` which POSTs to `/api/ai/reviews/respond` and falls back to a polite draft stub.
- Nav link added to `app/layout.tsx` as `Customer Reviews & Reputation Intelligence`.

Notes for reviewers:
- The UI is intentionally minimal and responsive (Tailwind classes).
- No platform OAuth or auto-post implemented; send actions are disabled with a demo notice.
- Typecheck passes (`npx tsc --noEmit`).

QA:
- Visit `/reviews` in the dev preview to confirm rendering.
- Try `Draft Reply` on a review — it will call the draft API or return a fallback draft.

If you'd like, I can expand the tests, add visual snapshots, or wire-up OAuth flows next.
