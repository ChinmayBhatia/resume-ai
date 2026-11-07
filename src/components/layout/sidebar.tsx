"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, ScanSearch, Mic, History } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/ats", label: "ATS Analysis", icon: ScanSearch },
  { href: "/interviews/new", label: "Mock Interview", icon: Mic },
  { href: "/interviews", label: "History", icon: History },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  // "/interviews" should not stay active while on "/interviews/new"
  const isActive = (href: string) =>
    href === "/interviews"
      ? pathname === "/interviews" ||
        (pathname.startsWith("/interviews/") && !pathname.startsWith("/interviews/new"))
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6">
        <span className="font-serif text-2xl tracking-wide">Resume AI</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive(href)
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-6 py-4 text-xs text-sidebar-foreground/50">
        AI estimates, not real ATS scores.
      </div>
    </div>
  );
}