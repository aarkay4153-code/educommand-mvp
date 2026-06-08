export type AppRole = "principal" | "coordinator" | "teacher" | "management";

export const roleRoutes: Record<AppRole, string[]> = {
  principal: [
    "/dashboard",
    "/staff-status",
    "/student-attendance",
    "/timetable",
    "/weekly-workflow",
    "/syllabus",
    "/tasks",
    "/calendar",
    "/board-command",
    "/college-command",
    "/college-final-exams",
    "/college-fees",
    "/placements",
    "/accreditation",
    "/institution-brief",
    "/reports",
    "/settings",
  ],
  coordinator: ["/dashboard", "/staff-status", "/student-attendance", "/timetable", "/weekly-workflow", "/syllabus", "/tasks", "/calendar", "/board-command", "/college-command", "/college-final-exams", "/college-fees", "/placements", "/accreditation", "/institution-brief", "/reports"],
  teacher: ["/dashboard", "/staff-status", "/student-attendance", "/timetable", "/syllabus", "/tasks", "/calendar", "/board-command/teacher-inputs"],
  management: ["/dashboard", "/college-command", "/college-final-exams", "/college-fees", "/placements", "/accreditation", "/institution-brief", "/reports"],
};

export function canAccessPath(role: string | null | undefined, pathname: string) {
  if (!isAppRole(role)) return false;
  return roleRoutes[role].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isAppRole(role: string | null | undefined): role is AppRole {
  return role === "principal" || role === "coordinator" || role === "teacher" || role === "management";
}

export function isLeaderRole(role: string | null | undefined) {
  return role === "principal" || role === "coordinator";
}
