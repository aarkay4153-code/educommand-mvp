import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { BoardRiskBadge } from "@/components/board-command/board-risk-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { getClass10BoardOverview, getClass12BoardOverview } from "@/lib/board-command-summary";
import { collegeAlerts, collegeCommandSummary, collegeCourses } from "@/lib/college-mode-data";
import { isInstitutionType, moduleRowsToEnabledSet, type InstitutionType, type ModuleKey, type SchoolModule } from "@/lib/modules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  school_id: string | null;
  role: "principal" | "coordinator" | "teacher" | "management";
};

type SyllabusUpdate = {
  id: string;
  teacher_id: string | null;
  class_section_id: string | null;
  subject_id: string | null;
  planned_portion: string | null;
  completed_portion: string | null;
  completion_percentage: number | null;
  status: string | null;
  delay_reason: string | null;
  week_start_date: string | null;
  submitted_at: string | null;
  created_at: string | null;
  profiles?: RelatedRow<{ full_name: string | null }>;
  class_sections?: RelatedRow<{ class_name: string | null; section: string | null }>;
  subjects?: RelatedRow<{ subject_name: string | null }>;
};

type TaskRow = {
  id: string;
  title: string;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  completion_percentage: number | null;
  updated_at: string | null;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

type EventRow = {
  id: string;
  event_name: string;
  event_date: string;
  intensity: string | null;
  status: string | null;
  completion_percentage: number | null;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

type MilestoneRow = {
  id: string;
  title: string;
  status: string | null;
  due_date: string | null;
};

type StaffStatusRow = {
  staff_id: string;
  status: string | null;
  substitution_required: boolean | null;
};

type TimetablePeriodRow = {
  id: string;
  teacher_id: string | null;
  class_section_id: string | null;
};

type SubstitutionRow = {
  id: string;
  class_section_id: string | null;
  status: string | null;
};

type StudentRow = {
  id: string;
  class_section_id: string | null;
};

type StudentAttendanceRow = {
  student_id: string;
  class_section_id: string | null;
  status: string | null;
};

type PlacementProfileRow = {
  placement_status: string | null;
};

type PlacementOfferRow = {
  ctc: number | null;
  status: string | null;
};

type AccreditationCriterionRow = {
  accreditation_type: string | null;
  status: string | null;
  completion_percentage: number | null;
};

type AccreditationEvidenceRow = {
  status: string | null;
};

type BoardAlertRow = {
  id: string;
  board_class: "class_10" | "class_12" | null;
  severity: "red" | "amber" | "green" | "blue" | null;
  title: string | null;
  message: string | null;
  status: string | null;
};

type RelatedRow<T> = T | T[] | null;

const criticalTaskPriorities = new Set(["high", "critical"]);

function formatDate(date: string | null) {
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

function statusTone(status: string | null) {
  if (!status) return "neutral" as const;
  if (["completed", "on_track"].includes(status)) return "success" as const;
  if (["delayed", "overdue", "at_risk", "behind"].includes(status)) return "danger" as const;
  if (["in_progress", "submitted", "acknowledged"].includes(status)) return "info" as const;
  return "neutral" as const;
}

function normalizeStatus(status: string | null) {
  return status ? status.replaceAll("_", " ") : "unknown";
}

function percent(value: number | null | undefined) {
  return `${Math.round(value ?? 0)}%`;
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-5 text-sm text-muted-foreground">{message}</div>;
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Connect Supabase to view live school readiness, tasks, syllabus progress, and events."
          action={<Button variant="secondary">Setup pending</Button>}
        />
        <Card>
          <CardHeader title="No live data yet" description="Supabase environment variables are not configured." />
          <EmptyState message="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then sign in again." />
        </Card>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, school_id, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.school_id) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Your school dashboard will appear after your EduCommand profile is configured."
        />
        <Card>
          <CardHeader title="Profile setup needed" description="No school is linked to this account yet." />
          <EmptyState message="Please contact the institution admin to complete your EduCommand profile." />
        </Card>
      </>
    );
  }

  const schoolId = profile.school_id;
  const isTeacher = profile.role === "teacher";
  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekStartDate = weekStart.toISOString().slice(0, 10);
  const inSevenDays = new Date(today);
  inSevenDays.setDate(today.getDate() + 7);
  const sevenDaysDate = inSevenDays.toISOString().slice(0, 10);
  const inThirtyDays = new Date(today);
  inThirtyDays.setDate(today.getDate() + 30);
  const thirtyDaysDate = inThirtyDays.toISOString().slice(0, 10);

  const syllabusQuery = supabase
    .from("syllabus_updates")
    .select(
      "id, teacher_id, class_section_id, subject_id, planned_portion, completed_portion, completion_percentage, status, delay_reason, week_start_date, submitted_at, created_at, profiles(full_name), class_sections(class_name, section), subjects(subject_name)",
    )
    .eq("school_id", schoolId)
    .order("week_start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  const weeklyUpdatesQuery = supabase
    .from("syllabus_updates")
    .select("teacher_id")
    .eq("school_id", schoolId)
    .gte("submitted_at", weekStartDate);
  const assignedTeachersQuery = supabase
    .from("teacher_assignments")
    .select("teacher_id")
    .eq("school_id", schoolId);
  const overdueTasksQuery = supabase
    .from("tasks")
    .select("id, title, priority, status, due_date, completion_percentage, updated_at, profiles!tasks_assigned_to_fkey(full_name)")
    .eq("school_id", schoolId)
    .lt("due_date", todayDate)
    .neq("status", "completed")
    .order("due_date", { ascending: true });
  const recentTasksQuery = supabase
    .from("tasks")
    .select("id, title, priority, status, due_date, completion_percentage, updated_at, profiles!tasks_assigned_to_fkey(full_name)")
    .eq("school_id", schoolId)
    .order("updated_at", { ascending: false })
    .limit(6);
  const assignedMilestonesQuery = supabase
    .from("event_milestones")
    .select("id, title, status, due_date")
    .eq("school_id", schoolId)
    .eq("owner_id", profile.id)
    .order("due_date", { ascending: true });

  if (isTeacher) {
    syllabusQuery.eq("teacher_id", profile.id);
    weeklyUpdatesQuery.eq("teacher_id", profile.id);
    assignedTeachersQuery.eq("teacher_id", profile.id);
    overdueTasksQuery.eq("assigned_to", profile.id);
    recentTasksQuery.eq("assigned_to", profile.id);
  }

  const [
    syllabusResult,
    weeklyUpdatesResult,
    assignedTeachersResult,
    overdueTasksResult,
    upcomingEventsResult,
    atRiskEventsResult,
    reportsResult,
    recentTasksResult,
    assignedMilestonesResult,
    schoolResult,
    modulesResult,
    boardAlertsResult,
    staffResult,
    staffStatusTodayResult,
    timetableTodayResult,
    substitutionsTodayResult,
    studentsResult,
    studentAttendanceTodayResult,
    placementProfilesResult,
    placementOffersResult,
    recruitersResult,
    accreditationCriteriaResult,
    accreditationEvidenceResult,
  ] = await Promise.all([
    syllabusQuery,
    weeklyUpdatesQuery,
    assignedTeachersQuery,
    overdueTasksQuery,
    supabase
      .from("events")
      .select("id, event_name, event_date, intensity, status, completion_percentage, profiles!events_owner_id_fkey(full_name)")
      .eq("school_id", schoolId)
      .gte("event_date", todayDate)
      .lte("event_date", thirtyDaysDate)
      .order("event_date", { ascending: true }),
    supabase
      .from("events")
      .select("id, event_name, event_date, intensity, status, completion_percentage, profiles!events_owner_id_fkey(full_name)")
      .eq("school_id", schoolId)
      .in("status", ["at_risk", "delayed"]),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    recentTasksQuery,
    assignedMilestonesQuery,
    supabase
      .from("schools")
      .select("institution_type")
      .eq("id", schoolId)
      .maybeSingle<{ institution_type: string | null }>(),
    supabase
      .from("school_modules")
      .select("module_key, is_enabled")
      .eq("school_id", schoolId),
    supabase
      .from("board_alerts")
      .select("id, board_class, severity, title, message, status")
      .eq("school_id", schoolId)
      .eq("severity", "red")
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .in("role", ["principal", "coordinator", "teacher"]),
    supabase
      .from("staff_daily_status")
      .select("staff_id, status, substitution_required")
      .eq("school_id", schoolId)
      .eq("status_date", todayDate),
    supabase
      .from("timetable_periods")
      .select("id, teacher_id, class_section_id")
      .eq("school_id", schoolId)
      .eq("day_of_week", new Intl.DateTimeFormat("en", { weekday: "long" }).format(today).toLowerCase()),
    supabase
      .from("substitutions")
      .select("id, class_section_id, status")
      .eq("school_id", schoolId)
      .eq("date", todayDate),
    supabase
      .from("students")
      .select("id, class_section_id")
      .eq("school_id", schoolId)
      .eq("is_active", true),
    supabase
      .from("student_daily_attendance")
      .select("student_id, class_section_id, status")
      .eq("school_id", schoolId)
      .eq("attendance_date", todayDate),
    supabase
      .from("placement_profiles")
      .select("placement_status")
      .eq("school_id", schoolId),
    supabase
      .from("placement_offers")
      .select("ctc, status")
      .eq("school_id", schoolId),
    supabase
      .from("recruiters")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId),
    supabase
      .from("accreditation_criteria")
      .select("accreditation_type, status, completion_percentage")
      .eq("school_id", schoolId),
    supabase
      .from("accreditation_evidence")
      .select("status")
      .eq("school_id", schoolId),
  ]);

  const institutionType: InstitutionType = isInstitutionType(schoolResult.data?.institution_type)
    ? schoolResult.data.institution_type
    : "school";
  const enabledModules = moduleRowsToEnabledSet((modulesResult.data ?? []) as SchoolModule[], institutionType);
  const hasModule = (moduleKey: ModuleKey) => enabledModules.has(moduleKey);
  const showBoardCommandPreview =
    institutionType === "school" &&
    hasModule("board_command") &&
    (profile.role === "principal" || profile.role === "coordinator");
  const showStaffStatusPreview =
    hasModule("staff_status") &&
    (profile.role === "principal" || profile.role === "coordinator");
  const showTimetablePreview =
    hasModule("timetable") &&
    (profile.role === "principal" || profile.role === "coordinator");
  const showStudentAttendancePreview =
    hasModule("student_attendance") &&
    (profile.role === "principal" || profile.role === "coordinator");
  const showPlacementPreview =
    institutionType === "college" &&
    hasModule("placements") &&
    (profile.role === "principal" || profile.role === "coordinator" || profile.role === "management");
  const showCollegeCommandPreview =
    institutionType === "college" &&
    hasModule("college_command") &&
    (profile.role === "principal" || profile.role === "coordinator" || profile.role === "management");
  const showAccreditationPreview =
    institutionType === "college" &&
    hasModule("accreditation") &&
    (profile.role === "principal" || profile.role === "coordinator" || profile.role === "management");
  const class10Board = getClass10BoardOverview();
  const class12Board = getClass12BoardOverview();

  const syllabusUpdates = (syllabusResult.data ?? []) as unknown as SyllabusUpdate[];
  const latestSyllabusUpdates = latestByKey(
    syllabusUpdates,
    (update) => `${update.teacher_id}-${update.class_section_id}-${update.subject_id}`,
  );
  const averageSyllabus =
    latestSyllabusUpdates.length > 0
      ? latestSyllabusUpdates.reduce((sum, update) => sum + (update.completion_percentage ?? 0), 0) /
        latestSyllabusUpdates.length
      : 0;

  const assignedTeacherCount = new Set(
    (assignedTeachersResult.data ?? [])
      .map((assignment) => assignment.teacher_id)
      .filter(Boolean),
  ).size;
  const weeklyTeacherUpdateCount = new Set(
    (weeklyUpdatesResult.data ?? [])
      .map((update) => update.teacher_id)
      .filter(Boolean),
  ).size;

  const overdueTasks = (overdueTasksResult.data ?? []) as unknown as TaskRow[];
  const upcomingEvents = (upcomingEventsResult.data ?? []) as unknown as EventRow[];
  const atRiskEvents = (atRiskEventsResult.data ?? []) as unknown as EventRow[];
  const recentTasks = (recentTasksResult.data ?? []) as unknown as TaskRow[];
  const assignedMilestones = (assignedMilestonesResult.data ?? []) as unknown as MilestoneRow[];
  const boardAlerts = showBoardCommandPreview ? ((boardAlertsResult.data ?? []) as BoardAlertRow[]) : [];
  const staffStatusesToday = (staffStatusTodayResult.data ?? []) as StaffStatusRow[];
  const timetableToday = (timetableTodayResult.data ?? []) as TimetablePeriodRow[];
  const substitutionsToday = (substitutionsTodayResult.data ?? []) as SubstitutionRow[];
  const students = (studentsResult.data ?? []) as StudentRow[];
  const studentAttendanceToday = (studentAttendanceTodayResult.data ?? []) as StudentAttendanceRow[];
  const placementProfiles = (placementProfilesResult.data ?? []) as PlacementProfileRow[];
  const placementOffers = (placementOffersResult.data ?? []) as PlacementOfferRow[];
  const accreditationCriteria = (accreditationCriteriaResult.data ?? []) as AccreditationCriterionRow[];
  const accreditationEvidence = (accreditationEvidenceResult.data ?? []) as AccreditationEvidenceRow[];
  const unavailableTeacherIds = new Set(
    staffStatusesToday
      .filter((row) => ["absent", "leave", "on_duty", "training", "exam_duty"].includes(row.status ?? ""))
      .map((row) => row.staff_id),
  );
  const affectedClassIds = new Set(
    timetableToday
      .filter((period) => period.teacher_id && unavailableTeacherIds.has(period.teacher_id))
      .map((period) => period.class_section_id)
      .filter(Boolean),
  );
  const timetableSummary = {
    classesAffected: affectedClassIds.size,
    substitutionsAssigned: substitutionsToday.filter((row) =>
      ["assigned", "acknowledged", "completed"].includes(row.status ?? ""),
    ).length,
    substitutionsPending: substitutionsToday.filter((row) =>
      !row.status || row.status === "suggested" || row.status === "missed",
    ).length,
  };
  const attendancePresent = studentAttendanceToday.filter((row) => row.status === "present" || row.status === "late").length;
  const attendanceAbsent = studentAttendanceToday.filter((row) => row.status === "absent").length;
  const classStudentCounts = countByClass(students);
  const classPresentCounts = countByClass(
    studentAttendanceToday.filter((row) => row.status === "present" || row.status === "late"),
  );
  const lowAttendanceClasses = Array.from(classStudentCounts.entries()).filter(([classId, total]) => {
    if (!classId || total === 0) return false;
    const present = classPresentCounts.get(classId) ?? 0;
    return Math.round((present / total) * 100) < 85;
  }).length;
  const studentAttendanceSummary = {
    absent: attendanceAbsent,
    percentage: students.length ? Math.round((attendancePresent / students.length) * 100) : 0,
    present: attendancePresent,
    totalStudents: students.length,
    lowAttendanceClasses,
  };
  const placementEligible = placementProfiles.filter((row) => row.placement_status === "eligible" || row.placement_status === "placed").length;
  const placementPlaced = placementProfiles.filter((row) => row.placement_status === "placed").length;
  const placementPackages = placementOffers
    .filter((row) => ["offered", "accepted", "joined"].includes(row.status ?? ""))
    .map((row) => row.ctc ?? 0)
    .filter((ctc) => ctc > 0);
  const placementSummary = {
    registered: placementProfiles.filter((row) => row.placement_status !== "not_registered").length,
    eligible: placementEligible,
    placed: placementPlaced,
    placementPercentage: placementEligible ? Math.round((placementPlaced / placementEligible) * 100) : 0,
    highestPackage: placementPackages.length ? Math.max(...placementPackages) : 0,
    companiesVisited: recruitersResult.count ?? 0,
  };
  const accreditationSummary = {
    naac: averageAccreditation(accreditationCriteria, "naac"),
    nba: averageAccreditation(accreditationCriteria, "nba"),
    aicte: averageAccreditation(accreditationCriteria, "aicte"),
    pendingEvidence: accreditationEvidence.filter((row) => row.status !== "verified").length,
    delayedCriteria: accreditationCriteria.filter((row) => row.status === "delayed").length,
  };
  const staffSummary = {
    absent: staffStatusesToday.filter((row) => row.status === "absent").length,
    late: staffStatusesToday.filter((row) => row.status === "late").length,
    leave: staffStatusesToday.filter((row) => row.status === "leave").length,
    onDuty: staffStatusesToday.filter((row) => row.status === "on_duty" || row.status === "exam_duty").length,
    present: staffStatusesToday.filter((row) => row.status === "present").length,
    substitutionRequired: staffStatusesToday.filter((row) => row.substitution_required).length,
    totalStaff: staffResult.data?.length ?? 0,
  };
  const upcomingSevenDayEvents = upcomingEvents.filter((event) => event.event_date <= sevenDaysDate);
  const pendingMilestones = assignedMilestones.filter((milestone) => milestone.status !== "completed");
  const criticalAlerts =
    overdueTasks.filter((task) => criticalTaskPriorities.has(task.priority ?? "")).length +
    (isTeacher
      ? assignedMilestones.filter((milestone) => milestone.status === "delayed" || milestone.status === "blocked").length
      : atRiskEvents.filter((event) => event.intensity === "high").length);

  const dashboardCards = (isTeacher ? [
    {
      label: "My Syllabus Progress",
      value: percent(averageSyllabus),
      detail: `${latestSyllabusUpdates.length} assigned update stream(s)`,
      moduleKey: "syllabus" as ModuleKey,
    },
    {
      label: "Weekly Updates Submitted",
      value: `${weeklyTeacherUpdateCount}/${Math.max(assignedTeacherCount, 1)}`,
      detail: "Your submissions this week",
      moduleKey: "syllabus" as ModuleKey,
    },
    {
      label: "My Overdue Tasks",
      value: String(overdueTasks.length),
      detail: "Assigned to you and not completed",
      moduleKey: "tasks" as ModuleKey,
    },
    {
      label: "Assigned Milestones",
      value: String(pendingMilestones.length),
      detail: "Event milestones pending",
      moduleKey: "calendar" as ModuleKey,
    },
    {
      label: "Critical Alerts",
      value: String(criticalAlerts),
      detail: "Your delayed tasks and milestones",
      moduleKey: "alerts" as ModuleKey,
    },
  ] : [
    {
      label: "Overall Syllabus Progress",
      value: percent(averageSyllabus),
      detail: `${latestSyllabusUpdates.length} latest updates included`,
      moduleKey: "syllabus" as ModuleKey,
    },
    {
      label: "Weekly Teacher Updates Received",
      value: `${weeklyTeacherUpdateCount}/${assignedTeacherCount}`,
      detail: "Submitted this week vs assigned teachers",
      moduleKey: "syllabus" as ModuleKey,
    },
    {
      label: "Overdue Tasks",
      value: String(overdueTasks.length),
      detail: "Due before today and not completed",
      moduleKey: "tasks" as ModuleKey,
    },
    {
      label: "Upcoming Events",
      value: String(upcomingEvents.length),
      detail: "Next 30 days",
      moduleKey: "calendar" as ModuleKey,
    },
    {
      label: "Events At Risk",
      value: String(atRiskEvents.length),
      detail: "Delayed or marked at risk",
      moduleKey: "calendar" as ModuleKey,
    },
    {
      label: "Pending Reports",
      value: String(reportsResult.count ?? 0),
      detail: "Reports table count for now",
      moduleKey: "reports" as ModuleKey,
    },
    {
      label: "Critical Alerts",
      value: String(criticalAlerts),
      detail: "Critical overdue tasks and high-risk events",
      moduleKey: "alerts" as ModuleKey,
    },
  ]).filter((card) => hasModule(card.moduleKey));

  const attentionItems = [
    ...boardAlerts.slice(0, 3).map((alert) => ({
      title: alert.title ?? "Board Command alert",
      detail: `${alert.board_class === "class_12" ? "Class 12" : "Class 10"} - ${alert.message ?? "Critical board readiness item"}`,
      status: "critical",
    })),
    ...overdueTasks.slice(0, 4).map((task) => ({
      title: task.title,
      detail: `Task overdue since ${formatDate(task.due_date)}`,
      status: task.priority ?? "priority",
    })),
    ...(isTeacher
      ? []
      : atRiskEvents.slice(0, 4).map((event) => ({
          title: event.event_name,
          detail: `Event on ${formatDate(event.event_date)}`,
          status: event.status ?? "event",
        }))),
    ...pendingMilestones.slice(0, 4).map((milestone) => ({
      title: milestone.title,
      detail: `Milestone due ${formatDate(milestone.due_date)}`,
      status: milestone.status ?? "pending",
    })),
  ].slice(0, 6);
  const upcomingMilestones = pendingMilestones.filter(
    (milestone) => milestone.due_date && milestone.due_date >= todayDate && milestone.due_date <= sevenDaysDate,
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          isTeacher
            ? "Your pending syllabus updates, assigned tasks, and assigned event milestones."
            : "Live command view for syllabus coverage, teacher updates, task delays, events, reports, and alerts."
        }
        action={isTeacher || !hasModule("tasks") ? undefined : <Button>New task</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <Card key={card.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {showStaffStatusPreview ? (
        <Card className="mt-6">
          <CardHeader
            title="Today's Staff Command Board"
            description="Daily staff visibility for presence, absence, duty and substitution needs."
            action={
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
                href="/staff-status"
              >
                Open Staff Status
              </Link>
            }
          />
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
              <MiniMetric label="Total staff" value={String(staffSummary.totalStaff)} />
              <MiniMetric label="Present today" value={String(staffSummary.present)} />
              <MiniMetric label="Absent today" value={String(staffSummary.absent)} />
              <MiniMetric label="On leave" value={String(staffSummary.leave)} />
              <MiniMetric label="Late today" value={String(staffSummary.late)} />
              <MiniMetric label="On duty" value={String(staffSummary.onDuty)} />
              <MiniMetric label="Substitution required" value={String(staffSummary.substitutionRequired)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showTimetablePreview ? (
        <Card className="mt-6">
          <CardHeader
            title="Timetable and Substitution"
            description="Daily class-period visibility and substitution planning."
            action={
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
                href="/timetable"
              >
                Open Timetable
              </Link>
            }
          />
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Classes affected today" value={String(timetableSummary.classesAffected)} />
              <MiniMetric label="Substitutions assigned" value={String(timetableSummary.substitutionsAssigned)} />
              <MiniMetric label="Substitutions pending" value={String(timetableSummary.substitutionsPending)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showStudentAttendancePreview ? (
        <Card className="mt-6">
          <CardHeader
            title="Student Attendance Intelligence"
            description="Command-level attendance visibility and early warning."
            action={
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
                href="/student-attendance"
              >
                Open Student Attendance
              </Link>
            }
          />
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MiniMetric label="Total students" value={String(studentAttendanceSummary.totalStudents)} />
              <MiniMetric label="Present today" value={String(studentAttendanceSummary.present)} />
              <MiniMetric label="Absent today" value={String(studentAttendanceSummary.absent)} />
              <MiniMetric label="Attendance today" value={`${studentAttendanceSummary.percentage}%`} />
              <MiniMetric label="Low attendance classes" value={String(studentAttendanceSummary.lowAttendanceClasses)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showPlacementPreview ? (
        <Card className="mt-6">
          <CardHeader
            title="Placement Command Centre"
            description="College placement readiness, offers and recruiter movement."
            action={
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
                href="/placements"
              >
                Open Placements
              </Link>
            }
          />
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <MiniMetric label="Registered" value={String(placementSummary.registered)} />
              <MiniMetric label="Eligible" value={String(placementSummary.eligible)} />
              <MiniMetric label="Placed" value={String(placementSummary.placed)} />
              <MiniMetric label="Placement %" value={`${placementSummary.placementPercentage}%`} />
              <MiniMetric label="Highest package" value={placementSummary.highestPackage ? `${placementSummary.highestPackage} LPA` : "Not set"} />
              <MiniMetric label="Companies visited" value={String(placementSummary.companiesVisited)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showCollegeCommandPreview ? (
        <Card className="mt-6">
          <CardHeader
            title="College Command Overview"
            description="Compact multi-course view for academics, exams, fees, placements and alerts."
            action={
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
                href="/college-command"
              >
                Open College Command
              </Link>
            }
          />
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {collegeCommandSummary.slice(0, 6).map((item) => (
                <MiniMetric key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
            <DataTable
              headers={["Course", "Syllabus", "Attendance Risk", "Final Exams", "Fees", "Placement"]}
              rows={collegeCourses.slice(0, 4).map((course) => [
                course.course,
                `${course.syllabus}%`,
                course.attendanceRisk,
                course.finalExam,
                course.feePending,
                course.placement,
              ])}
            />
            {collegeAlerts.some((alert) => alert.severity === "red") ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                {collegeAlerts.filter((alert) => alert.severity === "red").length} critical college alerts need attention today.
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {showAccreditationPreview ? (
        <Card className="mt-6">
          <CardHeader
            title="Accreditation Readiness"
            description="NAAC/NBA/AICTE-style readiness and evidence status."
            action={
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
                href="/accreditation"
              >
                Open Accreditation
              </Link>
            }
          />
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MiniMetric label="NAAC readiness" value={`${accreditationSummary.naac}%`} />
              <MiniMetric label="NBA readiness" value={`${accreditationSummary.nba}%`} />
              <MiniMetric label="AICTE docs" value={`${accreditationSummary.aicte}%`} />
              <MiniMetric label="Pending evidence" value={String(accreditationSummary.pendingEvidence)} />
              <MiniMetric label="Delayed criteria" value={String(accreditationSummary.delayedCriteria)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showBoardCommandPreview ? (
        <Card className="mt-6">
          <CardHeader
            title="Board Command Overview"
            description="Compact board exam readiness view. Student-level detail stays inside Board Command."
            action={
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
                href="/board-command"
              >
                Open Board Command
              </Link>
            }
          />
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{class10Board.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Class 10 board readiness without student-level clutter.</p>
                    </div>
                    <BoardRiskBadge risk={class10Board.risk} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Readiness" value={`${class10Board.readinessScore}%`} />
                    <MiniMetric label="Critical students" value={String(class10Board.criticalStudents)} />
                    <MiniMetric label="Extra coaching" value={String(class10Board.needsExtraCoaching)} />
                    <MiniMetric label="Merit potential" value={String(class10Board.highScorers)} />
                    <MiniMetric label="Syllabus average" value={`${class10Board.syllabusCompletionAverage}%`} />
                    <MiniMetric label="Mock/pre-board" value={class10Board.mockStatus} />
                    <MiniMetric label="Urgent alerts" value={String(class10Board.urgentAlerts)} />
                  </div>
                  <Link
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    href={class10Board.href}
                  >
                    Open Class 10 Board Command
                  </Link>
                </div>

              <div className="rounded-md border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{class12Board.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Stream-wise board, practical and competitive balance view.</p>
                  </div>
                  <BoardRiskBadge risk={class12Board.risk} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Readiness" value={`${class12Board.readinessScore}%`} />
                  <MiniMetric label="Highest risk stream" value={class12Board.streamAtHighestRisk} />
                  <MiniMetric label="Board risk students" value={String(class12Board.boardRiskStudents)} />
                  <MiniMetric label="Competitive focus" value={String(class12Board.competitiveFocusGroup)} />
                  <MiniMetric label="Topper potential" value={String(class12Board.highScorers)} />
                  <MiniMetric label="Practical pending" value={String(class12Board.practicalProjectPending)} />
                  <MiniMetric label="Urgent alerts" value={String(class12Board.urgentAlerts)} />
                </div>
                <Link
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  href={class12Board.href}
                >
                  Open Class 12 Board Command
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader title="Today's Attention" description="Items that need leadership visibility today." />
          {attentionItems.length > 0 ? (
            <CardContent>
              <div className="space-y-3">
                {attentionItems.map((item) => (
                  <div
                    key={`${item.title}-${item.detail}`}
                    className="flex items-start justify-between gap-4 rounded-md border bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <Badge tone="danger">{normalizeStatus(item.status)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          ) : (
            <EmptyState message="No urgent overdue tasks or at-risk events for today." />
          )}
        </Card>

        <Card>
          <CardHeader
            title={isTeacher ? "Upcoming Assigned Milestones" : "Upcoming 7 Days Events"}
            description={isTeacher ? "Milestones assigned to you." : "Events due soon."}
          />
          {isTeacher ? (
            upcomingMilestones.length > 0 ? (
              <CardContent>
                <div className="space-y-3">
                  {upcomingMilestones.map((milestone) => (
                    <div key={milestone.id} className="rounded-md border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{milestone.title}</p>
                        <Badge tone={statusTone(milestone.status)}>{normalizeStatus(milestone.status)}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{formatDate(milestone.due_date)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            ) : (
              <EmptyState message="No assigned milestones due in the next 7 days." />
            )
          ) : upcomingSevenDayEvents.length > 0 ? (
            <CardContent>
              <div className="space-y-3">
                {upcomingSevenDayEvents.map((event) => (
                  <div key={event.id} className="rounded-md border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{event.event_name}</p>
                      <Badge tone={statusTone(event.status)}>{normalizeStatus(event.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{formatDate(event.event_date)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          ) : (
            <EmptyState message="No events scheduled in the next 7 days." />
          )}
        </Card>
      </div>

      {hasModule("syllabus") || hasModule("tasks") ? (
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {hasModule("syllabus") ? <Card>
          <CardHeader title="Recent Syllabus Updates" description="Latest teacher submissions by class and subject." />
          <CardContent className="p-0">
            {syllabusUpdates.length > 0 ? (
              <DataTable
                headers={["Teacher", "Class", "Subject", "Progress", "Status"]}
                rows={syllabusUpdates.slice(0, 6).map((update) => [
                  relatedOne(update.profiles)?.full_name ?? "Unassigned",
                  classLabel(update.class_sections),
                  relatedOne(update.subjects)?.subject_name ?? "Subject",
                  percent(update.completion_percentage),
                  <Badge key={update.id} tone={statusTone(update.status)}>
                    {normalizeStatus(update.status)}
                  </Badge>,
                ])}
              />
            ) : (
              <EmptyState message="No syllabus updates have been submitted yet." />
            )}
          </CardContent>
        </Card> : null}

        {hasModule("tasks") ? <Card>
          <CardHeader title="Recent Task Updates" description="Recently changed delegated tasks." />
          <CardContent className="p-0">
            {recentTasks.length > 0 ? (
              <DataTable
                headers={["Task", "Owner", "Due", "Progress", "Status"]}
                rows={recentTasks.map((task) => [
                  task.title,
                  relatedOne(task.profiles)?.full_name ?? "Unassigned",
                  formatDate(task.due_date),
                  percent(task.completion_percentage),
                  <Badge key={task.id} tone={statusTone(task.status)}>
                    {normalizeStatus(task.status)}
                  </Badge>,
                ])}
              />
            ) : (
              <EmptyState message="No task updates are available yet." />
            )}
          </CardContent>
        </Card> : null}
      </div>
      ) : null}
    </>
  );
}

function latestByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const latest: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      latest.push(item);
    }
  }

  return latest;
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}

function countByClass(rows: { class_section_id: string | null }[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.class_section_id) return;
    counts.set(row.class_section_id, (counts.get(row.class_section_id) ?? 0) + 1);
  });
  return counts;
}

function averageAccreditation(rows: AccreditationCriterionRow[], accreditationType: string) {
  const matchingRows = rows.filter((row) => row.accreditation_type === accreditationType);
  if (matchingRows.length === 0) return 0;
  return Math.round(
    matchingRows.reduce((sum, row) => sum + (row.completion_percentage ?? 0), 0) / matchingRows.length,
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function classLabel(classSection: SyllabusUpdate["class_sections"]) {
  const section = relatedOne(classSection);
  if (!section?.class_name) return "Class";
  return [section.class_name, section.section].filter(Boolean).join("");
}
