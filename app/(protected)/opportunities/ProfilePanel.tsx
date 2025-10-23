"use client";
import { useEffect, useState } from "react";
import { getOpportunityProfile, upsertOpportunityProfile } from "@/lib/api";

export default function ProfilePanel() {
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getOpportunityProfile("demo");
      setProfile(data || {
        business_type: "Food Truck",
        region: "Tampa, FL", 
        radius_miles: 50,
        preferred_types: ["event", "rfp", "grant", "partnership"],
        budget_max: 5000,
        travel_range_miles: 60,
        staffing_capacity: "normal",
        risk_appetite: "low",
        auto_sync: true,
        indoor_only: false
      });
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await upsertOpportunityProfile(profile);
      alert("Profile saved successfully");
    } catch (e: any) {
      alert("Error saving profile: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="animate-pulse text-slate-500">Loading profile...</div>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Opportunity Profile</h3>
          <p className="text-sm text-slate-600">Configure preferences for personalized opportunity matching</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? "Collapse" : "Expand All"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Core Business Info */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Core Business Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Business Type
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={profile.business_type || ""}
                onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
                placeholder="e.g., Food Truck, HVAC Service, Consulting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Operating Region
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={profile.region || ""}
                onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                placeholder="e.g., Tampa, FL or Austin Metro"
              />
            </div>
          </div>
        </div>

        {/* Opportunity Preferences */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Opportunity Preferences</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preferred Opportunity Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: "rfp", label: "RFPs & Bids" },
                  { id: "grant", label: "Grants" },
                  { id: "event", label: "Trade Shows & Events" },
                  { id: "partnership", label: "Partnerships" },
                  { id: "vendor", label: "Vendor/Subcontractor" },
                  { id: "certification", label: "Certifications/Training" }
                ].map((type) => (
                  <label key={type.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(profile.preferred_types || []).includes(type.id)}
                      onChange={(e) => {
                        const types = profile.preferred_types || [];
                        if (e.target.checked) {
                          setProfile({ ...profile, preferred_types: [...types, type.id] });
                        } else {
                          setProfile({ ...profile, preferred_types: types.filter((t: string) => t !== type.id) });
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Constraints & Filters */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Constraints & Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Search Radius (miles)
              </label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={profile.radius_miles || 50}
                onChange={(e) => setProfile({ ...profile, radius_miles: Number(e.target.value) || 0 })}
                min="1"
                max="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Budget/Investment
              </label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={profile.budget_max || 5000}
                onChange={(e) => setProfile({ ...profile, budget_max: Number(e.target.value) || 0 })}
                min="0"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Travel Range (miles)
              </label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={profile.travel_range_miles || 60}
                onChange={(e) => setProfile({ ...profile, travel_range_miles: Number(e.target.value) || 0 })}
                min="1"
                max="1000"
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings (Expandable) */}
        {isExpanded && (
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Advanced Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Staffing Capacity
                </label>
                <select
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profile.staffing_capacity || "normal"}
                  onChange={(e) => setProfile({ ...profile, staffing_capacity: e.target.value })}
                >
                  <option value="low">Low - Limited availability</option>
                  <option value="normal">Normal - Standard capacity</option>
                  <option value="high">High - Can scale up quickly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Risk Appetite
                </label>
                <select
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profile.risk_appetite || "low"}
                  onChange={(e) => setProfile({ ...profile, risk_appetite: e.target.value })}
                >
                  <option value="low">Low - Proven opportunities only</option>
                  <option value="medium">Medium - Balanced approach</option>
                  <option value="high">High - Open to new/experimental</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.indoor_only || false}
                  onChange={(e) => setProfile({ ...profile, indoor_only: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Indoor events only (filter out weather-dependent opportunities)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.auto_sync !== false}
                  onChange={(e) => setProfile({ ...profile, auto_sync: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Auto-sync with business profile & financials (recommended)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Profile auto-updates weekly based on your activity and performance
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
