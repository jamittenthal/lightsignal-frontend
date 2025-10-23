"use client";

import { useEffect, useState } from "react";
import { fetchOpportunitiesFull, exportCSVUrl } from "@/lib/api";
import Link from "next/link";
import Chatbot from "./Chatbot";
import DetailDrawer from "./DetailDrawer";
import ProfilePanel from "./ProfilePanel";

export default function OpportunitiesPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<any | null>(null);
  const [activeSection, setActiveSection] = useState<string>("feed");

  async function fetchOpps() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const resp = await fetchOpportunitiesFull({
        filters: {
          types: ["rfp", "event", "grant", "partnership"],
          radius_miles: 50,
          budget_max: 5000,
          indoor_only: false
        },
        include_peers: true,
        include_weather: true
      }, "demo");
      const payload = resp?.result ?? resp;
      setData(payload);
    } catch (e: any) {
      setError(e?.message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOpps();
    // listen for chatbot-injected feed items
    function onChatAppend(e: any) {
      const detail = e?.detail;
      if (!detail) return;
      setData((d: any) => {
        if (!d) return { feed: [detail] };
        return { ...d, feed: [detail].concat(d.feed || []) };
      });
    }
    window.addEventListener("opportunities:append", onChatAppend as any);
    return () => window.removeEventListener("opportunities:append", onChatAppend as any);
  }, []);

  function fmtMoney(n?: number) {
    if (typeof n !== "number") return "—";
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function fmtNumber(n?: number, suffix = "") {
    if (typeof n !== "number") return "—";
    return n.toLocaleString() + suffix;
  }

  const kpis = data?.kpis || [];
  const feed = data?.feed || [];
  const watchlist = data?.watchlist || [];
  const costRoiInsights = data?.cost_roi_insights || {};
  const eventsExplorer = data?.events_explorer || [];
  const contracts = data?.contracts || [];
  const seasonality = data?.seasonality || {};
  const performanceAnalytics = data?.performance_analytics || {};
  const exportData = data?.export || {};

  const kpiConfig = [
    { id: "active", icon: "🧭", title: "Active Opportunities", guidance: "new matches this week" },
    { id: "potential_value", icon: "💰", title: "Potential Revenue Value", guidance: "available potential" },
    { id: "fit_score_avg", icon: "🧩", title: "Fit Score (Avg)", guidance: "🟢 80–100 = strong; 🟡 60–79 = moderate; 🔴 <60 = low" },
    { id: "event_readiness", icon: "🌦️", title: "Event Readiness Index", guidance: "optimal conditions this week" },
    { id: "historical_roi", icon: "📈", title: "Historical ROI", guidance: "across past events" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Opportunities</h1>
          <p className="text-slate-600 mt-1">The AI Scout, Analyst, and Weather Advisor for Growth</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOpps}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm bg-black text-white disabled:opacity-50 hover:bg-slate-800"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <a href={exportCSVUrl("demo")} className="rounded-md px-4 py-2 text-sm border hover:bg-slate-50">
            📤 Export
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiConfig.map((config) => {
            const kpi = kpis.find((k: any) => k.id === config.id) || {};
            let value = kpi.value ?? "—";
            let note = kpi.note || "";
            
            if (config.id === "potential_value" && typeof value === "number") {
              value = fmtMoney(value);
              note = kpi.formatted ? `${kpi.formatted} ${note}` : note;
            } else if (config.id === "historical_roi" && typeof value === "number") {
              value = `${value}${kpi.unit || "×"}`;
            } else if ((config.id === "fit_score_avg" || config.id === "event_readiness") && typeof value === "number") {
              value = `${value}%`;
            }

            return (
              <div 
                key={config.id} 
                className="rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (config.id === "active") setActiveSection("feed");
                  else if (config.id === "potential_value") setActiveSection("watchlist");
                  else setActiveSection("insights");
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{config.icon}</span>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                    {config.title}
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
                <div className="text-xs text-slate-600">
                  {note || config.guidance}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Opportunity Profile Setup */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🧾</span>
          <span className="text-lg">⚙️</span>
          <h2 className="text-xl font-semibold">Opportunity Profile Setup</h2>
        </div>
        <ProfilePanel />
      </section>

      {/* Section Navigation */}
      <nav className="mb-6 border-b border-slate-200">
        <div className="flex gap-8">
          {[
            { id: "feed", label: "🔍 Curated Feed", icon: "📬" },
            { id: "watchlist", label: "📅 Watchlist", icon: "⏳" },
            { id: "insights", label: "💵 Cost & ROI Insights", icon: "📊" },
            { id: "explorer", label: "🎪 Event Explorer", icon: "🌦️" },
            { id: "contracts", label: "🏛 Gov Contracts & Grants", icon: "📜" },
            { id: "seasonality", label: "📅 AI Forecast", icon: "🌍" },
            { id: "analytics", label: "📈 Performance Analytics", icon: "🧠" }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === section.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Curated Opportunity Feed */}
      {activeSection === "feed" && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔍</span>
            <span className="text-lg">📬</span>
            <h2 className="text-xl font-semibold">Curated Opportunity Feed</h2>
          </div>
          {feed.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-lg font-medium mb-2">No opportunities found</div>
              <div className="text-sm">Try adjusting your profile settings or use the AI Scout to search.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {feed.map((item: any, idx: number) => (
                <div key={item.id || idx} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-1">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Badge category={item.category}>{item.category}</Badge>
                        <span>•</span>
                        <span>{item.source}</span>
                      </div>
                    </div>
                    <FitScoreBadge score={item.fit_score} />
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    {item.event_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Event Date:</span>
                        <span className="font-medium">{item.event_date}</span>
                      </div>
                    )}
                    {item.deadline && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Deadline:</span>
                        <span className="font-medium">{item.deadline}</span>
                      </div>
                    )}
                    {item.est_revenue && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Est. Revenue:</span>
                        <span className="font-medium text-green-600">{fmtMoney(item.est_revenue)}</span>
                      </div>
                    )}
                    {item.est_cost && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Est. Cost:</span>
                        <span className="font-medium">{fmtMoney(item.est_cost)}</span>
                      </div>
                    )}
                    {item.peer_outcome && (
                      <div className="text-xs text-slate-600 bg-slate-50 rounded p-2">
                        <span className="font-medium">Peer Data:</span> {item.peer_outcome}
                      </div>
                    )}
                  </div>

                  {item.weather && (
                    <WeatherBadge weather={item.weather} />
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setOpenItem(item)}
                      className="flex-1 text-xs bg-slate-900 text-white rounded px-3 py-2 hover:bg-slate-800"
                    >
                      View Details
                    </button>
                    <button className="text-xs border rounded px-3 py-2 hover:bg-slate-50">
                      Save
                    </button>
                    <button className="text-xs border rounded px-3 py-2 hover:bg-slate-50">
                      Simulate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Watchlist & Tracking */}
      {activeSection === "watchlist" && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📅</span>
            <span className="text-lg">⏳</span>
            <h2 className="text-xl font-semibold">Watchlist & Tracking</h2>
          </div>
          {watchlist.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-4">📅</div>
              <div className="text-lg font-medium mb-2">Your watchlist is empty</div>
              <div className="text-sm">Save opportunities from the feed to track them here.</div>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-900">Opportunity</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-900">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-900">Timeline</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-900">Expected ROI</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {watchlist.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">ID: {item.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">{item.when}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-green-600">{item.expected_roi_x}×</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-xs border rounded px-2 py-1 hover:bg-slate-50">Edit</button>
                          <button className="text-xs text-red-600 hover:bg-red-50 rounded px-2 py-1">Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Cost & ROI Insights */}
      {activeSection === "insights" && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💵</span>
            <span className="text-lg">📊</span>
            <h2 className="text-xl font-semibold">Cost & ROI Insights</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">Average ROI by Category</h3>
              <div className="space-y-3">
                {Object.entries(costRoiInsights.avg_roi_by_category || {}).map(([category, roi]: [string, any]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize text-slate-600">{category}</span>
                    <span className="font-medium">{roi}×</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">Performance Summary</h3>
              <div className="space-y-3 text-sm">
                <div><strong>Top Activity:</strong> {costRoiInsights.top_activity}</div>
                <div><strong>Peer Comparison:</strong> {costRoiInsights.peer_compare_note}</div>
                <div className="bg-blue-50 rounded p-3">
                  <div className="font-medium text-blue-900 mb-2">AI Commentary</div>
                  {(costRoiInsights.ai_commentary || []).map((comment: string, idx: number) => (
                    <div key={idx} className="text-blue-800 text-xs">• {comment}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Event Explorer */}
      {activeSection === "explorer" && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎪</span>
            <span className="text-lg">📍</span>
            <span className="text-lg">🌦️</span>
            <h2 className="text-xl font-semibold">Local & Industry Event Explorer</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {eventsExplorer.map((event: any, idx: number) => (
              <div key={event.id || idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{event.title}</h3>
                  <FitScoreBadge score={event.fit_score} />
                </div>
                <div className="text-sm text-slate-600 mb-2">{event.date}</div>
                {event.weather_badge && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`inline-block w-2 h-2 rounded-full ${event.weather_badge.good_weather ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    <span>{event.weather_badge.rain_pct}% rain chance</span>
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-2">
                  Attendance Impact: <span className="capitalize">{event.attendance_impact}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Government Contracts & Grants */}
      {activeSection === "contracts" && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏛</span>
            <span className="text-lg">📜</span>
            <span className="text-lg">💼</span>
            <h2 className="text-xl font-semibold">Government Contracts, Grants & Programs</h2>
          </div>
          <div className="space-y-4">
            {contracts.map((contract: any, idx: number) => (
              <div key={contract.id || idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-lg">{contract.title}</h3>
                    <div className="text-sm text-slate-600">Deadline: {contract.deadline}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{fmtMoney(contract.size)}</div>
                    <div className="text-xs text-slate-500">{contract.term_months} months</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600">Competition</div>
                    <div className="font-medium capitalize">{contract.competition}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Peer Win Rate</div>
                    <div className="font-medium">{(contract.peer_win_rate * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-600">AI Confidence</div>
                    <div className="font-medium">{(contract.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Forecast & Seasonal Planning */}
      {activeSection === "seasonality" && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📅</span>
            <span className="text-lg">🌍</span>
            <h2 className="text-xl font-semibold">AI Forecast & Seasonal Planning</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">Best Windows</h3>
              <div className="flex flex-wrap gap-2">
                {(seasonality.best_windows || []).map((window: string, idx: number) => (
                  <Badge key={idx} category="season">{window}</Badge>
                ))}
              </div>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">Event Climate Outlook</h3>
              <div className="space-y-2">
                {(seasonality.event_climate_outlook || []).map((outlook: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-600">{outlook.month}</span>
                    <span className="font-medium text-green-600">+{outlook.attendance_bump_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Performance Analytics */}
      {activeSection === "analytics" && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📈</span>
            <span className="text-lg">🧠</span>
            <h2 className="text-xl font-semibold">Performance Analytics & Learning</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">Win/Loss Record</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{performanceAnalytics.wins || 0}</div>
                <div className="text-sm text-slate-600">Wins</div>
                <div className="text-xl font-bold text-red-600 mt-2">{performanceAnalytics.losses || 0}</div>
                <div className="text-sm text-slate-600">Losses</div>
              </div>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">ROI by Category</h3>
              <div className="space-y-2">
                {Object.entries(performanceAnalytics.roi_by_category || {}).map(([category, roi]: [string, any]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize text-slate-600">{category}</span>
                    <span className="font-medium">{roi}×</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">Learning Notes</h3>
              <div className="space-y-2">
                {(performanceAnalytics.learning_notes || []).map((note: string, idx: number) => (
                  <div key={idx} className="text-sm text-slate-600">• {note}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Export & Collaboration */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📤</span>
          <span className="text-lg">🧾</span>
          <span className="text-lg">🤝</span>
          <h2 className="text-xl font-semibold">Export & Collaboration</h2>
        </div>
        <div className="flex gap-4">
          {exportData.pdf_available && (
            <button className="border rounded-lg px-4 py-2 text-sm hover:bg-slate-50">
              📄 Export PDF Portfolio
            </button>
          )}
          {exportData.csv_available && (
            <a href={exportCSVUrl("demo")} className="border rounded-lg px-4 py-2 text-sm hover:bg-slate-50">
              📊 Export CSV Data
            </a>
          )}
          {exportData.collab && (
            <button className="border rounded-lg px-4 py-2 text-sm hover:bg-slate-50">
              👥 Share with Team
            </button>
          )}
        </div>
      </section>

      <Chatbot />
      {openItem && <DetailDrawer item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  );
}

function Badge({ children, category }: { children: any; category?: string }) {
  const colors = {
    rfp: "bg-blue-100 text-blue-800",
    event: "bg-green-100 text-green-800", 
    grant: "bg-purple-100 text-purple-800",
    partnership: "bg-orange-100 text-orange-800",
    season: "bg-yellow-100 text-yellow-800",
    default: "bg-slate-100 text-slate-800"
  };
  
  const colorClass = colors[category as keyof typeof colors] || colors.default;
  
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
}

function FitScoreBadge({ score }: { score?: number }) {
  if (typeof score !== "number") return null;
  
  let color = "bg-red-100 text-red-800";
  let icon = "🔴";
  
  if (score >= 80) {
    color = "bg-green-100 text-green-800";
    icon = "🟢";
  } else if (score >= 60) {
    color = "bg-yellow-100 text-yellow-800";
    icon = "🟡";
  }
  
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {icon} {score}%
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const colors = {
    Open: "bg-green-100 text-green-800",
    Applied: "bg-blue-100 text-blue-800",
    Attended: "bg-purple-100 text-purple-800",
    Won: "bg-green-100 text-green-800",
    Lost: "bg-red-100 text-red-800",
    Closed: "bg-slate-100 text-slate-800"
  };
  
  const colorClass = colors[status as keyof typeof colors] || colors.Closed;
  
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}

function WeatherBadge({ weather }: { weather: any }) {
  if (!weather) return null;
  
  return (
    <div className="bg-blue-50 rounded p-2 text-xs">
      <div className="flex items-center gap-2 text-blue-800">
        <span>🌤️</span>
        <span>{weather.temp_f}°F</span>
        <span>💧 {weather.rain_pct}%</span>
        <span>💨 {weather.wind_mph}mph</span>
      </div>
      {weather.note && (
        <div className="text-blue-600 mt-1">{weather.note}</div>
      )}
    </div>
  );
}
