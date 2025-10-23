// app/users/page.tsx
import { Suspense } from "react";
import UserManagementClient from "./UserManagementClient";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-600 mt-1">
          Manage team members, roles, permissions, and access controls
        </p>
      </div>
      
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <UserManagementClient />
      </Suspense>
    </div>
  );
}