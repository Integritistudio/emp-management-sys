"use client";

import { Sidebar } from "./Sidebar";

export function DashboardShell({ children, admin, onSignOut }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar adminEmail={admin?.email} onSignOut={onSignOut} />
      <main className="min-h-0 flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
