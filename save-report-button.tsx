import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { demoAttention, demoEvents, demoStats, demoSyllabus, demoTasks } from "@/lib/demo-data";
import { statusTone } from "@/lib/demo-helpers";

export default function DemoDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A principal-level view of syllabus coverage, task delays, event readiness and weekly attention items."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {demoStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Today's Attention" description="Items the principal should review first." />
          <CardContent className="space-y-3">
            {demoAttention.map((item) => (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" key={item}>
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Recent Syllabus Updates" description="Latest weekly teacher submissions." />
          <CardContent>
            <DataTable
              headers={["Class", "Subject", "Teacher", "Progress", "Status"]}
              rows={demoSyllabus.slice(0, 4).map((row) => [
                row.className,
                row.subject,
                row.teacher,
                `${row.progress}%`,
                <Badge key={row.className} tone={statusTone(row.status)}>
                  {row.status.replaceAll("_", " ")}
                </Badge>,
              ])}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Recent Task Updates" description="Delegated work with ownership and status." />
          <CardContent>
            <DataTable
              headers={["Task", "Owner", "Due", "Priority", "Status"]}
              rows={demoTasks.slice(0, 4).map((task) => [
                task.title,
                task.owner,
                task.dueDate,
                task.priority,
                <Badge key={task.title} tone={statusTone(task.status)}>
                  {task.status.replaceAll("_", " ")}
                </Badge>,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Upcoming Events" description="Next school events and readiness status." />
          <CardContent>
            <DataTable
              headers={["Event", "Date", "Intensity", "Status", "Readiness"]}
              rows={demoEvents.slice(0, 4).map((event) => [
                event.name,
                event.date,
                event.intensity,
                <Badge key={event.name} tone={statusTone(event.status)}>
                  {event.status.replaceAll("_", " ")}
                </Badge>,
                `${event.readiness}%`,
              ])}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
