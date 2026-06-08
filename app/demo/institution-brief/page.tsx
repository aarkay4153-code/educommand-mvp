import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { demoAttention, demoEvents, demoInstitution, demoSchool, demoStats, demoTasks } from "@/lib/demo-data";

export default function DemoInstitutionBriefPage() {
  const eventsAtRisk = demoEvents.filter((event) => event.status === "at_risk" || event.status === "delayed");
  const overdueTasks = demoTasks.filter((task) => task.status === "delayed");

  return (
    <>
      <PageHeader
        title="Institution Brief"
        description="A sample printable brief for visitors, management review or inspection readiness."
      />

      <Card>
        <CardHeader title="Basic Institution Profile" description="Demo profile used for sales presentations." />
        <CardContent>
          <DataTable
            headers={["Field", "Details"]}
            rows={[
              ["Name", demoSchool.name],
              ["Address", demoSchool.address],
              ["City / State", `${demoSchool.city}, ${demoSchool.state}`],
              ["Board", demoSchool.board],
              ["Established year", String(demoSchool.establishedYear)],
              ["Contact", `${demoSchool.contactEmail} - ${demoSchool.contactPhone}`],
              ["Website", demoSchool.website],
            ]}
          />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Academic Snapshot" />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {demoStats.slice(0, 3).map((stat) => (
              <div className="rounded-md border bg-background p-3" key={stat.label}>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </div>
            ))}
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs text-muted-foreground">Board/exam class status</p>
              <p className="mt-2 text-sm font-medium">Placeholder for next phase</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Staff and Student Snapshot" />
          <CardContent>
            <DataTable
              headers={["Metric", "Value"]}
              rows={[
                ["Total students", String(demoInstitution.totalStudents)],
                ["Total teachers", String(demoInstitution.totalTeachers)],
                ["Total admin staff", String(demoInstitution.totalAdminStaff)],
                ["Total classes", String(demoInstitution.totalClasses)],
                ["Active coordinators", "4"],
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Events Snapshot" />
          <CardContent>
            <DataTable
              headers={["Metric", "Value"]}
              rows={[
                ["Upcoming events", String(demoEvents.length)],
                ["High intensity events", String(demoEvents.filter((event) => event.intensity === "high").length)],
                ["Events at risk", String(eventsAtRisk.length)],
                ["Recently completed events", "1"],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Task and Delay Snapshot" />
          <CardContent>
            <DataTable
              headers={["Metric", "Value"]}
              rows={[
                ["Total active tasks", String(demoTasks.filter((task) => task.status !== "completed").length)],
                ["Overdue tasks", String(overdueTasks.length)],
                ["Critical tasks", String(demoTasks.filter((task) => task.priority === "critical").length)],
                ["Pending reports", "2"],
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Infrastructure and Achievements" />
        <CardContent className="grid gap-4 xl:grid-cols-2">
          <LongInfo label="Infrastructure" value={demoInstitution.infrastructure} />
          <LongInfo label="Achievements" value={demoInstitution.achievements} />
          <LongInfo label="Special programs" value={demoInstitution.specialPrograms} />
          <LongInfo label="Vision and mission" value={`${demoInstitution.vision} ${demoInstitution.mission}`} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Critical Alerts" />
        <CardContent className="space-y-3">
          {demoAttention.slice(0, 3).map((alert) => (
            <div className="flex items-start justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950" key={alert}>
              <p className="text-sm font-medium text-rose-900 dark:text-rose-200">{alert}</p>
              <Badge tone="danger">Alert</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function LongInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}
