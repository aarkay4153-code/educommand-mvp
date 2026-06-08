import { PageHeader } from "@/components/app/page-header";
import { AccessDenied } from "@/components/app/access-denied";
import { PrintButton } from "@/components/reports/print-button";
import { SaveReportButton, type ReportPayload } from "@/components/reports/save-report-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { getBoardCommandReportSummary } from "@/lib/board-command-summary";
import { collegeAlerts, collegeCourses, collegeDepartments, feeOverview, finalExamOverview, semesterProgress } from "@/lib/college-mode-data";
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
  institution_type: string | null;
};

type SyllabusRow = {
  teacher_id: string | null;
  class_section_id: string | null;
  completion_percentage: number | null;
  status: string | null;
  delay_reason: string | null;
  submitted_at: string | null;
  week_start_date: string | null;
};

type AssignmentRow = {
  teacher_id: string | null;
};

type StaffRow = {
  id: string;
  full_name: string;
  role: string;
};

type TaskRow = {
  title: string;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  delay_reason: string | null;
  completion_percentage: number | null;
};

type EventRow = {
  event_name: string;
  event_date: string;
  intensity: string | null;
  status: string | null;
  completion_percentage: number | null;
};

type MilestoneRow = {
  status: string | null;
  delay_reason: string | null;
};

type InstitutionRow = {
  total_students: number | null;
  total_teachers: number | null;
  total_admin_staff: number | null;
  total_classes: number | null;
};

const completedTaskStatuses = new Set(["completed"]);

export default async function ReportsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Reports" description="Connect Supabase to generate school reports." />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live reports are not available yet." />
          <CardContent className="text-sm text-muted-foreground">
            Add Supabase environment variables and sign in to use this module.
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

  if (!profile?.school_id || profile.role === "teacher") {
    return (
      <>
        <PageHeader
          title="Reports"
          description="Reports are available to principals and coordinators."
        />
        <AccessDenied message="Reports are hidden for teachers in this MVP." />
      </>
    );
  }

  const schoolId = profile.school_id;
  const generatedAt = new Date();
  const generatedDate = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(generatedAt);
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartDate = weekStart.toISOString().slice(0, 10);
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const thirtyDaysDate = thirtyDays.toISOString().slice(0, 10);

  const [
    schoolResult,
    syllabusResult,
    assignmentsResult,
    staffResult,
    tasksResult,
    eventsResult,
    milestonesResult,
    institutionResult,
    modulesResult,
  ] = await Promise.all([
    supabase.from("schools").select("name, institution_type").eq("id", schoolId).maybeSingle<SchoolRow>(),
    supabase
      .from("syllabus_updates")
      .select("teacher_id, class_section_id, completion_percentage, status, delay_reason, submitted_at, week_start_date")
      .eq("school_id", schoolId)
      .order("week_start_date", { ascending: false }),
    supabase.from("teacher_assignments").select("teacher_id").eq("school_id", schoolId),
    supabase.from("profiles").select("id, full_name, role").eq("school_id", schoolId).eq("is_active", true),
    supabase
      .from("tasks")
      .select("title, due_date, priority, status, delay_reason, completion_percentage")
      .eq("school_id", schoolId),
    supabase
      .from("events")
      .select("event_name, event_date, intensity, status, completion_percentage")
      .eq("school_id", schoolId),
    supabase.from("event_milestones").select("status, delay_reason").eq("school_id", schoolId),
    supabase
      .from("institution_profile")
      .select("total_students, total_teachers, total_admin_staff, total_classes")
      .eq("school_id", schoolId)
      .maybeSingle<InstitutionRow>(),
    supabase
      .from("school_modules")
      .select("module_key, is_enabled")
      .eq("school_id", schoolId),
  ]);

  const school = schoolResult.data;
  const syllabus = (syllabusResult.data ?? []) as SyllabusRow[];
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const staff = (staffResult.data ?? []) as StaffRow[];
  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const events = (eventsResult.data ?? []) as EventRow[];
  const milestones = (milestonesResult.data ?? []) as MilestoneRow[];
  const institution = institutionResult.data;
  const institutionType: InstitutionType = isInstitutionType(school?.institution_type)
    ? school.institution_type
    : "school";
  const enabledModules = moduleRowsToEnabledSet((modulesResult.data ?? []) as SchoolModule[], institutionType);
  const showBoardCommandReport = institutionType === "school" && enabledModules.has("board_command");
  const showCollegeReports = institutionType === "college" && enabledModules.has("college_command");
  const boardReport = getBoardCommandReportSummary();
  const assignedTeacherIds = new Set(assignments.map((row) => row.teacher_id).filter(Boolean));
  const teachers = staff.filter((row) => row.role === "teacher");
  const latestSyllabusByClass = latestByKey(syllabus, (row) => row.class_section_id ?? "");
  const averageSyllabus = average(latestSyllabusByClass.map((row) => row.completion_percentage ?? 0));
  const weeklyUpdates = syllabus.filter((row) => (row.submitted_at ?? "") >= weekStartDate);
  const weeklySubmittedTeachers = new Set(weeklyUpdates.map((row) => row.teacher_id).filter(Boolean));
  const teachersPendingUpdate = Array.from(assignedTeacherIds).filter((teacherId) => !weeklySubmittedTeachers.has(teacherId));
  const classesBehindTarget = latestSyllabusByClass.filter(
    (row) => row.status === "behind" || (row.completion_percentage ?? 0) < 50,
  );
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const activeTasks = tasks.filter((task) => !completedTaskStatuses.has(task.status ?? ""));
  const overdueTasks = activeTasks.filter((task) => task.due_date && task.due_date < today);
  const criticalPendingTasks = activeTasks.filter((task) => task.priority === "critical" || task.priority === "high");
  const upcomingEvents = events.filter((event) => event.event_date >= today && event.event_date <= thirtyDaysDate);
  const highIntensityEvents = events.filter((event) => event.intensity === "high" && event.event_date >= today);
  const delayedMilestones = milestones.filter((milestone) => milestone.status === "delayed" || milestone.status === "blocked");
  const eventReadiness = average(events.map((event) => event.completion_percentage ?? 0));
  const teacherComplianceRows = teachers.map((teacher) => {
    const teacherUpdates = syllabus.filter((row) => row.teacher_id === teacher.id);
    const latest = teacherUpdates
      .map((row) => row.submitted_at || row.week_start_date)
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      name: teacher.full_name,
      updatesSubmitted: teacherUpdates.length,
      pendingUpdates: assignedTeacherIds.has(teacher.id) && !weeklySubmittedTeachers.has(teacher.id) ? 1 : 0,
      latestUpdateDate: latest ?? null,
    };
  });
  const delayReasons = topDelayReasons([
    ...tasks.map((task) => task.delay_reason),
    ...syllabus.map((row) => row.delay_reason),
    ...milestones.map((milestone) => milestone.delay_reason),
  ]);

  const reports: ReportPayload[] = [
    buildReport(profile.id, schoolId, "Weekly Syllabus Report", "weekly_syllabus", {
      averageSyllabusCompletion: Math.round(averageSyllabus),
      updatesSubmittedThisWeek: weeklyUpdates.length,
      teachersPendingUpdate: teachersPendingUpdate.length,
      classesBehindTarget: classesBehindTarget.length,
    }),
    buildReport(profile.id, schoolId, "Task Completion Report", "task_completion", {
      totalTasks,
      completedTasks,
      overdueTasks: overdueTasks.length,
      taskCompletionPercentage: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      criticalPendingTasks: criticalPendingTasks.length,
    }),
    buildReport(profile.id, schoolId, "Event Readiness Report", "event_readiness", {
      upcomingEvents: upcomingEvents.length,
      highIntensityEvents: highIntensityEvents.length,
      delayedMilestones: delayedMilestones.length,
      eventReadinessPercentage: Math.round(eventReadiness),
    }),
    buildReport(profile.id, schoolId, "Teacher Update Compliance Report", "teacher_update_compliance", {
      teachers: teacherComplianceRows,
    }),
    buildReport(profile.id, schoolId, "Delay Reason Analysis", "delay_reason_analysis", {
      topReasons: delayReasons,
    }),
    buildReport(profile.id, schoolId, "Institution Snapshot Report", "institution_snapshot", {
      overallSyllabusProgress: Math.round(averageSyllabus),
      activeTasks: activeTasks.length,
      overdueTasks: overdueTasks.length,
      upcomingEvents: upcomingEvents.length,
      eventsAtRisk: events.filter((event) => event.status === "at_risk" || event.status === "delayed").length,
      totalStudents: institution?.total_students ?? null,
      totalTeachers: institution?.total_teachers ?? teachers.length,
      totalAdminStaff: institution?.total_admin_staff ?? null,
      totalClasses: institution?.total_classes ?? null,
    }),
  ];

  if (showBoardCommandReport) {
    reports.push(
      buildReport(profile.id, schoolId, "Board Command Summary Report", "board_command_summary", {
        class10Readiness: boardReport.class10.readinessScore,
        class12Readiness: boardReport.class12.readinessScore,
        riskCategoryCounts: boardReport.riskCategoryCounts,
        subjectWeaknessSummary: boardReport.subjectWeaknessSummary,
        interventionPending: boardReport.interventionPending,
      }),
    );
  }

  const collegeReports: ReportPayload[] = showCollegeReports
    ? [
        buildReport(profile.id, schoolId, "Course-wise Academic Progress Report", "college_course_progress", {
          courses: collegeCourses,
        }),
        buildReport(profile.id, schoolId, "Department-wise Progress Report", "college_department_progress", {
          departments: collegeDepartments,
        }),
        buildReport(profile.id, schoolId, "Final Exam Readiness Report", "college_final_exam_readiness", {
          overview: finalExamOverview,
        }),
        buildReport(profile.id, schoolId, "Fee Pending Report", "college_fee_pending", {
          overview: feeOverview,
        }),
        buildReport(profile.id, schoolId, "Placement Readiness Report", "college_placement_readiness", {
          courses: collegeCourses.map((course) => ({ course: course.course, placement: course.placement })),
        }),
        buildReport(profile.id, schoolId, "Internship Status Report", "college_internship_status", {
          semesterProgress,
        }),
        buildReport(profile.id, schoolId, "Accreditation Readiness Report", "college_accreditation_readiness", {
          pendingEvidence: collegeAlerts.filter((alert) => alert.title.toLowerCase().includes("accreditation")),
        }),
        buildReport(profile.id, schoolId, "Management Summary Report", "college_management_summary", {
          courses: collegeCourses.length,
          departments: collegeDepartments.length,
          criticalAlerts: collegeAlerts.filter((alert) => alert.severity === "red").length,
        }),
      ]
    : [];

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Reports"
          description="Weekly and monthly summaries generated live from EduCommand data."
          action={<PrintButton />}
        />
      </div>

      <div className="print-document-header hidden">
        <h1 className="print-document-title">{school?.name ?? "EduCommand"}</h1>
        <p className="print-document-meta">EduCommand Reports</p>
        <p className="print-document-meta">Generated on {generatedDate}</p>
      </div>

      <div className="print-report grid gap-6 xl:grid-cols-2">
        <ReportCard report={reports[0]}>
          <SnapshotGrid
            items={[
              ["Average syllabus completion", `${Math.round(averageSyllabus)}%`],
              ["Updates submitted this week", String(weeklyUpdates.length)],
              ["Teachers pending update", String(teachersPendingUpdate.length)],
              ["Classes behind target", String(classesBehindTarget.length)],
            ]}
          />
        </ReportCard>

        <ReportCard report={reports[1]}>
          <SnapshotGrid
            items={[
              ["Total tasks", String(totalTasks)],
              ["Completed tasks", String(completedTasks)],
              ["Overdue tasks", String(overdueTasks.length)],
              ["Task completion percentage", `${totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}%`],
              ["Critical pending tasks", String(criticalPendingTasks.length)],
            ]}
          />
        </ReportCard>

        <ReportCard report={reports[2]}>
          <SnapshotGrid
            items={[
              ["Upcoming events", String(upcomingEvents.length)],
              ["High intensity events", String(highIntensityEvents.length)],
              ["Delayed milestones", String(delayedMilestones.length)],
              ["Event readiness percentage", `${Math.round(eventReadiness)}%`],
            ]}
          />
        </ReportCard>

        <ReportCard report={reports[3]}>
          {teacherComplianceRows.length > 0 ? (
            <DataTable
              headers={["Teacher", "Updates", "Pending", "Latest update"]}
              rows={teacherComplianceRows.map((row) => [
                row.name,
                String(row.updatesSubmitted),
                row.pendingUpdates ? (
                  <Badge key={`${row.name}-pending`} tone="warning">
                    Pending
                  </Badge>
                ) : (
                  <Badge key={`${row.name}-done`} tone="success">
                    Clear
                  </Badge>
                ),
                formatDate(row.latestUpdateDate),
              ])}
            />
          ) : (
            <EmptyState message="No teachers found yet." />
          )}
        </ReportCard>

        <ReportCard report={reports[4]}>
          {delayReasons.length > 0 ? (
            <DataTable
              headers={["Reason", "Count"]}
              rows={delayReasons.map((reason) => [reason.reason, String(reason.count)])}
            />
          ) : (
            <EmptyState message="No delay reasons recorded yet." />
          )}
        </ReportCard>

        <ReportCard report={reports[5]}>
          <SnapshotGrid
            items={[
              ["Overall syllabus progress", `${Math.round(averageSyllabus)}%`],
              ["Active tasks", String(activeTasks.length)],
              ["Overdue tasks", String(overdueTasks.length)],
              ["Upcoming events", String(upcomingEvents.length)],
              ["Total students", valueOrPlaceholder(institution?.total_students)],
              ["Total teachers", valueOrPlaceholder(institution?.total_teachers ?? teachers.length)],
            ]}
          />
        </ReportCard>

        {showBoardCommandReport ? (
          <ReportCard report={reports[6]}>
            <SnapshotGrid
              items={[
                ["Class 10 readiness", `${boardReport.class10.readinessScore}%`],
                ["Class 12 readiness", `${boardReport.class12.readinessScore}%`],
                ["Class 10 critical students", String(boardReport.class10.criticalStudents)],
                ["Class 12 board risk students", String(boardReport.class12.boardRiskStudents)],
                ["Intervention pending", String(boardReport.interventionPending)],
              ]}
            />
            <div className="mt-4">
              <DataTable
                headers={["Class", "Subject", "Weakness / Risk", "Affected"]}
                rows={boardReport.subjectWeaknessSummary.map((item) => [
                  item.className,
                  item.subject,
                  item.detail,
                  String(item.affected),
                ])}
              />
            </div>
          </ReportCard>
        ) : null}

        {showCollegeReports ? (
          <>
            <ReportCard report={collegeReports[0]}>
              <DataTable
                headers={["Course", "Departments", "Batches", "Students", "Syllabus", "Final Exams", "Fees", "Placement"]}
                rows={collegeCourses.map((course) => [
                  course.course,
                  String(course.departments),
                  String(course.batches),
                  String(course.students),
                  `${course.syllabus}%`,
                  course.finalExam,
                  course.feePending,
                  course.placement,
                ])}
              />
            </ReportCard>

            <ReportCard report={collegeReports[1]}>
              <DataTable
                headers={["Course", "Department", "HOD", "Syllabus", "Lab", "Internal", "Final Exam", "Alerts"]}
                rows={collegeDepartments.map((department) => [
                  department.course,
                  department.department,
                  department.hod,
                  `${department.syllabus}%`,
                  department.lab ? `${department.lab}%` : "NA",
                  department.internal,
                  department.finalExam,
                  String(department.alerts),
                ])}
              />
            </ReportCard>

            <ReportCard report={collegeReports[2]}>
              <SnapshotGrid items={finalExamOverview.map((item) => [item.label, item.value])} />
            </ReportCard>

            <ReportCard report={collegeReports[3]}>
              <SnapshotGrid items={feeOverview.map((item) => [item.label, item.value])} />
            </ReportCard>

            <ReportCard report={collegeReports[4]}>
              <SnapshotGrid items={collegeCourses.map((course) => [`${course.course} readiness`, course.placement])} />
            </ReportCard>

            <ReportCard report={collegeReports[5]}>
              <DataTable
                headers={["Batch", "Semester/Year", "Syllabus", "Lab", "Internal", "Attendance Risk"]}
                rows={semesterProgress.map((batch) => [
                  batch.batch,
                  batch.semester,
                  `${batch.syllabus}%`,
                  batch.lab ? `${batch.lab}%` : "NA",
                  batch.internal,
                  batch.attendanceRisk,
                ])}
              />
            </ReportCard>

            <ReportCard report={collegeReports[6]}>
              <SnapshotGrid
                items={[
                  ["NAAC readiness", "64%"],
                  ["NBA readiness", "58%"],
                  ["AICTE documentation", "72%"],
                  ["Evidence pending", "31"],
                ]}
              />
            </ReportCard>

            <ReportCard report={collegeReports[7]}>
              <SnapshotGrid
                items={[
                  ["Courses", String(collegeCourses.length)],
                  ["Departments", String(collegeDepartments.length)],
                  ["Critical alerts", String(collegeAlerts.filter((alert) => alert.severity === "red").length)],
                  ["Overall syllabus", `${Math.round(collegeCourses.reduce((sum, course) => sum + course.syllabus, 0) / collegeCourses.length)}%`],
                ]}
              />
            </ReportCard>
          </>
        ) : null}
      </div>
    </>
  );
}

function ReportCard({ children, report }: { children: React.ReactNode; report: ReportPayload }) {
  return (
    <Card className="print-card">
      <CardHeader
        title={report.title}
        description={labelize(report.report_type)}
        action={<SaveReportButton report={report} />}
      />
      <CardContent>{children}</CardContent>
    </Card>
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

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

function buildReport(
  generatedBy: string,
  schoolId: string,
  title: string,
  reportType: string,
  content: Record<string, unknown>,
): ReportPayload {
  return {
    title,
    report_type: reportType,
    generated_by: generatedBy,
    school_id: schoolId,
    content,
  };
}

function latestByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const latest: T[] = [];

  items.forEach((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    latest.push(item);
  });

  return latest;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topDelayReasons(reasons: (string | null)[]) {
  const counts = new Map<string, number>();
  reasons
    .map((reason) => reason?.trim())
    .filter(Boolean)
    .forEach((reason) => {
      counts.set(reason!, (counts.get(reason!) ?? 0) + 1);
    });

  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function valueOrPlaceholder(value?: number | null) {
  return value == null ? "Not available" : String(value);
}
