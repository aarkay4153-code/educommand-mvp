import { AccessDenied } from "@/components/app/access-denied";
import { PageHeader } from "@/components/app/page-header";
import { CopyMessageButton } from "@/components/workflow/copy-message-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher";
  school_id: string | null;
};

type TaskRow = {
  title: string;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  delay_reason: string | null;
};

type EventRow = {
  event_name: string;
  event_date: string;
  intensity: string | null;
  status: string | null;
  completion_percentage: number | null;
};

type SyllabusRow = {
  teacher_id: string | null;
  class_section_id: string | null;
  completion_percentage: number | null;
  status: string | null;
  submitted_at: string | null;
};

type AssignmentRow = {
  teacher_id: string | null;
};

type StaffRow = {
  id: string;
  full_name: string;
  role: string;
};

const reminderMessage =
  "Reminder: Please submit your weekly syllabus update before 4 PM today in EduCommand.";
const overdueTaskMessage =
  "The following tasks are pending beyond due date. Kindly update status or delay reason today.";

export default async function WeeklyWorkflowPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Weekly Workflow" description="Connect Supabase to run the weekly school rhythm." />
        <AccessDenied title="Supabase setup needed" message="Add Supabase environment variables and sign in to use this page." />
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
        <PageHeader title="Weekly Workflow" description="Weekly institutional rhythm is available to leadership roles." />
        <AccessDenied message="Teachers can use Dashboard, Syllabus, Tasks, and Calendar for their assigned work." />
      </>
    );
  }

  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekStartDate = weekStart.toISOString().slice(0, 10);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndDate = weekEnd.toISOString().slice(0, 10);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);

  const [tasksResult, eventsResult, syllabusResult, assignmentsResult, staffResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, due_date, priority, status, delay_reason")
      .eq("school_id", profile.school_id)
      .order("due_date", { ascending: true }),
    supabase
      .from("events")
      .select("event_name, event_date, intensity, status, completion_percentage")
      .eq("school_id", profile.school_id)
      .order("event_date", { ascending: true }),
    supabase
      .from("syllabus_updates")
      .select("teacher_id, class_section_id, completion_percentage, status, submitted_at")
      .eq("school_id", profile.school_id)
      .order("submitted_at", { ascending: false }),
    supabase.from("teacher_assignments").select("teacher_id").eq("school_id", profile.school_id),
    supabase.from("profiles").select("id, full_name, role").eq("school_id", profile.school_id).eq("is_active", true),
  ]);

  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const events = (eventsResult.data ?? []) as EventRow[];
  const syllabus = (syllabusResult.data ?? []) as SyllabusRow[];
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const staff = (staffResult.data ?? []) as StaffRow[];
  const tasksDueThisWeek = tasks.filter(
    (task) => task.due_date && task.due_date >= todayDate && task.due_date <= weekEndDate && task.status !== "completed",
  );
  const overdueTasks = tasks.filter((task) => task.due_date && task.due_date < todayDate && task.status !== "completed");
  const eventsNeedingUpdate = events.filter(
    (event) =>
      event.event_date >= todayDate &&
      event.event_date <= weekEndDate &&
      event.status !== "completed" &&
      (event.completion_percentage ?? 0) < 80,
  );
  const latestByClass = latestByKey(syllabus, (row) => row.class_section_id ?? "");
  const classesBehind = latestByClass.filter(
    (row) => row.status === "behind" || row.status === "not_started" || (row.completion_percentage ?? 0) < 50,
  );
  const assignedTeacherIds = new Set(assignments.map((row) => row.teacher_id).filter(Boolean));
  const submittedTeacherIds = new Set(
    syllabus
      .filter((row) => (row.submitted_at ?? "") >= weekStartDate)
      .map((row) => row.teacher_id)
      .filter(Boolean),
  );
  const teachers = staff.filter((member) => member.role === "teacher");
  const teachersSubmitted = teachers.filter((teacher) => submittedTeacherIds.has(teacher.id));
  const teachersPending = teachers.filter((teacher) => assignedTeacherIds.has(teacher.id) && !submittedTeacherIds.has(teacher.id));
  const syllabusProgress = average(latestByClass.map((row) => row.completion_percentage ?? 0));
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const eventReadiness = average(events.map((event) => event.completion_percentage ?? 0));
  const criticalAlerts = [
    ...overdueTasks.slice(0, 3).map((task) => task.title),
    ...events.filter((event) => event.status === "at_risk" || event.status === "delayed").slice(0, 3).map((event) => event.event_name),
  ];

  return (
    <>
      <PageHeader
        title="Weekly Workflow"
        description="A simple institutional rhythm for planning, monitoring, teacher compliance, and leadership summary."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkflowCard title="1. Monday Planning Checklist" description="Set the tone for the school week.">
          <Checklist
            items={[
              "Set weekly syllabus targets",
              "Assign weekly tasks",
              "Review upcoming events",
            ]}
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Next week starts {formatDate(nextWeekStart.toISOString().slice(0, 10))}.
          </p>
        </WorkflowCard>

        <WorkflowCard title="2. Mid-week Monitoring" description="Check work that may need intervention.">
          <MetricGrid
            items={[
              ["Tasks due this week", String(tasksDueThisWeek.length)],
              ["Events needing progress update", String(eventsNeedingUpdate.length)],
              ["Classes behind syllabus target", String(classesBehind.length)],
            ]}
          />
          <div className="mt-4">
            <DataTable
              headers={["Task", "Due", "Priority", "Status"]}
              rows={tasksDueThisWeek.slice(0, 5).map((task) => [
                task.title,
                formatDate(task.due_date),
                task.priority ?? "-",
                <Badge key={task.title} tone={task.status === "delayed" ? "danger" : "warning"}>
                  {labelize(task.status ?? "pending")}
                </Badge>,
              ])}
            />
          </div>
        </WorkflowCard>

        <WorkflowCard title="3. Friday Teacher Update Compliance" description="Close weekly academic reporting.">
          <MetricGrid
            items={[
              ["Teachers submitted", String(teachersSubmitted.length)],
              ["Teachers pending", String(teachersPending.length)],
            ]}
          />
          <div className="mt-4 rounded-md border bg-background p-3">
            <p className="text-sm text-muted-foreground">{reminderMessage}</p>
            <div className="mt-3">
              <CopyMessageButton message={reminderMessage} />
            </div>
          </div>
          <div className="mt-3 rounded-md border bg-background p-3">
            <p className="text-sm text-muted-foreground">{overdueTaskMessage}</p>
            <div className="mt-3">
              <CopyMessageButton message={overdueTaskMessage} />
            </div>
          </div>
        </WorkflowCard>

        <WorkflowCard title="4. Saturday Principal Summary" description="End the week with a leadership snapshot.">
          <MetricGrid
            items={[
              ["Syllabus progress", `${Math.round(syllabusProgress)}%`],
              ["Task completion", `${tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%`],
              ["Event readiness", `${Math.round(eventReadiness)}%`],
              ["Critical alerts", String(criticalAlerts.length)],
            ]}
          />
          <div className="mt-4 rounded-md border bg-background p-3">
            <p className="text-sm font-medium">Next week priorities</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Resolve overdue tasks and require delay reasons.</li>
              <li>Follow up with teachers pending weekly syllabus updates.</li>
              <li>Push high-intensity events above 80% readiness.</li>
            </ul>
          </div>
        </WorkflowCard>
      </div>
    </>
  );
}

function WorkflowCard({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label className="flex items-center gap-3 rounded-md border bg-background p-3 text-sm font-medium" key={item}>
          <input className="size-4" type="checkbox" />
          {item}
        </label>
      ))}
    </div>
  );
}

function MetricGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div className="rounded-md border bg-background p-3" key={label}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
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
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}
