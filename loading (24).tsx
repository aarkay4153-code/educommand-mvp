import { PageHeader } from "@/components/app/page-header";
import { MetricGrid } from "@/components/college/metric-grid";
import { RiskBadge } from "@/components/college/risk-badge";
import { PrintButton } from "@/components/reports/print-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { collegeAlerts, examSubjectRows, finalExamOverview, finalExamRows } from "@/lib/college-mode-data";

export default function CollegeFinalExamsPage() {
  const examAlerts = collegeAlerts.filter((alert) =>
    ["exam", "marks", "practical", "readiness"].some((keyword) => alert.title.toLowerCase().includes(keyword) || alert.message.toLowerCase().includes(keyword)),
  );

  return (
    <>
      <PageHeader
        title="Final Exams"
        description="Course-wise, department-wise and semester-wise final exam readiness for College Mode."
        action={<PrintButton />}
      />

      <section className="print-document">
        <div className="hidden print:block">
          <h1 className="print-document-title">EduCommand Final Exam Readiness Report</h1>
          <p className="print-document-meta">Generated from College Mode sample command data</p>
        </div>

        <MetricGrid metrics={finalExamOverview} />

        <Card className="mt-6">
          <CardHeader title="Course-wise Final Exam Status" description="Timetable, internal marks, practicals, hall ticket and risk status." />
          <CardContent>
            <DataTable
              headers={["Course", "Department", "Semester", "Exam Dates", "Timetable", "Internal Marks", "Practical/Project", "Hall Ticket", "Risk"]}
              rows={finalExamRows.map((exam) => [
                exam.course,
                exam.department,
                exam.semester,
                exam.dates,
                exam.timetable,
                exam.internal,
                exam.practical,
                exam.hallTicket,
                <RiskBadge key={`${exam.course}-${exam.department}`} risk={exam.risk} />,
              ])}
            />
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader title="Subject-wise Exam Tracker" description="Question papers, seating, invigilation and marks submission." />
            <CardContent>
              <DataTable
                headers={["Subject", "Faculty", "Exam Date", "Question Paper", "Seating", "Invigilation", "Marks", "Risk"]}
                rows={examSubjectRows.map((subject) => [
                  subject.subject,
                  subject.faculty,
                  subject.date,
                  subject.paper,
                  subject.seating,
                  subject.invigilation,
                  subject.marks,
                  <RiskBadge key={subject.subject} risk={subject.risk} />,
                ])}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Student Exam Eligibility Risk" description="Summary only; student-level details stay inside exam panels." />
            <CardContent className="space-y-3">
              <Eligibility label="Low attendance risk" value="55 students" tone="warning" />
              <Eligibility label="Fee pending / hall ticket block risk" value="32 students" tone="danger" />
              <Eligibility label="Internal marks pending" value="7 subjects" tone="warning" />
              <Eligibility label="Practical/project pending" value="4 batches" tone="danger" />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader title="Final Exam Alerts" description="Generated from exam readiness, internal marks, practicals, hall tickets and scheduling risk." />
          <CardContent className="grid gap-3 md:grid-cols-2">
            {(examAlerts.length ? examAlerts : collegeAlerts.slice(0, 4)).map((alert) => (
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
      </section>
    </>
  );
}

function Eligibility({ label, value, tone }: { label: string; value: string; tone: "warning" | "danger" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3">
      <p className="text-sm font-medium">{label}</p>
      <span className={tone === "danger" ? "text-sm font-semibold text-rose-600 dark:text-rose-300" : "text-sm font-semibold text-amber-600 dark:text-amber-300"}>
        {value}
      </span>
    </div>
  );
}
