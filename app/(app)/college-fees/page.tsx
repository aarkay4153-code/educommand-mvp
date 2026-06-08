import { PageHeader } from "@/components/app/page-header";
import { MetricGrid } from "@/components/college/metric-grid";
import { RiskBadge } from "@/components/college/risk-badge";
import { PrintButton } from "@/components/reports/print-button";
import { CopyMessageButton } from "@/components/workflow/copy-message-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { feeCourseRows, feeOverview, feeRows } from "@/lib/college-mode-data";

export default function CollegeFeesPage() {
  return (
    <>
      <PageHeader
        title="Fees Pending"
        description="Fee visibility and follow-up dashboard for College Mode. This is not an accounting ledger or payment gateway."
        action={<PrintButton />}
      />

      <section className="print-document">
        <div className="hidden print:block">
          <h1 className="print-document-title">EduCommand Fee Pending Report</h1>
          <p className="print-document-meta">Generated from College Mode sample command data</p>
        </div>

        <MetricGrid metrics={feeOverview} />

        <Card className="mt-6">
          <CardHeader title="Course-wise Fee Pending" description="Course, department and batch-level pending fee risk." />
          <CardContent>
            <DataTable
              headers={["Course", "Department", "Batch", "Students", "Pending", "Overdue", "High-risk Students", "Hall Ticket Risk"]}
              rows={feeCourseRows.map((row) => [
                row.course,
                row.department,
                row.batch,
                String(row.students),
                row.pending,
                row.overdue,
                String(row.highRisk),
                String(row.hallTicketRisk),
              ])}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader
            title="Student Fee Pending Table"
            description="Filter placeholders: course, department, batch, fee category, status, overdue, scholarship and concession."
          />
          <CardContent>
            <DataTable
              headers={["Student", "Admission No.", "Course", "Department", "Batch", "Category", "Total", "Paid", "Pending", "Due Date", "Status", "Follow-up"]}
              rows={feeRows.map((row) => [
                row.student,
                row.admission,
                row.course,
                row.department,
                row.batch,
                row.category,
                row.total,
                row.paid,
                row.pending,
                row.due,
                <RiskBadge key={`${row.admission}-status`} risk={row.status === "overdue" ? "red" : "amber"} label={row.status.replaceAll("_", " ")} />,
                row.followup,
              ])}
            />
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader title="Follow-up Tracker" description="Record follow-up mode, notes and next follow-up date in the live database workflow." />
            <CardContent className="space-y-3">
              {feeRows.map((row) => (
                <div className="rounded-md border bg-background p-3" key={row.admission}>
                  <p className="font-medium">{row.student} - {row.pending} pending</p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.followup}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Hall Ticket / Exam Block Risk" description="Students whose final exam access may be affected by overdue fees." />
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <RiskTile label="Hall ticket block risk" value="32" risk="red" />
                <RiskTile label="Final exam within 30 days" value="5 exams" risk="amber" />
                <RiskTile label="Scholarship pending" value="36" risk="amber" />
                <RiskTile label="Concession pending" value="21" risk="amber" />
              </div>
              <div className="rounded-md border bg-background p-4">
                <p className="text-sm font-medium">Copyable reminder</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Dear Parent/Student, your fee payment of Rs [amount] is pending. Kindly clear it before [date] to avoid administrative inconvenience.
                </p>
                <div className="mt-3">
                  <CopyMessageButton message="Dear Parent/Student, your fee payment of Rs [amount] is pending. Kindly clear it before [date] to avoid administrative inconvenience." />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

function RiskTile({ label, risk, value }: { label: string; risk: "red" | "amber"; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <RiskBadge risk={risk} />
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}
