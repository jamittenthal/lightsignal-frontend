"use client";

import React, { useState, useEffect } from "react";
import KpiCard from "../../components/KpiCard";
import { callIntent } from "../../lib/api";

// Stub data as specified in the requirements
const INVENTORY_STUB = {
  "kpis": [
    { "id": "total_skus", "label": "Total SKUs / Items", "value": 4312, "note": "across 3 warehouses", "state": "good" },
    { "id": "locations_online", "label": "Locations Online", "value": "3/3", "state": "good" },
    { "id": "stock_accuracy", "label": "Stock Accuracy %", "value": 0.964, "formatted": "96.4%", "state": "caution" },
    { "id": "reorder_alerts", "label": "Reorder Alerts", "value": 72, "state": "bad" },
    { "id": "days_of_supply", "label": "Days of Supply", "value": 18, "state": "caution" },
    { "id": "inventory_value", "label": "Inventory Value (Book/Market)", "value": { "book": 186000, "market": 192400 }, "state": "good" },
    { "id": "fulfillment_eff", "label": "Fulfillment Efficiency", "value": "2.1 hrs", "state": "good" }
  ],
  "locations": [
    { "id": "WH-A", "name": "Warehouse A", "online": true, "lat": 27.96, "lng": -82.80 },
    { "id": "Store-B", "name": "Retail B", "online": true, "lat": 27.95, "lng": -82.46 },
    { "id": "Truck-1", "name": "Truck 1", "online": true, "lat": 27.97, "lng": -82.62 }
  ],
  "overview_grid": [
    { "sku": "BEAN-12OZ", "name": "Coffee Beans 12oz", "location": "WH-A", "on_hand": 420, "allocated": 90, "in_transit": 60, "available": 330, "committed": 120, "status": "low" },
    { "sku": "CUP-16", "name": "Cup 16oz", "location": "Store-B", "on_hand": 140, "allocated": 40, "in_transit": 0, "available": 100, "committed": 60, "status": "out" }
  ],
  "advisor": {
    "summary": "WH-A overstocked on filters (+280); Store-B short on cups (−130). Suggest transfer 150 filters to Store-B.",
    "suggested_transfers": [
      { "sku": "FILTER-COLD", "from": "WH-A", "to": "Store-B", "qty": 150, "eta_days": 2 }
    ]
  },
  "reorder_alerts": [
    { "sku": "BEAN-12OZ", "location": "Store-B", "days_of_supply": 5, "reorder_point": 180, "recommended_qty": 200, "vendor": "Vendor A" }
  ],
  "pos_demand_link": {
    "events": [{ "date": "2025-10-25", "label": "Food Festival", "impact_pct": 15 }],
    "forecast_note": "Holiday uplift expected late Nov; raise safety stock by 20%."
  },
  "transfers": {
    "in_transit": [{ "id": "XFER-22", "sku": "FILTER-COLD", "from": "WH-A", "to": "Store-B", "qty": 150, "eta": "2025-10-24" }],
    "suggested": [{ "sku": "CUP-16", "from": "WH-A", "to": "Store-B", "qty": 200 }]
  },
  "purchase_orders": [
    { "po_id": "PO-4432", "vendor": "Vendor A", "status": "draft", "items": [{ "sku": "BEAN-12OZ", "qty": 200, "price": 6.2 }], "eta": "2025-10-29" }
  ],
  "valuation": {
    "method": "fifo",
    "book_value": 186000,
    "market_value": 192400,
    "cost_layers": [{ "sku": "BEAN-12OZ", "batches": [{ "qty": 200, "unit_cost": 5.8 }, { "qty": 220, "unit_cost": 6.1 }] }]
  },
  "vendors": [
    { "id": "VEND-A", "name": "Vendor A", "on_time_pct": 0.98, "lead_time_days": 4, "moq": 50, "price_index": 1.0 }
  ],
  "analytics": {
    "turnover_ratio": 4.6,
    "fill_rate_pct": 0.95,
    "stock_accuracy_pct": 0.964,
    "aging": [{ "bucket": "90d+", "count": 38 }]
  },
  "export": { "csv_available": true, "pdf_available": true }
};

type InventoryData = typeof INVENTORY_STUB;

export default function InventoryClient() {
  const [data, setData] = useState<InventoryData>(INVENTORY_STUB);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [valuationMethod, setValuationMethod] = useState<"fifo" | "lifo" | "wavg">("fifo");
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([]);

  // Fetch inventory data on component mount
  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true);
      try {
        const apiRoot = process.env.NEXT_PUBLIC_API_URL || "https://lightsignal-backend.onrender.com";
        const url = `${apiRoot.replace(/\/$/, "")}/api/ai/inventory/full`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: "demo",
            range: "30d",
            locations: ["WH-A", "Store-B"],
            include_demand: true,
            include_vendors: true
          }),
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`API call failed (${response.status})`);
        }

        const apiData = await response.json();
        setData(apiData);
      } catch (error) {
        console.warn("Failed to fetch inventory data, using stub:", error);
        // Fallback to callIntent if available
        try {
          const fallbackData = await callIntent("inventory", "demo");
          setData(fallbackData || INVENTORY_STUB);
        } catch (fallbackError) {
          console.warn("Fallback also failed, using stub data");
          setData(INVENTORY_STUB);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  // Filter overview grid data
  const filteredOverviewGrid = data.overview_grid?.filter(item => {
    const matchesLocation = locationFilter === "all" || item.location === locationFilter;
    const matchesSearch = searchTerm === "" || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLocation && matchesSearch;
  }) || [];

  // Get status color for chips
  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "bg-green-100 text-green-800";
      case "low": return "bg-yellow-100 text-yellow-800";  
      case "out": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get KPI state colors
  const getKpiStateColor = (state: string) => {
    switch (state) {
      case "good": return "text-green-600";
      case "caution": return "text-yellow-600";
      case "bad": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  // Format KPI values
  const formatKpiValue = (kpi: any) => {
    if (kpi.formatted) return kpi.formatted;
    if (typeof kpi.value === "object" && kpi.value.book !== undefined) {
      return `$${(kpi.value.book / 1000).toFixed(0)}K`;
    }
    if (typeof kpi.value === "number" && kpi.value > 1000) {
      return kpi.value.toLocaleString();
    }
    return kpi.value.toString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          <h1 className="text-2xl font-semibold">Inventory & Multi-Location</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">📦</span>
        <h1 className="text-2xl font-semibold">Inventory & Multi-Location</h1>
      </div>

      {/* KPIs Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.kpis?.map((kpi) => {
            const icon = kpi.id === "total_skus" ? "📦" :
                        kpi.id === "locations_online" ? "🏬" :
                        kpi.id === "stock_accuracy" ? "⚖️" :
                        kpi.id === "reorder_alerts" ? "🔁" :
                        kpi.id === "days_of_supply" ? "⏱️" :
                        kpi.id === "inventory_value" ? "💰" :
                        kpi.id === "fulfillment_eff" ? "🧭" : "📊";
            
            return (
              <KpiCard
                key={kpi.id}
                title={`${icon} ${kpi.label}`}
                value={formatKpiValue(kpi)}
                subtitle={kpi.note}
              >
                {kpi.state && (
                  <div className={`text-xs font-medium ${getKpiStateColor(kpi.state)}`}>
                    {kpi.state === "good" ? "✓ Healthy" :
                     kpi.state === "caution" ? "⚠ Watch" :
                     kpi.state === "bad" ? "⚠ Action needed" : ""}
                  </div>
                )}
              </KpiCard>
            );
          })}
        </div>
      </section>

      {/* Integrations & Data Sources */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">🔗 Integrations & Data Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">ERP Systems</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm">SAP Connected</span>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Warehouse/3PL</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm">WMS Synced</span>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">POS/Franchise</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-sm">Partial Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Summary Banner */}
      {data.advisor?.summary && (
        <div className="rounded-2xl border-l-4 border-l-blue-500 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="font-medium text-blue-900">AI Inventory Advisor</h3>
              <p className="text-blue-800 mt-1">{data.advisor.summary}</p>
              {data.advisor.suggested_transfers?.length > 0 && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Create Suggested Transfer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Overview Dashboard */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">📊 Inventory Overview Dashboard</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="all">All Locations</option>
              {data.locations?.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">SKU</th>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Location</th>
                <th className="text-right py-2">On Hand</th>
                <th className="text-right py-2">Allocated</th>
                <th className="text-right py-2">In Transit</th>
                <th className="text-right py-2">Available</th>
                <th className="text-right py-2">Committed</th>
                <th className="text-center py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOverviewGrid.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <button
                      onClick={() => setSelectedSku(item.sku)}
                      className="text-blue-600 hover:underline font-mono"
                    >
                      {item.sku}
                    </button>
                  </td>
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.location}</td>
                  <td className="py-2 text-right">{item.on_hand}</td>
                  <td className="py-2 text-right">{item.allocated}</td>
                  <td className="py-2 text-right">{item.in_transit}</td>
                  <td className="py-2 text-right">{item.available}</td>
                  <td className="py-2 text-right">{item.committed}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                      {item.status === "good" ? "🟢" : item.status === "low" ? "🟡" : "🔴"} {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Auto Replenishment & Alerts */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">🔁 Auto Replenishment & Alerts</h2>
        {data.reorder_alerts?.map((alert, index) => (
          <div key={index} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{alert.sku} at {alert.location}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {alert.days_of_supply} days of supply remaining • ROP: {alert.reorder_point}
                </div>
                <div className="text-sm text-blue-600">
                  Recommended qty: {alert.recommended_qty} from {alert.vendor}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPoModal(true)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Create PO
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Create Transfer
                </button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Multi-Location & Transfers */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">🚚 Multi-Location & Transfers</h2>
        
        {/* In Transit */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">In Transit</h3>
          {data.transfers?.in_transit?.map((transfer, index) => (
            <div key={index} className="border rounded-lg p-3 mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{transfer.sku}</span>
                  <span className="text-gray-600 ml-2">{transfer.from} → {transfer.to}</span>
                  <span className="text-sm text-gray-500 ml-2">Qty: {transfer.qty}</span>
                </div>
                <div className="text-sm">
                  ETA: {new Date(transfer.eta).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Transfers */}
        <div>
          <h3 className="font-medium mb-2">Suggested Transfers</h3>
          {data.transfers?.suggested?.map((suggestion, index) => (
            <div key={index} className="border rounded-lg p-3 mb-2 bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{suggestion.sku}</span>
                  <span className="text-gray-600 ml-2">{suggestion.from} → {suggestion.to}</span>
                  <span className="text-sm text-gray-500 ml-2">Qty: {suggestion.qty}</span>
                </div>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Create Transfer
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Valuation Section */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">💰 Inventory Detail & Valuation</h2>
          <select
            value={valuationMethod}
            onChange={(e) => setValuationMethod(e.target.value as "fifo" | "lifo" | "wavg")}
            className="px-3 py-1 border rounded-lg text-sm"
          >
            <option value="fifo">FIFO</option>
            <option value="lifo">LIFO</option>
            <option value="wavg">Weighted Average</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Book Value</h3>
            <div className="text-2xl font-semibold text-green-600">
              ${data.valuation?.book_value?.toLocaleString()}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Market Value</h3>
            <div className="text-2xl font-semibold text-blue-600">
              ${data.valuation?.market_value?.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {/* Vendor & Procurement Sync */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">🏭 Vendor & Procurement Sync</h2>
        <div className="space-y-3">
          {data.vendors?.map((vendor, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{vendor.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Lead time: {vendor.lead_time_days} days • MOQ: {vendor.moq}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${vendor.on_time_pct >= 0.95 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {(vendor.on_time_pct * 100).toFixed(1)}% on-time
                  </div>
                  <div className="text-xs text-gray-500">
                    Price index: {vendor.price_index.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics & Reports */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">📈 Analytics & Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {data.analytics?.turnover_ratio?.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Turnover Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {((data.analytics?.fill_rate_pct || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Fill Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-purple-600">
              {((data.analytics?.stock_accuracy_pct || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Stock Accuracy</div>
          </div>
        </div>
      </section>

      {/* Inventory Advisor Chatbot */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          🤖💬
        </button>
        
        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-80 h-96 bg-white border rounded-lg shadow-xl">
            <div className="p-3 border-b bg-blue-50 rounded-t-lg">
              <h3 className="font-medium">Inventory Advisor</h3>
            </div>
            <div className="flex-1 p-3 h-64 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  Ask me anything about your inventory:
                  <ul className="mt-2 text-xs space-y-1">
                    <li>• "What's running low?"</li>
                    <li>• "Do we have enough for the festival?"</li>
                    <li>• "Show me fast movers by location"</li>
                  </ul>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-100 text-blue-900' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t">
              <input
                type="text"
                placeholder="Ask about inventory..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      setChatMessages(prev => [
                        ...prev,
                        { role: 'user', content: input.value },
                        { role: 'assistant', content: 'I can help you with inventory questions. This is a demo response.' }
                      ]);
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals would go here */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Transfer</h3>
            <div className="space-y-4">
              <input type="text" placeholder="SKU" className="w-full p-2 border rounded" />
              <select className="w-full p-2 border rounded">
                <option>From Location</option>
                {data.locations?.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <select className="w-full p-2 border rounded">
                <option>To Location</option>
                {data.locations?.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <input type="number" placeholder="Quantity" className="w-full p-2 border rounded" />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {showPoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Purchase Order</h3>
            <div className="space-y-4">
              <input type="text" placeholder="SKU" className="w-full p-2 border rounded" />
              <select className="w-full p-2 border rounded">
                <option>Select Vendor</option>
                {data.vendors?.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
              <input type="number" placeholder="Quantity" className="w-full p-2 border rounded" />
              <input type="number" placeholder="Unit Price" className="w-full p-2 border rounded" />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPoModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPoModal(false)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}