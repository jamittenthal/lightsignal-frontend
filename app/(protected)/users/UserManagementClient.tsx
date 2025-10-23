"use client";

import { useState, useEffect } from "react";
import KpiCard from "@/components/KpiCard";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

// Types
interface UserManagementKPI {
  id: string;
  label: string;
  value: number | string;
  formatted?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  last_login: string;
  status: "active" | "pending" | "disabled";
  mfa_enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

interface Invite {
  id: string;
  email: string;
  role: string;
  department: string;
  sent_at: string;
  status: "sent" | "awaiting_approval";
}

interface AccessControls {
  mfa_enforced: boolean;
  email_verification_required: boolean;
  login_alerts_enabled: boolean;
  ip_allowlist: string[];
}

interface SSOConfig {
  google: { enabled: boolean; connected: boolean };
  microsoft: { enabled: boolean; connected: boolean };
  okta: { enabled: boolean; connected: boolean };
}

interface AuditLogEntry {
  id: string;
  date: string;
  user: string;
  action: string;
  target: string;
  status: string;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  text: string;
  created_at: string;
}

interface UserManagementData {
  kpis: UserManagementKPI[];
  users: User[];
  roles: Role[];
  invites: Invite[];
  access_controls: AccessControls;
  sso: SSOConfig;
  audit_log: AuditLogEntry[];
  alerts: Alert[];
  export: { pdf_available: boolean; csv_available: boolean };
  _meta?: {
    confidence?: number;
    provenance?: string;
  };
}

// Stub data fallback
const STUB_DATA: UserManagementData = {
  kpis: [
    { id: "active_users", label: "Active Team Members", value: 12 },
    { id: "roles_configured", label: "Access Roles Configured", value: 6 },
    { id: "last_login", label: "Last Login Activity", value: "2025-10-22T13:10:00Z" },
    { id: "pending_invites", label: "Pending Invites", value: 2 },
    { id: "mfa_usage", label: "Two-Factor Usage", value: 0.58, formatted: "58%" },
    { id: "access_alerts", label: "Access Alerts", value: 1 }
  ],
  users: [
    { id: "u_sarah", name: "Sarah Patel", email: "sarah@lightsignal.ai", role: "Admin", department: "Finance", last_login: "2025-10-09T09:24:00Z", status: "active", mfa_enabled: true },
    { id: "u_kevin", name: "Kevin Li", email: "kevin@lightsignal.ai", role: "Analyst", department: "Operations", last_login: "2025-10-07T14:02:00Z", status: "pending", mfa_enabled: false },
    { id: "u_maria", name: "Maria Gomez", email: "maria@lightsignal.ai", role: "Manager", department: "Sales", last_login: "2025-10-10T16:55:00Z", status: "active", mfa_enabled: true }
  ],
  roles: [
    { id: "r_admin", name: "Admin", color: "red", permissions: ["*"] },
    { id: "r_manager", name: "Manager", color: "orange", permissions: ["dashboards:rw", "billing:r", "users:r"] },
    { id: "r_analyst", name: "Analyst", color: "purple", permissions: ["finance:r", "operations:r"] },
    { id: "r_staff", name: "Staff", color: "green", permissions: ["inventory:r", "operations:r"] },
    { id: "r_viewer", name: "Viewer", color: "blue", permissions: ["*:r"] },
    { id: "r_advisor", name: "External Advisor", color: "brown", permissions: ["finance:r", "tax:r"] }
  ],
  invites: [
    { id: "inv_001", email: "newhire@lightsignal.ai", role: "Staff", department: "Ops", sent_at: "2025-10-18T18:11:00Z", status: "sent" },
    { id: "inv_002", email: "advisor@firm.com", role: "External Advisor", department: "Advisory", sent_at: "2025-10-20T12:40:00Z", status: "awaiting_approval" }
  ],
  access_controls: {
    mfa_enforced: true,
    email_verification_required: true,
    login_alerts_enabled: true,
    ip_allowlist: ["192.168.1.0/24", "10.0.0.0/16"]
  },
  sso: {
    google: { enabled: true, connected: true },
    microsoft: { enabled: false, connected: false },
    okta: { enabled: false, connected: false }
  },
  audit_log: [
    { id: "a1", date: "2025-10-09T10:01:00Z", user: "Sarah Patel", action: "Edited Business Profile", target: "Company Info", status: "success" },
    { id: "a2", date: "2025-10-08T13:33:00Z", user: "Kevin Li", action: "Viewed Scenario Planning Lab", target: "—", status: "success" },
    { id: "a3", date: "2025-10-07T09:10:00Z", user: "Maria Gomez", action: "Changed Tax Settings", target: "Preferences", status: "success" }
  ],
  alerts: [
    { id: "al_failed_login", type: "security", severity: "warning", text: "3 failed login attempts for kevin@...", created_at: "2025-10-21T22:13:00Z" }
  ],
  export: { pdf_available: true, csv_available: true }
};

// Role color mapping
const ROLE_COLORS = {
  red: "bg-red-100 text-red-800 border-red-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  green: "bg-green-100 text-green-800 border-green-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  brown: "bg-amber-100 text-amber-800 border-amber-200"
};

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  disabled: "bg-red-100 text-red-800"
};

export default function UserManagementClient() {
  const [data, setData] = useState<UserManagementData>(STUB_DATA);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("directory");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    fetchUserManagementData();
  }, []);

  const fetchUserManagementData = async () => {
    try {
      setLoading(true);
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || "https://lightsignal-backend.onrender.com";
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/users/full`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: "demo",
          include_roles: true,
          include_audit: true,
          include_security: true
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.warn("Failed to fetch user management data, using fallback:", error);
      // Keep stub data as fallback
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "—";
    }
  };

  // Filter users based on search and filters
  const filteredUsers = data.users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    const matchesDepartment = !departmentFilter || user.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const getRoleColor = (roleName: string) => {
    const role = data.roles.find(r => r.name === roleName);
    return role ? ROLE_COLORS[role.color as keyof typeof ROLE_COLORS] || "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800";
  };

  const handleUserAction = async (userId: string, action: string) => {
    // Optimistic UI update for better UX
    if (action === "disable" || action === "enable") {
      setData(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId 
            ? { ...user, status: action === "disable" ? "disabled" : "active" as any }
            : user
        )
      }));
    }
    // TODO: Implement actual API calls for user actions
    console.log(`Action ${action} for user ${userId}`);
  };

  const handleInviteAction = async (inviteId: string, action: "resend" | "cancel") => {
    // Optimistic UI update
    if (action === "cancel") {
      setData(prev => ({
        ...prev,
        invites: prev.invites.filter(invite => invite.id !== inviteId)
      }));
    }
    // TODO: Implement actual API calls for invite actions
    console.log(`${action} invite ${inviteId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Shimmer loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.kpis.map((kpi, index) => {
          const icons = ["👥", "🔑", "🕒", "📜", "🔐", "⚠️"];
          return (
            <KpiCard
              key={kpi.id}
              title={`${icons[index]} ${kpi.label}`}
              value={kpi.formatted || kpi.value}
            />
          );
        })}
      </div>

      {/* Provenance Badge */}
      {data._meta && (
        <div className="flex justify-end">
          <ProvenanceBadge
            confidence={data._meta.confidence || 0}
            source={data._meta.provenance || "Unknown"}
          />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "directory", label: "👥 Team Directory", badge: data.users.length },
            { id: "roles", label: "🔑 Roles & Permissions", badge: data.roles.length },
            { id: "access", label: "🔐 Access Controls" },
            { id: "invitations", label: "✉️ Invitations & Approvals", badge: data.invites.length },
            { id: "audit", label: "🧾 Audit Log", badge: data.audit_log.length },
            { id: "reports", label: "📋 Access Summary Report" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {data.roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            {user.mfa_enabled && <span className="text-xs text-green-600">🔐 2FA</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.last_login)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">Edit</button>
                          <button 
                            onClick={() => handleUserAction(user.id, user.status === "active" ? "disable" : "enable")}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            {user.status === "active" ? "Disable" : "Enable"}
                          </button>
                          <button className="text-red-600 hover:text-red-800">Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions</h3>
            <div className="space-y-4">
              {data.roles.map(role => (
                <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getRoleColor(role.name)}`}>
                      {role.name}
                    </span>
                    {role.name === "Admin" && <span className="text-xs text-gray-500">(default)</span>}
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                    {role.name !== "Admin" && (
                      <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Feature Permissions</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Financial Overview",
                  "Scenario Planning Lab", 
                  "Opportunities",
                  "Tax Optimization",
                  "Fraud & Compliance",
                  "Business Profile Editor"
                ].map(feature => (
                  <label key={feature} className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Create Role
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                Save Changes
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50">
                Revert
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "access" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Enforce Two-Factor Authentication</span>
                <input 
                  type="checkbox" 
                  defaultChecked={data.access_controls.mfa_enforced}
                  className="rounded"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Require Email Verification</span>
                <input 
                  type="checkbox" 
                  defaultChecked={data.access_controls.email_verification_required}
                  className="rounded"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Login Alerts for Admins</span>
                <input 
                  type="checkbox" 
                  defaultChecked={data.access_controls.login_alerts_enabled}
                  className="rounded"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">IP Allowlist</h3>
            <div className="space-y-3">
              {data.access_controls.ip_allowlist.map((ip, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-mono">{ip}</span>
                  <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                </div>
              ))}
              <button className="text-blue-600 hover:text-blue-800 text-sm">+ Add IP Range</button>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SSO Connectors</h3>
            <div className="space-y-4">
              {Object.entries(data.sso).map(([provider, config]) => (
                <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium capitalize">{provider}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      config.connected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {config.connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  <button className={`px-3 py-1 rounded text-sm ${
                    config.connected 
                      ? "text-red-600 hover:text-red-800" 
                      : "text-blue-600 hover:text-blue-800"
                  }`}>
                    {config.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "invitations" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Invitation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Role</option>
                {data.roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Department"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Send Invite
            </button>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Pending Invitations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.invites.map(invite => (
                    <tr key={invite.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invite.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getRoleColor(invite.role)}`}>
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invite.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invite.sent_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          invite.status === "sent" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {invite.status === "sent" ? "Sent" : "Awaiting Approval"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleInviteAction(invite.id, "resend")}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Resend
                          </button>
                          <button 
                            onClick={() => handleInviteAction(invite.id, "cancel")}
                            className="text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Audit Log</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm">Export CSV</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.audit_log.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(entry.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.target}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        entry.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Access Summary Report</h3>
          <p className="text-gray-600 mb-6">
            Export comprehensive reports of current user access and activity.
          </p>
          <div className="flex space-x-4">
            <button 
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={!data.export.pdf_available}
            >
              📄 Current Users & Roles (PDF)
            </button>
            <button 
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={!data.export.csv_available}
            >
              📊 Audit Log (CSV)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}