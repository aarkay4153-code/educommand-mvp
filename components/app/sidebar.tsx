"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { navItems } from "@/components/app/nav-items";
import type { InstitutionType, ModuleKey } from "@/lib/modules";
import type { AppRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function Sidebar({
  enabledModules = [],
  institutionType = "school",
  role,
}: {
  enabledModules?: ModuleKey[];
  institutionType?: InstitutionType;
  role: AppRole | null;
}) {
  const pathname = usePathname();
  const visibleItems = role
    ? navItems.filter(
        (item) =>
          item.roles.includes(role) &&
          (!item.moduleKey || enabledModules.includes(item.moduleKey)) &&
          (!item.institutionTypes || item.institutionTypes.includes(institutionType)),
      )
    : [];

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-card lg:block">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">EduCommand</p>
          <p className="text-xs text-muted-foreground">School operations</p>
        </div>
      </div>
      <nav className="space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                active && "bg-accent text-accent-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
