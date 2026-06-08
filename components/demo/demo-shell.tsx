"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, FileText, GraduationCap, Home, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const demoNavItems = [
  { href: "/demo/school-dashboard", label: "School Mode", icon: School },
  { href: "/demo/college-dashboard", label: "College Mode", icon: GraduationCap },
  { href: "/demo/board-command", label: "Board Command", icon: ClipboardCheck },
  { href: "/demo/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/demo/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/demo/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/demo/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/demo/institution-brief", label: "Institution Brief", icon: FileText },
];

export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 shrink-0 border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold">EduCommand</p>
            <p className="text-xs text-muted-foreground">Demo workspace</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {demoNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  active && "bg-accent text-accent-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold">Demo Public School</p>
              <p className="text-xs text-muted-foreground">Principal sales demo</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Badge tone="warning">Demo Mode - sample data only</Badge>
              <Link
                className="hidden h-10 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium text-foreground transition hover:opacity-90 sm:inline-flex"
                href="/"
              >
                <Home className="h-4 w-4" />
                Landing
              </Link>
            </div>
          </div>
          <div className="border-t bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200 sm:px-6">
            Demo Mode - sample data only. No Supabase connection is used here.
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <nav
          className="grid gap-1 border-t bg-card px-2 py-2 lg:hidden"
          style={{ gridTemplateColumns: `repeat(${demoNavItems.length}, minmax(0, 1fr))` }}
        >
          {demoNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                aria-label={item.label}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-md text-muted-foreground",
                  active && "bg-accent text-accent-foreground",
                )}
                href={item.href}
                key={item.href}
                title={item.label}
              >
                <Icon className="size-5" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
