import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { CollegeCommandDashboard } from "@/components/college/college-command-dashboard";
import { RiskBadge } from "@/components/college/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import {
  collegeAlerts,
  collegeDepartments,
  courseDetails,
  feeOverview,
  finalExamOverview,
} from "@/lib/college-mode-data";

export default function CollegeModeDemoPage() {
  return (
    <>
      <PageHeader
        title="College Mode Dashboard"
        description="Sample multi-course command board for directors, principals, HODs, TPOs, faculty and management."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="info">Demo Mode - sample data only</Badge>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
              href="/demo/school-dashboard"
            >
              View School Demo
            </Link>
          </div>
        }
      />

      <CollegeCommandDashboard />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <CoursePreview courseId="btech" title="B.Tech Dashboard Preview" />
        <CoursePreview courseId="mba" title="MBA Dashboard Preview" />
        <CoursePreview courseId="diploma" title="Diploma Dashboard Preview" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Final Exam Readiness" description="Internal marks, practicals, hall tickets and invigilation readiness." />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {finalExamOverview.slice(0, 8).map((item) => (
              <MiniMetric key={item.label} label={item.label} value={item.value} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Fee Pending Summary" description="Visibility dashboard only; no payment gateway or accounting ledger." />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {feeOverview.slice(0, 8).map((item) => (
              <MiniMetric key={item.label} label={item.label} value={item.value} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Placement / Internship Snapshot" description="Programme-level readiness for final-year and internship batches." />
          <CardContent>
            <DataTable
              headers={["Course", "Department", "Placement / Internship", "Students", "Risk"]}
              rows={collegeDepartments.slice(0, 6).map((department) => [
                department.course,
                department.department,
                department.placement,
                String(department.students),
                <RiskBadge key={`${department.department}-placement`} risk={department.risk} />,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Accreditation Readiness" description="Sample NAAC/NBA/AICTE-style evidence signals." />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <MiniMetric label="NAAC readiness" value="64%" />
            <MiniMetric label="NBA readiness" value="58%" />
            <MiniMetric label="AICTE documents" value="72%" />
            <MiniMetric label="Evidence pending" value="31" />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Critical Alerts" description="A director sees summarized risks first, then drills down only when needed." />
        <CardContent className="grid gap-3 md:grid-cols-2">
          {collegeAlerts.map((alert) => (
            <div className="rounded-md border bg-background p-3" key={alert.title}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{alert.title}</p>
                <RiskBadge risk={alert.severity} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href="/college-command">
          Open College Command
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground" href="/college-final-exams">
          Open Final Exams
        </Link>
        <Link className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground" href="/college-fees">
          Open Fees Pending
        </Link>
      </div>
    </>
  );
}

function CoursePreview({ courseId, title }: { courseId: string; title: string }) {
  const detail = courseDetails[courseId];

  return (
    <Card>
      <CardHeader title={title} description={detail.title} />
      <CardContent className="space-y-3">
        {detail.panels.map((panel) => (
          <div className="rounded-md border bg-background p-3" key={panel.title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{panel.title}</p>
                <p className="mt-2 text-xl font-semibold">{panel.value}</p>
              </div>
              <RiskBadge risk={panel.risk} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{panel.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
