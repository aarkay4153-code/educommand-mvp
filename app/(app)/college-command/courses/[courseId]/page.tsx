import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MetricGrid } from "@/components/college/metric-grid";
import { RiskBadge } from "@/components/college/risk-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import {
  collegeAlerts,
  collegeCourses,
  collegeDepartments,
  courseDetails,
  semesterProgress,
} from "@/lib/college-mode-data";

export default async function CollegeCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = collegeCourses.find((item) => item.id === courseId);
  const detail = courseDetails[courseId];

  if (!course || !detail) {
    notFound();
  }

  const departmentRows = collegeDepartments.filter((department) => department.course === course.course);
  const semesterRows = semesterProgress.filter((batch) => batch.batch.startsWith(course.course));

  return (
    <>
      <PageHeader
        title={detail.title}
        description={courseDescription(detail.type)}
        action={
          <Link className="inline-flex items-center text-sm font-medium text-primary" href="/college-command/courses">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to courses
          </Link>
        }
      />

      <MetricGrid
        metrics={[
          { label: "Students", value: String(course.students), detail: `${course.batches} active batches` },
          { label: "Faculty", value: String(course.faculty), detail: `${course.departments} departments or tracks` },
          { label: "Syllabus completion", value: `${course.syllabus}%`, detail: "Current semester average" },
          { label: "Final exam readiness", value: course.finalExam, detail: course.attendanceRisk },
        ]}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {detail.panels.map((panel) => (
          <Card key={panel.title}>
            <CardHeader title={panel.title} action={<RiskBadge risk={panel.risk} />} />
            <CardContent>
              <p className="text-3xl font-semibold">{panel.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{panel.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Department / Specialization Readiness" description="Course-level drill-down for HOD review." />
          <CardContent>
            <DataTable
              headers={["Department", "HOD", "Students", "Syllabus", "Lab/Practical", "Internal", "Final Exam", "Placement/Internship", "Alerts"]}
              rows={(departmentRows.length ? departmentRows : collegeDepartments.slice(0, 3)).map((department) => [
                department.department,
                department.hod,
                String(department.students),
                `${department.syllabus}%`,
                department.lab ? `${department.lab}%` : "NA",
                department.internal,
                department.finalExam,
                department.placement,
                <RiskBadge key={`${department.department}-risk`} risk={department.risk} />,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Critical Alerts" description="Student names stay hidden until an operational panel is opened." />
          <CardContent className="space-y-3">
            {collegeAlerts.slice(0, 4).map((alert) => (
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

      <Card className="mt-6">
        <CardHeader title="Semester / Year Progress" description="Academic progress, internal assessments, attendance risk and faculty compliance." />
        <CardContent>
          <DataTable
            headers={["Batch", "Semester/Year", "Syllabus", "Lab", "Internal", "Attendance Risk", "Revision", "Faculty Updates"]}
            rows={(semesterRows.length ? semesterRows : semesterProgress.slice(0, 3)).map((batch) => [
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
    </>
  );
}

function courseDescription(type: string) {
  if (type === "btech") {
    return "B.Tech view for departments, labs, internal exams, final exams, projects, internships, placements, fees and accreditation signals.";
  }

  if (type === "mba") {
    return "MBA view for semester progress, specializations, case studies, projects, internships, placements, fees and management alerts.";
  }

  if (type === "diploma") {
    return "Diploma view for workshop completion, practical readiness, industrial training, final exams, fees and attendance risk.";
  }

  return "Generic course dashboard for batch progress, syllabus, attendance, assessments, final exams, fees and reports.";
}
