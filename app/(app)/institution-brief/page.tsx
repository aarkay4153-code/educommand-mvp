import { PageHeader } from "@/components/app/page-header";
import { AccessDenied } from "@/components/app/access-denied";
import { PrintButton } from "@/components/reports/print-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { getClass10BoardOverview, getClass12BoardOverview } from "@/lib/board-command-summary";
import { collegeAlerts, collegeCourses, collegeDepartments, feeOverview, finalExamOverview } from "@/lib/college-mode-data";
import { isInstitutionType, moduleRowsToEnabledSet, type InstitutionType, type SchoolModule } from "@/lib/modules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher";
  school_id: string | null;
};

type SchoolRow = {
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  board: string | null;
  established_year: number | null;
  institution_type: string | null;
};

type InstitutionProfileRow = {
  vision: string | null;
  mission: string | null;
  total_students: number | null;
  total_teachers: number | null;
  total_admin_staff: number | null;
  total_classes: number | null;
  infrastructure_summary: string | null;
  achievements: string | null;
  special_programs: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
};

type StaffRow = {
  id: string;
  role: string;
  department: string | null;
  is_active: boolean | null;
};

type ClassSectionRow = {
  id: string;
  class_name: string;
  section: string | null;
};

type SyllabusRow = {
  class_section_id: string | null;
  completion_percentage: number | null;
  status: string | null;
};

type EventRow = {
  event_name: string;
  event_date: string;
  intensity: string | null;
  status: string | null;
};

type TaskRow = {
  title: string;
  due_date: string | null;
  priority: string | null;
  status: string | null;
};

const completedTaskStatuses = new Set(["completed"]);

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

export default async function InstitutionBriefPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          title="Institution Brief"
          description="Connect Supabase to generate a live institutional brief."
        />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live institution data is not available yet." />
          <CardContent className="text-sm text-muted-foreground">
            Add Supabase environment variables and sign in to use this page.
          </CardContent>
        </Card>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, school_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.school_id) {
    return (
      <>
        <PageHeader
          title="Institution Brief"
          description="Your institution brief will appear after your profile is configured."
        />
        <Card>
          <CardHeader title="Profile setup needed" description="No school is linked to this account yet." />
          <CardContent className="text-sm text-muted-foreground">
            Please contact the institution admin to complete your EduCommand profile.
          </CardContent>
        </Card>
      </>
    );
  }

  if (profile.role === "teacher") {
    return (
      <>
        <PageHeader title="Institution Brief" description="Institution briefs are available to leadership roles." />
        <AccessDenied message="Institution briefs are hidden for teachers in this MVP." />
      </>
    );
  }

  const schoolId = profile.school_id;
  const generatedDate = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const thirtyDaysDate = thirtyDays.toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartDate = weekStart.toISOString().slice(0, 10);

  const [
    schoolResult,
    institutionResult,
    staffResult,
    classesResult,
    syllabusResult,
    weeklyUpdatesResult,
    assignmentsResult,
    eventsResult,
    tasksResult,
    reportsResult,
    modulesResult,
  ] = await Promise.all([
    supabase.from("schools").select("name, address, city, state, board, established_year, institution_type").eq("id", schoolId).maybeSingle<SchoolRow>(),
    supabase.from("institution_profile").select("*").eq("school_id", schoolId).maybeSingle<InstitutionProfileRow>(),
    supabase.from("profiles").select("id, role, department, is_active").eq("school_id", schoolId),
    supabase.from("class_sections").select("id, class_name, section").eq("school_id", schoolId),
    supabase
      .from("syllabus_updates")
      .select("class_section_id, completion_percentage, status")
      .eq("school_id", schoolId)
      .order("week_start_date", { ascending: false })
      .limit(80),
    supabase
      .from("syllabus_updates")
      .select("teacher_id")
      .eq("school_id", schoolId)
      .gte("submitted_at", weekStartDate),
    supabase.from("teacher_assignments").select("teacher_id").eq("school_id", schoolId),
    supabase
      .from("events")
      .select("event_name, event_date, intensity, status")
      .eq("school_id", schoolId)
      .order("event_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("title, due_date, priority, status")
      .eq("school_id", schoolId)
      .order("due_date", { ascending: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase
      .from("school_modules")
      .select("module_key, is_enabled")
      .eq("school_id", schoolId),
  ]);

  const school = schoolResult.data;
  const institution = institutionResult.data;
  const staff = (staffResult.data ?? []) as StaffRow[];
  const classes = (classesResult.data ?? []) as ClassSectionRow[];
  const syllabusRows = (syllabusResult.data ?? []) as SyllabusRow[];
  const events = (eventsResult.data ?? []) as EventRow[];
  const tasks = (tasksResult.data ?? []) as TaskRow[];

  const latestSyllabusByClass = latestByClass(syllabusRows);
  const overallSyllabus =
    latestSyllabusByClass.length > 0
      ? latestSyllabusByClass.reduce((sum, row) => sum + (row.completion_percentage ?? 0), 0) /
        latestSyllabusByClass.length
      : 0;
  const classesOnTrack = latestSyllabusByClass.filter((row) => (row.completion_percentage ?? 0) >= 75 || row.status === "on_track").length;
  const classesBehind = latestSyllabusByClass.filter((row) => row.status === "behind" || (row.completion_percentage ?? 0) < 50).length;
  const assignedTeachers = new Set((assignmentsResult.data ?? []).map((row) => row.teacher_id).filter(Boolean));
  const submittedTeachers = new Set((weeklyUpdatesResult.data ?? []).map((row) => row.teacher_id).filter(Boolean));
  const activeTeachers = staff.filter((row) => row.role === "teacher" && row.is_active !== false).length;
  const activeCoordinators = staff.filter((row) => row.role === "coordinator" && row.is_active !== false).length;
  const departmentCounts = countBy(staff.filter((row) => row.is_active !== false), (row) => row.department || "Unassigned");
  const upcomingEvents = events.filter((event) => event.event_date >= today && event.event_date <= thirtyDaysDate);
  const highIntensityEvents = events.filter((event) => event.intensity === "high" && event.event_date >= today);
  const eventsAtRisk = events.filter((event) => event.status === "at_risk" || event.status === "delayed");
  const completedEvents = events.filter((event) => event.status === "completed").slice(-5);
  const activeTasks = tasks.filter((task) => !completedTaskStatuses.has(task.status ?? ""));
  const overdueTasks = activeTasks.filter((task) => task.due_date && task.due_date < today);
  const criticalTasks = activeTasks.filter((task) => task.priority === "critical" || task.priority === "high");
  const institutionType: InstitutionType = isInstitutionType(school?.institution_type)
    ? school.institution_type
    : "school";
  const enabledModules = moduleRowsToEnabledSet((modulesResult.data ?? []) as SchoolModule[], institutionType);
  const showBoardExamReadiness = institutionType === "school" && enabledModules.has("board_command");
  const showCollegeReadiness = institutionType === "college" && enabledModules.has("college_command");
  const class10Board = getClass10BoardOverview();
  const class12Board = getClass12BoardOverview();
  const criticalAlerts = [
    ...overdueTasks.slice(0, 3).map((task) => ({
      label: task.title,
      detail: `Overdue task - due ${formatDate(task.due_date)}`,
    })),
    ...eventsAtRisk.slice(0, 3).map((event) => ({
      label: event.event_name,
      detail: `${labelize(event.status ?? "at risk")} event - ${formatDate(event.event_date)}`,
    })),
  ].slice(0, 5);

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Institution Brief"
          description="One-click operating brief for visitors, management, inspection teams, and official review."
          action={
            <div className="flex flex-wrap gap-2">
              <PrintButton label="Generate Visitor Brief" />
              <PrintButton label="Generate Management Brief" />
              <PrintButton label="Generate Inspection Brief" />
              <PrintButton label="Print / Save as PDF" variant="ghost" />
            </div>
          }
        />
      </div>

      <div className="print-brief space-y-6">
        <div className="print-document-header hidden">
          <h1 className="print-document-title">{school?.name ?? "Institution Brief"}</h1>
          <p className="print-document-meta">EduCommand Institution Brief</p>
          <p className="print-document-meta">Generated on {generatedDate}</p>
        </div>

        <BriefSection title="1. Basic Institution Profile">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Info label="Name" value={school?.name} />
            <Info label="Address" value={school?.address} />
            <Info label="City" value={school?.city} />
            <Info label="State" value={school?.state} />
            <Info label="Board" value={school?.board} />
            <Info label="Established year" value={school?.established_year?.toString()} />
            <Info label="Contact email" value={institution?.contact_email} />
            <Info label="Contact phone" value={institution?.contact_phone} />
            <Info label="Website" value={institution?.website} />
          </div>
        </BriefSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <BriefSection title="2. Current Academic Snapshot">
            <SnapshotGrid
              items={[
                ["Overall syllabus progress", `${Math.round(overallSyllabus)}%`],
                ["Classes on track", String(classesOnTrack)],
                ["Classes behind", String(classesBehind)],
                ["Weekly update compliance", `${submittedTeachers.size}/${assignedTeachers.size}`],
                ["Board/exam class status", "Placeholder for next phase"],
              ]}
            />
          </BriefSection>

          <BriefSection title="3. Staff Snapshot">
            <SnapshotGrid
              items={[
                ["Total teachers", String(institution?.total_teachers ?? activeTeachers)],
                ["Total admin staff", valueOrPlaceholder(institution?.total_admin_staff)],
                ["Active coordinators", String(activeCoordinators)],
              ]}
            />
            <div className="mt-4">
              <DataTable
                headers={["Department", "Active staff"]}
                rows={departmentCounts.map(([department, count]) => [department, String(count)])}
              />
            </div>
          </BriefSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <BriefSection title="4. Student Snapshot">
            <SnapshotGrid
              items={[
                ["Total students", valueOrPlaceholder(institution?.total_students)],
                ["Total classes", String(institution?.total_classes ?? classes.length)],
                ["Class-wise strength", "Placeholder until enrollment data is added"],
              ]}
            />
          </BriefSection>

          <BriefSection title="5. Events Snapshot">
            <SnapshotGrid
              items={[
                ["Upcoming events", String(upcomingEvents.length)],
                ["High intensity events", String(highIntensityEvents.length)],
                ["Events at risk", String(eventsAtRisk.length)],
                ["Recently completed events", String(completedEvents.length)],
              ]}
            />
          </BriefSection>
        </div>

        {showBoardExamReadiness ? (
          <BriefSection title="Board Exam Readiness">
            <SnapshotGrid
              items={[
                ["Class 10 readiness score", `${class10Board.readinessScore}%`],
                ["Class 12 readiness score", `${class12Board.readinessScore}%`],
                ["Class 10 parent intervention count", String(class10Board.parentInterventionCount)],
                ["Class 12 parent counselling count", String(class12Board.parentInterventionCount)],
                ["Class 10 mock/pre-board status", class10Board.mockStatus],
                ["Class 12 mock/pre-board status", class12Board.mockStatus],
              ]}
            />
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              <LongInfo label="Class 10 key risks" value={class10Board.keyRisks.join("; ")} />
              <LongInfo label="Class 12 key risks" value={class12Board.keyRisks.join("; ")} />
            </div>
          </BriefSection>
        ) : null}

        {showCollegeReadiness ? (
          <BriefSection title="College Mode Readiness">
            <SnapshotGrid
              items={[
                ["Courses offered", collegeCourses.map((course) => course.course).join(", ")],
                ["Departments/specializations", String(collegeDepartments.length)],
                ["Active batches", String(collegeCourses.reduce((sum, course) => sum + course.batches, 0))],
                ["Faculty strength", String(collegeCourses.reduce((sum, course) => sum + course.faculty, 0))],
                ["Student strength", String(collegeCourses.reduce((sum, course) => sum + course.students, 0))],
                ["Academic progress", `${Math.round(collegeCourses.reduce((sum, course) => sum + course.syllabus, 0) / collegeCourses.length)}%`],
                ["Final exam readiness", finalExamOverview.find((item) => item.label === "Courses at risk")?.value ?? "Not available"],
                ["Fee pending summary", feeOverview.find((item) => item.label === "Total pending")?.value ?? "Not available"],
                ["Placement/internship status", "Course-wise placement readiness available"],
                ["Accreditation/compliance readiness", "Evidence tracker available"],
                ["Critical alerts", String(collegeAlerts.filter((alert) => alert.severity === "red").length)],
              ]}
            />
          </BriefSection>
        ) : null}

        <BriefSection title="6. Task and Delay Snapshot">
          <SnapshotGrid
            items={[
              ["Total active tasks", String(activeTasks.length)],
              ["Overdue tasks", String(overdueTasks.length)],
              ["Critical tasks", String(criticalTasks.length)],
              ["Pending reports", String(reportsResult.count ?? 0)],
            ]}
          />
        </BriefSection>

        <BriefSection title="7. Infrastructure and Achievements">
          <div className="grid gap-4 xl:grid-cols-2">
            <LongInfo label="Infrastructure" value={institution?.infrastructure_summary} />
            <LongInfo label="Achievements" value={institution?.achievements} />
            <LongInfo label="Special programs" value={institution?.special_programs} />
            <LongInfo label="Vision and mission" value={[institution?.vision, institution?.mission].filter(Boolean).join(" ")} />
          </div>
        </BriefSection>

        <BriefSection title="8. Critical Alerts">
          {criticalAlerts.length > 0 ? (
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950" key={`${alert.label}-${alert.detail}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{alert.label}</p>
                      <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{alert.detail}</p>
                    </div>
                    <Badge tone="danger">Alert</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No critical alerts at this time." />
          )}
        </BriefSection>
      </div>
    </>
  );
}

function BriefSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <Card className="print-card">
      <CardHeader title={title} />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || "Not available"}</p>
    </div>
  );
}

function LongInfo({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value || "Not available"}</p>
    </div>
  );
}

function SnapshotGrid({ items }: { items: [string, string][] }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 print:hidden">
        {items.map(([label, value]) => (
          <div className="rounded-md border bg-background p-3" key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <table className="hidden print:table">
        <tbody>
          {items.map(([label, value]) => (
            <tr key={label}>
              <td className="font-medium">{label}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function latestByClass(rows: SyllabusRow[]) {
  const seen = new Set<string>();
  const latest: SyllabusRow[] = [];

  rows.forEach((row) => {
    if (!row.class_section_id || seen.has(row.class_section_id)) return;
    seen.add(row.class_section_id);
    latest.push(row);
  });

  return latest;
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function valueOrPlaceholder(value?: number | null) {
  return value == null ? "Not available" : String(value);
}
