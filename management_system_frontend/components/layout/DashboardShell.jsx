"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChangePasswordModal } from "./ChangePasswordModal";

export function DashboardShell({ children, user, onSignOut }) {
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={user}
        onSignOut={onSignOut}
        onChangePassword={() => setPasswordOpen(true)}
      />
      <main className="min-h-0 flex-1 overflow-y-auto p-8">{children}</main>
      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </div>
  );
}
