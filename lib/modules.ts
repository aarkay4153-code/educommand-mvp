export type InstitutionType = "school" | "college" | "coaching_centre" | "training_institute";

export type ModuleKey =
  | "dashboard"
  | "staff_status"
  | "student_attendance"
  | "timetable"
  | "syllabus"
  | "tasks"
  | "calendar"
  | "board_command"
  | "college_command"
  | "college_courses"
  | "college_final_exams"
  | "college_fees"
  | "complaints"
  | "compliance_vault"
  | "maintenance"
  | "institution_brief"
  | "reports"
  | "alerts"
  | "placements"
  | "internships"
  | "accreditation"
  | "academic_performance"
  | "batch_progress"
  | "certification_tracker"
  | "placement_support";

export type SchoolModule = {
  module_key: ModuleKey;
  is_enabled: boolean;
};

export const institutionTypeLabels: Record<InstitutionType, string> = {
  school: "School",
  college: "College",
  coaching_centre: "Coaching Centre",
  training_institute: "Training Institute",
};

export const moduleLabels: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  staff_status: "Staff Status",
  student_attendance: "Student Attendance",
  timetable: "Timetable",
  syllabus: "Syllabus",
  tasks: "Tasks",
  calendar: "Calendar",
  board_command: "Board Command",
  college_command: "College Command",
  college_courses: "College Courses",
  college_final_exams: "Final Exams",
  college_fees: "Fees Pending",
  complaints: "Complaints",
  compliance_vault: "Compliance Vault",
  maintenance: "Maintenance",
  institution_brief: "Institution Brief",
  reports: "Reports",
  alerts: "Alerts",
  placements: "Placements",
  internships: "Internships",
  accreditation: "Accreditation",
  academic_performance: "Academic Performance",
  batch_progress: "Batch Progress",
  certification_tracker: "Certification Tracker",
  placement_support: "Placement Support",
};

export const defaultModulesByInstitutionType: Record<InstitutionType, ModuleKey[]> = {
  school: [
    "dashboard",
    "staff_status",
    "student_attendance",
    "timetable",
    "syllabus",
    "tasks",
    "calendar",
    "board_command",
    "complaints",
    "compliance_vault",
    "maintenance",
    "institution_brief",
    "reports",
    "alerts",
  ],
  college: [
    "dashboard",
    "staff_status",
    "student_attendance",
    "timetable",
    "syllabus",
    "tasks",
    "calendar",
    "college_command",
    "college_courses",
    "complaints",
    "compliance_vault",
    "maintenance",
    "college_final_exams",
    "college_fees",
    "placements",
    "internships",
    "accreditation",
    "institution_brief",
    "reports",
    "alerts",
  ],
  coaching_centre: [
    "dashboard",
    "staff_status",
    "student_attendance",
    "syllabus",
    "tasks",
    "calendar",
    "academic_performance",
    "reports",
    "alerts",
  ],
  training_institute: [
    "dashboard",
    "staff_status",
    "student_attendance",
    "batch_progress",
    "tasks",
    "calendar",
    "certification_tracker",
    "placement_support",
    "reports",
    "alerts",
  ],
};

export const configurableModuleKeys = Object.keys(moduleLabels) as ModuleKey[];

export const routeModuleMap: Record<string, ModuleKey> = {
  "/dashboard": "dashboard",
  "/staff-status": "staff_status",
  "/student-attendance": "student_attendance",
  "/timetable": "timetable",
  "/weekly-workflow": "alerts",
  "/syllabus": "syllabus",
  "/tasks": "tasks",
  "/calendar": "calendar",
  "/board-command": "board_command",
  "/college-command/courses": "college_courses",
  "/college-command": "college_command",
  "/college-final-exams": "college_final_exams",
  "/college-fees": "college_fees",
  "/placements": "placements",
  "/accreditation": "accreditation",
  "/institution-brief": "institution_brief",
  "/reports": "reports",
};

export function isInstitutionType(value: string | null | undefined): value is InstitutionType {
  return value === "school" || value === "college" || value === "coaching_centre" || value === "training_institute";
}

export function moduleRowsToEnabledSet(rows: SchoolModule[], institutionType: InstitutionType) {
  if (rows.length === 0) {
    return new Set(defaultModulesByInstitutionType[institutionType]);
  }

  return new Set(rows.filter((row) => row.is_enabled).map((row) => row.module_key));
}

export function moduleForPath(pathname: string) {
  const route = Object.keys(routeModuleMap).find((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
  return route ? routeModuleMap[route] : null;
}
