"use client";
import { useEffect, useState } from "react";
import { getOpportunityProfile, upsertOpportunityProfile } from "@/lib/api";

export default function ProfilePanel() {
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => setProfile(await getOpportunityProfile("demo")))();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await upsertOpportunityProfile(profile);
      alert("Profile saved");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="rounded-xl border p-4">
      <div className="font-medium mb-2">Opportunity Profile</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col">
          <span className="text-slate-600 mb-1">Business Type</span>
          <input className="border rounded px-2 py-1"
            value={profile.business_type || ""}
            onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
            placeholder="e.g., Food Truck, HVAC Service"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-slate-600 mb-1">Region</span>
          <input className="border rounded px-2 py-1"
            value={profile.region || ""}
            onChange={(e) => setProfile({ ...profile, region: e.target.value })}
            placeholder="e.g., Tampa, FL"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-slate-600 mb-1">Radius (miles)</span>
          <input type="number" className="border rounded px-2 py-1"
            value={profile.radius_miles || 50}
            onChange={(e) => setProfile({ ...profile, radius_miles: Number(e.target.value || 0) })}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-slate-600 mb-1">Preferred Types (comma-separated)</span>
          <input className="border rounded px-2 py-1"
            value={(profile.preferred_types || []).join(",")}
            onChange={(e) => setProfile({ ...profile, preferred_types: e.target.value.split(",").map((s)=>s.trim()).filter(Boolean) })}
            placeholder="event, partner, bid, grant"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-slate-600 mb-1">Risk Appetite</span>
          <select className="border rounded px-2 py-1"
            value={profile.risk_appetite || "low"}
            onChange={(e) => setProfile({ ...profile, risk_appetite: e.target.value })}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
      </div>
      <div className="mt-3">
        <button onClick={save} disabled={saving} className="rounded bg-black text-white px-4 py-2">
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
