import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { demoEvents, demoMilestones } from "@/lib/demo-data";
import { statusTone } from "@/lib/demo-helpers";

export default function DemoCalendarPage() {
  return (
    <>
      <PageHeader
        title="Action Calendar"
        description="Demo view of school events, intensity, readiness and milestone ownership."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {demoEvents.map((event) => (
          <Card key={event.name}>
            <CardHeader
              title={event.name}
              description={`${event.date} - ${event.owner}`}
              action={<Badge tone={statusTone(event.status)}>{event.status.replaceAll("_", " ")}</Badge>}
            />
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Intensity</span>
                <Badge tone={event.intensity === "high" ? "danger" : event.intensity === "medium" ? "warning" : "info"}>
                  {event.intensity}
                </Badge>
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${event.readiness}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{event.readiness}% ready</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Event Milestones" description="Sample milestone list with owners and blockers." />
        <CardContent>
          <DataTable
            headers={["Event", "Milestone", "Owner", "Due", "Status"]}
            rows={demoMilestones.map((milestone) => [
              milestone.event,
              milestone.title,
              milestone.owner,
              milestone.dueDate,
              <Badge key={milestone.title} tone={statusTone(milestone.status)}>
                {milestone.status.replaceAll("_", " ")}
              </Badge>,
            ])}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Reminder Logic Preview" description="No real notifications are sent in demo mode." />
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Reminder title="Low intensity" text="3 days before, 1 day before, event day" />
          <Reminder title="Medium intensity" text="14, 7, 3 and 1 day before" />
          <Reminder title="High intensity" text="30, 21, 14, 7, 3 and 1 day before" />
        </CardContent>
      </Card>
    </>
  );
}

function Reminder({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
