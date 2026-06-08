import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  TasksWorkspace,
  type ActivityLogItem,
  type TaskItem,
  type TaskProfile,
} from "@/components/tasks/tasks-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RelatedRow<T> = T | T[] | null;

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher";
  school_id: string | null;
};

type TaskRow = {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  assigned_by: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  delay_reason: string | null;
  proof_required: boolean | null;
  proof_url: string | null;
  remarks: string | null;
  completion_percentage: number | null;
  updated_at: string | null;
  assigned_to_profile?: RelatedRow<{ full_name: string | null }>;
  assigned_by_profile?: RelatedRow<{ full_name: string | null }>;
};

type ActivityLogRow = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

export default async function TasksPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          title="Task Delegation"
          description="Connect Supabase to manage delegated school work."
        />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live task data is not available yet." />
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

  if (!profile?.school_id) {
    return (
      <>
        <PageHeader
          title="Task Delegation"
          description="Your task workspace will appear after your profile is configured."
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

  const isLeader = profile.role === "principal" || profile.role === "coordinator";

  const profilesQuery = supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("school_id", profile.school_id)
    .eq("is_active", true)
    .in("role", ["coordinator", "teacher"])
    .order("full_name", { ascending: true });

  const tasksQuery = supabase
    .from("tasks")
    .select(
      "id, school_id, title, description, assigned_by, assigned_to, due_date, priority, status, delay_reason, proof_required, proof_url, remarks, completion_percentage, updated_at, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name), assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)",
    )
    .eq("school_id", profile.school_id)
    .order("updated_at", { ascending: false });

  if (!isLeader) {
    tasksQuery.eq("assigned_to", profile.id);
  }

  const activityLogsQuery = supabase
    .from("activity_logs")
    .select("id, entity_type, entity_id, action, old_value, new_value, created_at, profiles(full_name)")
    .eq("school_id", profile.school_id)
    .eq("entity_type", "task")
    .order("created_at", { ascending: false })
    .limit(80);

  const [{ data: profileRows }, { data: taskRows }, { data: activityRows }] = await Promise.all([
    profilesQuery,
    tasksQuery,
    activityLogsQuery,
  ]);

  const assignableProfiles = ((profileRows ?? []) as TaskProfile[]).filter(
    (row) => isLeader || row.id === profile.id,
  );
  const tasks = ((taskRows ?? []) as unknown as TaskRow[]).map(toTaskItem);
  const activityLogs = ((activityRows ?? []) as unknown as ActivityLogRow[]).map(toActivityLogItem);

  return (
    <>
      <PageHeader
        title="Task Delegation"
        description={
          isLeader
            ? "Create, assign, review, return, and complete school tasks."
            : "Update your assigned tasks quickly with status, progress, remarks, and proof links."
        }
      />
      <TasksWorkspace
        currentUserId={profile.id}
        activityLogs={activityLogs}
        isLeader={isLeader}
        profiles={assignableProfiles}
        schoolId={profile.school_id}
        tasks={tasks}
      />
    </>
  );
}

function toActivityLogItem(row: ActivityLogRow): ActivityLogItem {
  return {
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    action: row.action,
    old_value: row.old_value,
    new_value: row.new_value,
    created_at: row.created_at,
    actorName: relatedOne(row.profiles)?.full_name ?? "Someone",
  };
}

function toTaskItem(row: TaskRow): TaskItem {
  return {
    id: row.id,
    school_id: row.school_id,
    title: row.title,
    description: row.description,
    assigned_by: row.assigned_by,
    assigned_to: row.assigned_to,
    assignedByName: relatedOne(row.assigned_by_profile)?.full_name ?? "Unassigned",
    assignedToName: relatedOne(row.assigned_to_profile)?.full_name ?? "Unassigned",
    due_date: row.due_date,
    priority: row.priority ?? "medium",
    status: row.status ?? "assigned",
    delay_reason: row.delay_reason,
    proof_required: row.proof_required ?? false,
    proof_url: row.proof_url,
    remarks: row.remarks,
    completion_percentage: row.completion_percentage ?? 0,
    updated_at: row.updated_at,
  };
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}
