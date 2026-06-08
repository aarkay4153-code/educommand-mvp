"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { ProofUpload } from "@/components/uploads/proof-upload";
import { writeActivityLog } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/client";

export type TaskProfile = {
  id: string;
  full_name: string;
  role: "principal" | "coordinator" | "teacher";
};

export type TaskItem = {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  assigned_by: string | null;
  assigned_to: string | null;
  assignedToName: string;
  assignedByName: string;
  due_date: string | null;
  priority: string;
  status: string;
  delay_reason: string | null;
  proof_required: boolean;
  proof_url: string | null;
  remarks: string | null;
  completion_percentage: number;
  updated_at: string | null;
};

export type ActivityLogItem = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  actorName: string;
};

const priorityOptions = ["low", "medium", "high", "critical"];
const allStatusOptions = [
  "assigned",
  "acknowledged",
  "in_progress",
  "submitted",
  "returned",
  "completed",
  "delayed",
];
const teacherStatusOptions = ["acknowledged", "in_progress", "submitted", "delayed", "completed"];
const completedStatuses = new Set(["completed"]);

export function TasksWorkspace({
  currentUserId,
  isLeader,
  profiles,
  schoolId,
  tasks,
  activityLogs,
}: {
  activityLogs: ActivityLogItem[];
  currentUserId: string;
  isLeader: boolean;
  profiles: TaskProfile[];
  schoolId: string;
  tasks: TaskItem[];
}) {
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [overdueFilter, setOverdueFilter] = useState("all");

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const overdue = isOverdue(task);
        return (
          (assignedToFilter === "all" || task.assigned_to === assignedToFilter) &&
          (priorityFilter === "all" || task.priority === priorityFilter) &&
          (statusFilter === "all" || task.status === statusFilter) &&
          (overdueFilter === "all" || (overdueFilter === "overdue" ? overdue : !overdue))
        );
      }),
    [assignedToFilter, overdueFilter, priorityFilter, statusFilter, tasks],
  );

  const overdueCount = tasks.filter(isOverdue).length;
  const openCount = tasks.filter((task) => !completedStatuses.has(task.status)).length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Open Tasks" value={openCount} detail="Not completed" />
        <MetricCard label="Overdue Tasks" value={overdueCount} detail="Computed from due date" danger={overdueCount > 0} />
        <MetricCard label="Completed Tasks" value={completedCount} detail="Marked completed" />
      </div>

      {isLeader ? (
        <TaskForm currentUserId={currentUserId} profiles={profiles} schoolId={schoolId} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader title="Filters" description="Narrow the task list." />
          <CardContent className="space-y-4">
            <FilterSelect
              label="Assigned to"
              onChange={setAssignedToFilter}
              options={profiles.map((profile) => ({ label: profile.full_name, value: profile.id }))}
              value={assignedToFilter}
            />
            <FilterSelect
              label="Priority"
              onChange={setPriorityFilter}
              options={priorityOptions.map((priority) => ({ label: labelize(priority), value: priority }))}
              value={priorityFilter}
            />
            <FilterSelect
              label="Status"
              onChange={setStatusFilter}
              options={allStatusOptions.map((status) => ({ label: labelize(status), value: status }))}
              value={statusFilter}
            />
            <FilterSelect
              label="Overdue"
              onChange={setOverdueFilter}
              options={[
                { label: "Overdue only", value: "overdue" },
                { label: "Not overdue", value: "not_overdue" },
              ]}
              value={overdueFilter}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={isLeader ? "All Tasks" : "My Tasks"}
            description={isLeader ? "School-wide task delegation tracker." : "Tasks assigned to you."}
          />
          <CardContent className="p-0">
            {filteredTasks.length > 0 ? (
              <DataTable
                headers={["Task", "Owner", "Due", "Priority", "Status", "Progress"]}
                rows={filteredTasks.map((task) => [
                  <TaskTitle key={`${task.id}-title`} task={task} />,
                  task.assignedToName,
                  <DueDate key={`${task.id}-due`} task={task} />,
                  <Badge key={`${task.id}-priority`} tone={priorityTone(task.priority)}>
                    {labelize(task.priority)}
                  </Badge>,
                  <Badge key={task.id} tone={taskTone(task)}>
                    {isOverdue(task) ? "overdue" : labelize(task.status)}
                  </Badge>,
                  `${task.completion_percentage}%`,
                ])}
              />
            ) : (
              <EmptyState message="No tasks match the selected filters." />
            )}
          </CardContent>
        </Card>
      </div>

  <TaskCards activityLogs={activityLogs} currentUserId={currentUserId} isLeader={isLeader} profiles={profiles} tasks={filteredTasks} />
    </div>
  );
}

function TaskForm({
  currentUserId,
  profiles,
  schoolId,
}: {
  currentUserId: string;
  profiles: TaskProfile[];
  schoolId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(profiles[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [proofRequired, setProofRequired] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState("0");
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const progress = Number(completionPercentage);

    if (!title.trim()) {
      setMessage({ type: "error", text: "Task title is required." });
      return;
    }

    if (!assignedTo) {
      setMessage({ type: "error", text: "Choose who this task is assigned to." });
      return;
    }

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setMessage({ type: "error", text: "Completion percentage must be between 0 and 100." });
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from("tasks").insert({
      school_id: schoolId,
      title: title.trim(),
      description: description.trim() || null,
      assigned_by: currentUserId,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      priority,
      status: "assigned",
      proof_required: proofRequired,
      completion_percentage: progress,
    });

    setIsSubmitting(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setProofRequired(false);
    setCompletionPercentage("0");
    setMessage({ type: "success", text: "Task created." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Create Task" description="Assign a clear action item to a teacher or coordinator." />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <FormMessage message={message} />
          <Field label="Title">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </Field>
          <Field label="Assigned to">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setAssignedTo(event.target.value)}
              value={assignedTo}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} ({profile.role})
                </option>
              ))}
            </select>
          </Field>
          <Field className="lg:col-span-2" label="Description">
            <textarea
              className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </Field>
          <Field label="Due date">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              value={dueDate}
            />
          </Field>
          <Field label="Priority">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setPriority(event.target.value)}
              value={priority}
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {labelize(option)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Initial completion">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              max="100"
              min="0"
              onChange={(event) => setCompletionPercentage(event.target.value)}
              type="number"
              value={completionPercentage}
            />
          </Field>
          <label className="flex items-center gap-3 pt-8 text-sm font-medium">
            <input
              checked={proofRequired}
              className="size-4"
              onChange={(event) => setProofRequired(event.target.checked)}
              type="checkbox"
            />
            Proof required
          </label>
          <div className="lg:col-span-2">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating..." : "Create task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TaskCards({
  currentUserId,
  isLeader,
  profiles,
  tasks,
  activityLogs,
}: {
  activityLogs: ActivityLogItem[];
  currentUserId: string;
  isLeader: boolean;
  profiles: TaskProfile[];
  tasks: TaskItem[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tasks.map((task) => (
        <TaskCard
          currentUserId={currentUserId}
          isLeader={isLeader}
          key={task.id}
          logs={activityLogs.filter((log) => log.entity_type === "task" && log.entity_id === task.id)}
          profiles={profiles}
          task={task}
        />
      ))}
      {tasks.length === 0 ? (
        <Card>
          <EmptyState message="No task cards to show." />
        </Card>
      ) : null}
    </div>
  );
}

function TaskCard({
  currentUserId,
  isLeader,
  logs,
  profiles,
  task,
}: {
  currentUserId: string;
  isLeader: boolean;
  logs: ActivityLogItem[];
  profiles: TaskProfile[];
  task: TaskItem;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [assignedTo, setAssignedTo] = useState(task.assigned_to ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [delayReason, setDelayReason] = useState(task.delay_reason ?? "");
  const [proofUrl, setProofUrl] = useState(task.proof_url ?? "");
  const [remarks, setRemarks] = useState(task.remarks ?? "");
  const [completionPercentage, setCompletionPercentage] = useState(String(task.completion_percentage));
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const teacherCanUpdate = !isLeader && task.assigned_to === currentUserId;

  async function updateTask(overrides: Partial<TaskItem> = {}) {
    setMessage(null);
    const progress = Number(completionPercentage);

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setMessage({ type: "error", text: "Completion percentage must be between 0 and 100." });
      return;
    }

    const nextStatus = overrides.status ?? status;

    if (nextStatus === "delayed" && !delayReason.trim()) {
      setMessage({ type: "error", text: "Add a delay reason before marking delayed." });
      return;
    }

    if (nextStatus === "completed" && task.proof_required && !proofUrl.trim()) {
      setMessage({ type: "error", text: "Upload proof before marking this task completed." });
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const payload = isLeader
      ? {
          title: title.trim(),
          description: description.trim() || null,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
          priority,
          status: nextStatus,
          delay_reason: nextStatus === "delayed" ? delayReason.trim() : delayReason.trim() || null,
          proof_url: proofUrl.trim() || null,
          remarks: remarks.trim() || null,
          completion_percentage: progress,
        }
      : {
          status: nextStatus,
          delay_reason: nextStatus === "delayed" ? delayReason.trim() : delayReason.trim() || null,
          proof_url: proofUrl.trim() || null,
          remarks: remarks.trim() || null,
          completion_percentage: progress,
        };

    const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
    setIsSubmitting(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    if (task.status !== nextStatus) {
      await writeActivityLog({
        action: "status_changed",
        actorId: currentUserId,
        entityId: task.id,
        entityType: "task",
        oldValue: { status: task.status },
        newValue: { status: nextStatus },
        schoolId: task.school_id,
      });
    }

    setStatus(nextStatus);
    setMessage({ type: "success", text: "Task updated." });
    router.refresh();
  }

  return (
    <Card className={isOverdue(task) ? "border-rose-200" : undefined}>
      <CardHeader
        title={task.title}
        description={`${task.assignedToName} · Due ${formatDate(task.due_date)}`}
        action={
          <div className="flex gap-2">
            <Badge tone={priorityTone(task.priority)}>{labelize(task.priority)}</Badge>
            <Badge tone={taskTone(task)}>{isOverdue(task) ? "overdue" : labelize(task.status)}</Badge>
          </div>
        }
      />
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {task.description || "No description added."}
          </p>
          <FormMessage message={message} />

          {isLeader ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title">
                <input
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </Field>
              <Field label="Assigned to">
                <select
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  onChange={(event) => setAssignedTo(event.target.value)}
                  value={assignedTo}
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name} ({profile.role})
                    </option>
                  ))}
                </select>
              </Field>
              <Field className="md:col-span-2" label="Description">
                <textarea
                  className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </Field>
              <Field label="Due date">
                <input
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  onChange={(event) => setDueDate(event.target.value)}
                  type="date"
                  value={dueDate}
                />
              </Field>
              <Field label="Priority">
                <select
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  onChange={(event) => setPriority(event.target.value)}
                  value={priority}
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {labelize(option)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}

          {(teacherCanUpdate || isLeader) ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Status">
                <select
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  {(isLeader ? allStatusOptions : teacherStatusOptions).map((option) => (
                    <option key={option} value={option}>
                      {labelize(option)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Completion percentage">
                <input
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  max="100"
                  min="0"
                  onChange={(event) => setCompletionPercentage(event.target.value)}
                  type="number"
                  value={completionPercentage}
                />
              </Field>
              {status === "delayed" ? (
                <Field className="md:col-span-2" label="Delay reason">
                  <textarea
                    className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
                    onChange={(event) => setDelayReason(event.target.value)}
                    required
                    value={delayReason}
                  />
                </Field>
              ) : null}
              <Field className="md:col-span-2" label="Remarks">
                <textarea
                  className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Short update or correction note"
                  value={remarks}
                />
              </Field>
              <Field className="md:col-span-2" label="Proof URL">
                <ProofUpload
                  disabled={!task.proof_required && !isLeader}
                  module="tasks"
                  onUploaded={async (path) => {
                    setProofUrl(path);
                    await createClient().from("tasks").update({ proof_url: path }).eq("id", task.id);
                    await writeActivityLog({
                      action: "proof_uploaded",
                      actorId: currentUserId,
                      entityId: task.id,
                      entityType: "task",
                      newValue: { proof_url: path },
                      schoolId: task.school_id,
                    });
                  }}
                  recordId={task.id}
                  schoolId={task.school_id}
                  value={proofUrl}
                />
              </Field>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {(teacherCanUpdate || isLeader) ? (
              <Button disabled={isSubmitting} onClick={() => updateTask()} type="button">
                {isSubmitting ? "Saving..." : "Save update"}
              </Button>
            ) : null}
            {isLeader ? (
              <>
                <Button disabled={isSubmitting} onClick={() => updateTask({ status: "returned" })} type="button" variant="secondary">
                  Return for correction
                </Button>
                <Button disabled={isSubmitting} onClick={() => updateTask({ status: "completed" })} type="button" variant="secondary">
                  Mark completed
                </Button>
              </>
            ) : null}
          </div>
          <ActivityLogList logs={logs} />
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityLogList({ logs }: { logs: ActivityLogItem[] }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-sm font-semibold">Recent activity</p>
      {logs.length > 0 ? (
        <div className="mt-3 space-y-2">
          {logs.slice(0, 4).map((log) => (
            <div key={log.id} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{log.actorName}</span> {labelize(log.action ?? "updated")} · {formatDate(log.created_at)}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No activity logged yet.</p>
      )}
    </div>
  );
}

type FormMessage = {
  type: "success" | "error";
  text: string;
} | null;

function FormMessage({ message }: { message: FormMessage }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm md:col-span-2 lg:col-span-2 ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
      }`}
    >
      {message.text}
    </div>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`block text-sm font-medium ${className ?? ""}`}>
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function MetricCard({
  danger,
  detail,
  label,
  value,
}: {
  danger?: boolean;
  detail: string;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-3 text-3xl font-semibold ${danger ? "text-rose-700 dark:text-rose-300" : ""}`}>{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TaskTitle({ task }: { task: TaskItem }) {
  return (
    <div>
      <p>{task.title}</p>
      {task.proof_required ? <p className="mt-1 text-xs text-muted-foreground">Proof required</p> : null}
    </div>
  );
}

function DueDate({ task }: { task: TaskItem }) {
  return <span className={isOverdue(task) ? "font-medium text-rose-700 dark:text-rose-300" : ""}>{formatDate(task.due_date)}</span>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-5 text-sm text-muted-foreground">{message}</div>;
}

function isOverdue(task: TaskItem) {
  if (!task.due_date || completedStatuses.has(task.status)) return false;
  return task.due_date < new Date().toISOString().slice(0, 10);
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function taskTone(task: TaskItem) {
  if (isOverdue(task) || task.status === "delayed" || task.status === "returned") return "danger" as const;
  if (task.status === "completed") return "success" as const;
  if (task.status === "submitted" || task.status === "in_progress" || task.status === "acknowledged") {
    return "info" as const;
  }
  return "warning" as const;
}

function priorityTone(priority: string) {
  if (priority === "critical") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "medium") return "info" as const;
  return "neutral" as const;
}
