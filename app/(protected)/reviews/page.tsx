import React from "react";
import ReviewsClient from "./ReviewsClient";
import { fetchReviewsFull } from "@/lib/api";

export const metadata = { title: "Customer Reviews & Reputation Intelligence" };

export default async function ReviewsPage() {
  // server-side fetch (backend-first, with safe stub fallback inside fetchReviewsFull)
  const data = await fetchReviewsFull({}, "demo");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Customer Reviews & Reputation Intelligence</h1>
      <p className="text-sm text-slate-500">Unified review feed, sentiment, AI analysis, and response center.</p>

      <ReviewsClient initialData={data} />
    </div>
  );
}
