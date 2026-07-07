"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ListTodo,
  BarChart3,
  LogOut,
} from "lucide-react";
import { navigationData } from "@/data/navigation";

const iconMap = {
  LayoutDashboard,
  FolderKanban,
  Users,
  ListTodo,
  BarChart3,
  LogOut,
};

export function Sidebar({ adminEmail, onSignOut }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-neutral">
      <div className="flex flex-col items-center border-b border-sidebar-border px-4 py-6 text-center">
        <img
          src={navigationData.brand.logo}
          alt={navigationData.brand.name}
          className="mx-auto mb-3 h-10 w-auto object-contain"
        />
        <p className="text-caption leading-snug text-neutral">
          {navigationData.brand.subtitle}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-2.5 py-4">
        {navigationData.links.map((link) => {
          const Icon = iconMap[link.icon];
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-caption text-neutral transition-colors ${
                isActive
                  ? "bg-sidebar-active font-semibold"
                  : "hover:bg-sidebar-active/60"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2.5">
        {adminEmail ? (
          <p className="mb-3 px-2 text-caption leading-relaxed text-neutral">
            {navigationData.signedIn.label}{" "}
            <span className="font-semibold">{adminEmail}</span>
          </p>
        ) : null}
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-caption text-neutral transition-colors hover:bg-red-500/10 active:scale-95"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {navigationData.signOut.label}
        </button>
      </div>
    </aside>
  );
}
