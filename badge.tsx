import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { demoTasks } from "@/lib/demo-data";
import { statusTone } from "@/lib/demo-helpers";

export default function DemoTasksPage() {
  const completed = demoTasks.filter((task) => task.status === "completed").length;
  const overdue = demoTasks.filter((task) => ["delayed", "in_progress"].includes(task.status) && ["25 May", "27 May"].includes(task.dueDate));
  const highPriority = demoTasks.filter((task) => task.priority === "high" || task.priority === "critical");

  return (
    <>
      <PageHeader
        title="Task Delegation"
        description="Demo view of assigned work, overdue items, proof needs and completion progress."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total tasks" value={String(demoTasks.length)} />
        <Metric label="Completed" value={String(completed)} />
        <Metric label="Overdue" value={String(overdue.length)} />
        <Metric label="High/Critical" value={String(highPriority.length)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {demoTasks.map((task) => (
          <Card key={task.title}>
            <CardHeader
              title={task.title}
              description={`${task.owner} - due ${task.dueDate}`}
              action={
                <Badge tone={statusTone(task.status)}>
                  {task.status.replaceAll("_", " ")}
                </Badge>
              }
            />
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <Badge tone={task.priority === "critical" || task.priority === "high" ? "danger" : "info"}>
                  {task.priority}
                </Badge>
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${task.progress}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{task.progress}% complete</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Task Table View" description="The same data in a principal-friendly operating table." />
        <CardContent>
          <DataTable
            headers={["Task", "Owner", "Due", "Priority", "Status", "Progress"]}
            rows={demoTasks.map((task) => [
              task.title,
              task.owner,
              task.dueDate,
              task.priority,
              task.status.replaceAll("_", " "),
              `${task.progress}%`,
            ])}
          />
        </CardContent>
      </Card>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-3 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
