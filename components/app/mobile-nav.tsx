"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/app/nav-items";
import type { InstitutionType, ModuleKey } from "@/lib/modules";
import type { AppRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function MobileNav({
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
    <nav
      className="grid gap-1 border-t bg-card px-2 py-2 lg:hidden"
      style={{ gridTemplateColumns: `repeat(${Math.max(visibleItems.length, 1)}, minmax(0, 1fr))` }}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              "flex min-h-11 items-center justify-center rounded-md text-muted-foreground",
              active && "bg-accent text-accent-foreground",
            )}
            title={item.label}
          >
            <Icon className="size-5" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
