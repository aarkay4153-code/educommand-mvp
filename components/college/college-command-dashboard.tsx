import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RiskBadge } from "@/components/college/risk-badge";
import { MetricGrid } from "@/components/college/metric-grid";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { generateCollegeCourseAlerts } from "@/lib/college-alerts";
import {
  collegeCommandSummary,
  collegeCourses,
  collegeDepartments,
  semesterProgress,
} from "@/lib/college-mode-data";

export function CollegeCommandDashboard() {
  const generatedAlerts = generateCollegeCourseAlerts();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Overall College Command Board</h2>
        <MetricGrid metrics={collegeCommandSummary} />
      </section>

      <Card>
        <CardHeader
          title="Course-wise Snapshot"
          description="Management-level view across B.Tech, MBA, Diploma and other programmes."
          action={
            <Link className="inline-flex items-center text-sm font-medium text-primary" href="/college-command/courses">
              Open courses
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          }
        />
        <CardContent>
          <DataTable
            headers={["Course", "Departments", "Batches", "Students", "Syllabus", "Attendance Risk", "Final Exams", "Fees", "Placement", "Alert"]}
            rows={collegeCourses.map((course) => [
              <Link className="text-primary underline-offset-4 hover:underline" href={`/college-command/courses/${course.id}`} key={course.id}>
                {course.course}
              </Link>,
              String(course.departments),
              String(course.batches),
              String(course.students),
              `${course.syllabus}%`,
              course.attendanceRisk,
              course.finalExam,
              course.feePending,
              course.placement,
              <RiskBadge key={`${course.id}-risk`} risk={course.alert} />,
            ])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Department-wise Snapshot" description="HOD ownership, academic progress, labs, placements, fee risk and alerts." />
        <CardContent>
          <DataTable
            headers={["Course", "Department", "HOD", "Students", "Faculty", "Syllabus", "Lab", "Internal", "Final Exam", "Placement", "Fee Pending", "Risk"]}
            rows={collegeDepartments.map((department) => [
              department.course,
              department.department,
              department.hod,
              String(department.students),
              String(department.faculty),
              `${department.syllabus}%`,
              department.lab ? `${department.lab}%` : "NA",
              department.internal,
              department.finalExam,
              department.placement,
              String(department.feePending),
              <RiskBadge key={`${department.course}-${department.department}`} risk={department.risk} />,
            ])}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Semester/Year-wise Academic Progress" description="Batch progress, lab completion, internal assessment and faculty update compliance." />
          <CardContent>
            <DataTable
              headers={["Batch", "Semester/Year", "Syllabus", "Lab", "Internal", "Attendance Risk", "Revision", "Faculty Updates"]}
              rows={semesterProgress.map((batch) => [
                batch.batch,
                batch.semester,
                `${batch.syllabus}%`,
                batch.lab ? `${batch.lab}%` : "NA",
                batch.internal,
                batch.attendanceRisk,
                batch.revision,
                batch.facultyCompliance,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Today's Critical College Attention" description="Top issues for director, principal and HOD follow-up." />
          <CardContent className="space-y-3">
            {generatedAlerts.map((alert) => (
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
      </div>
    </div>
  );
}
