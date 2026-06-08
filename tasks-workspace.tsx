import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { demoSyllabus } from "@/lib/demo-data";
import { statusTone } from "@/lib/demo-helpers";

export default function DemoSyllabusPage() {
  const averageProgress = Math.round(
    demoSyllabus.reduce((sum, row) => sum + row.progress, 0) / demoSyllabus.length,
  );
  const behindClasses = demoSyllabus.filter((row) => row.status === "behind");
  const submittedTeachers = new Set(demoSyllabus.map((row) => row.teacher));

  return (
    <>
      <PageHeader
        title="Syllabus Tracker"
        description="Demo view of weekly coverage, teacher updates and classes that need attention."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Average completion" value={`${averageProgress}%`} />
        <Metric label="Teachers submitted" value={`${submittedTeachers.size}/8`} />
        <Metric label="Classes behind" value={String(behindClasses.length)} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Weekly Syllabus Updates" description="Sample submissions for the current week." />
        <CardContent>
          <DataTable
            headers={["Class", "Subject", "Teacher", "Week", "Progress", "Status", "Next target"]}
            rows={demoSyllabus.map((row) => [
              row.className,
              row.subject,
              row.teacher,
              row.week,
              `${row.progress}%`,
              <Badge key={`${row.className}-${row.subject}`} tone={statusTone(row.status)}>
                {row.status.replaceAll("_", " ")}
              </Badge>,
              row.next,
            ])}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Teachers Pending This Week" description="Demo reminder list for weekly compliance." />
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {["Nikhil Verma", "Lakshmi Devi"].map((teacher) => (
            <div className="rounded-md border bg-background p-3" key={teacher}>
              <p className="font-medium">{teacher}</p>
              <p className="mt-1 text-sm text-muted-foreground">Weekly syllabus update pending</p>
            </div>
          ))}
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
