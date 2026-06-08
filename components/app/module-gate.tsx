"use client";

import { usePathname } from "next/navigation";
import { AccessDenied } from "@/components/app/access-denied";
import { moduleForPath, type InstitutionType, type ModuleKey } from "@/lib/modules";
import { canAccessPath, type AppRole } from "@/lib/permissions";

export function ModuleGate({
  children,
  enabledModules,
  institutionType,
  role,
}: {
  children: React.ReactNode;
  enabledModules: ModuleKey[];
  institutionType: InstitutionType;
  role: AppRole | null;
}) {
  const pathname = usePathname();
  const moduleKey = moduleForPath(pathname);

  if (role && !canAccessPath(role, pathname)) {
    return <AccessDenied />;
  }

  if (moduleKey === "board_command" && institutionType !== "school") {
    return (
      <AccessDenied
        title="Module not available"
        message="This module is available only for School Mode."
      />
    );
  }

  if (["college_command", "college_courses", "college_final_exams", "college_fees", "placements", "accreditation"].includes(moduleKey ?? "") && institutionType !== "college") {
    return (
      <AccessDenied
        title="Module not available"
        message="This module is available only for College Mode."
      />
    );
  }

  if (moduleKey && !enabledModules.includes(moduleKey)) {
    return (
      <AccessDenied
        title="Module not enabled"
        message="This module is not enabled for your institution."
      />
    );
  }

  return children;
}
