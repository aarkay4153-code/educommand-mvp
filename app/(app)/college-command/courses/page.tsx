import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { RiskBadge } from "@/components/college/risk-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { collegeCourses } from "@/lib/college-mode-data";

export default function CollegeCoursesPage() {
  return (
    <>
      <PageHeader
        title="College Courses"
        description="Open a course dashboard for B.Tech, MBA, Diploma or other programmes."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {collegeCourses.map((course) => (
          <Card key={course.id}>
            <CardHeader
              title={course.course}
              description={`${course.departments} departments, ${course.batches} active batches`}
              action={<RiskBadge risk={course.alert} />}
            />
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <CourseMetric label="Students" value={String(course.students)} />
                <CourseMetric label="Faculty" value={String(course.faculty)} />
                <CourseMetric label="Syllabus" value={`${course.syllabus}%`} />
                <CourseMetric label="Final exams" value={course.finalExam} />
                <CourseMetric label="Fees pending" value={course.feePending} />
                <CourseMetric label="Placement/internship" value={course.placement} />
              </dl>
              <Link
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                href={`/college-command/courses/${course.id}`}
              >
                Open dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Course Register" description="Summary list for quick management review." />
        <CardContent>
          <DataTable
            headers={["Course", "Departments", "Batches", "Students", "Faculty", "Syllabus", "Attendance Risk", "Alert"]}
            rows={collegeCourses.map((course) => [
              course.course,
              String(course.departments),
              String(course.batches),
              String(course.students),
              String(course.faculty),
              `${course.syllabus}%`,
              course.attendanceRisk,
              <RiskBadge key={`${course.id}-risk`} risk={course.alert} />,
            ])}
          />
        </CardContent>
      </Card>
    </>
  );
}

function CourseMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
