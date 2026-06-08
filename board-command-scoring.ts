import {
  BookOpenCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  FileText,
  ListChecks,
  PencilLine,
  UserCheck,
  Trophy,
  Settings,
  BriefcaseBusiness,
  Landmark,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import type { AppRole } from "@/lib/permissions";
import type { InstitutionType, ModuleKey } from "@/lib/modules";

export const navItems: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  institutionTypes?: InstitutionType[];
  moduleKey?: ModuleKey;
  roles: AppRole[];
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, moduleKey: "dashboard", roles: ["principal", "coordinator", "teacher", "management"] },
  { href: "/staff-status", label: "Staff Status", icon: ClipboardCheck, moduleKey: "staff_status", roles: ["principal", "coordinator", "teacher"] },
  { href: "/student-attendance", label: "Student Attendance", icon: UserCheck, moduleKey: "student_attendance", roles: ["principal", "coordinator", "teacher"] },
  { href: "/timetable", label: "Timetable", icon: CalendarDays, moduleKey: "timetable", roles: ["principal", "coordinator", "teacher"] },
  { href: "/weekly-workflow", label: "Weekly Workflow", icon: ListChecks, moduleKey: "alerts", roles: ["principal", "coordinator"] },
  { href: "/syllabus", label: "Syllabus", icon: BookOpenCheck, moduleKey: "syllabus", roles: ["principal", "coordinator", "teacher"] },
  { href: "/tasks", label: "Tasks", icon: ClipboardList, moduleKey: "tasks", roles: ["principal", "coordinator", "teacher"] },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, moduleKey: "calendar", roles: ["principal", "coordinator", "teacher"] },
  { href: "/board-command", label: "Board Command", icon: Trophy, institutionTypes: ["school"], moduleKey: "board_command", roles: ["principal", "coordinator"] },
  { href: "/board-command/teacher-inputs", label: "Board Inputs", icon: PencilLine, institutionTypes: ["school"], moduleKey: "board_command", roles: ["principal", "coordinator", "teacher"] },
  { href: "/college-command", label: "College Command", icon: Landmark, institutionTypes: ["college"], moduleKey: "college_command", roles: ["principal", "coordinator", "management"] },
  { href: "/college-command/courses", label: "Courses", icon: Layers3, institutionTypes: ["college"], moduleKey: "college_courses", roles: ["principal", "coordinator", "management"] },
  { href: "/college-final-exams", label: "Final Exams", icon: ClipboardCheck, institutionTypes: ["college"], moduleKey: "college_final_exams", roles: ["principal", "coordinator", "management"] },
  { href: "/college-fees", label: "Fees Pending", icon: FileText, institutionTypes: ["college"], moduleKey: "college_fees", roles: ["principal", "coordinator", "management"] },
  { href: "/placements", label: "Placements", icon: BriefcaseBusiness, institutionTypes: ["college"], moduleKey: "placements", roles: ["principal", "coordinator", "management"] },
  { href: "/accreditation", label: "Accreditation", icon: ShieldCheck, institutionTypes: ["college"], moduleKey: "accreditation", roles: ["principal", "coordinator", "management"] },
  { href: "/institution-brief", label: "Institution Brief", icon: Building2, moduleKey: "institution_brief", roles: ["principal", "coordinator", "management"] },
  { href: "/reports", label: "Reports", icon: FileText, moduleKey: "reports", roles: ["principal", "coordinator", "management"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["principal"] },
];
