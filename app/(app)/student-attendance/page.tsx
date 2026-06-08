import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  StudentAttendanceBoard,
  type AttendanceRow,
  type AttendanceStatus,
  type AttendanceStudent,
} from "@/components/student-attendance/student-attendance-board";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RelatedRow<T> = T | T[] | null;

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher" | "management";
  school_id: string | null;
};

type ClassRow = {
  id: string;
  class_name: string;
  section: string | null;
};

type StudentRow = {
  id: string;
  full_name: string | null;
  admission_number: string | null;
  class_section_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  class_sections?: RelatedRow<{ class_name: string | null; section: string | null }>;
};

type AttendanceDbRow = {
  id: string;
  student_id: string;
  class_section_id: string | null;
  attendance_date: string;
  status: AttendanceStatus;
  remarks: string | null;
  students?: RelatedRow<{ full_name: string | null }>;
  class_sections?: RelatedRow<{ class_name: string | null; section: string | null }>;
};

function EmptyState({ message }: { message: string }) {
  return <p className="p-5 text-sm text-muted-foreground">{message}</p>;
}

export default async function StudentAttendancePage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          title="Student Attendance"
          description="Connect Supabase to use attendance intelligence."
        />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live attendance data is not available yet." />
          <EmptyState message="Add Supabase environment variables and sign in to use this module." />
        </Card>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, school_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.school_id) {
    return (
      <>
        <PageHeader
          title="Student Attendance"
          description="Your attendance board will appear after your profile is configured."
        />
        <Card>
          <CardHeader title="Profile setup needed" description="No institution is linked to this account yet." />
          <EmptyState message="Please contact the institution admin to complete your EduCommand profile." />
        </Card>
      </>
    );
  }

  const isLeader = profile.role === "principal" || profile.role === "coordinator";

  let assignedClassIds: string[] | null = null;
  if (!isLeader) {
    const { data: assignments } = await supabase
      .from("teacher_assignments")
      .select("class_section_id")
      .eq("school_id", profile.school_id)
      .eq("teacher_id", profile.id);
    assignedClassIds = Array.from(
      new Set((assignments ?? []).map((row) => row.class_section_id).filter(Boolean) as string[]),
    );
  }

  if (assignedClassIds && assignedClassIds.length === 0) {
    return (
      <>
        <PageHeader
          title="Student Attendance"
          description="Attendance marking is available for assigned classes."
        />
        <Card>
          <CardHeader title="No assigned classes" description="No class assignment was found for your teacher profile." />
          <CardContent>
            <p className="text-sm text-muted-foreground">Please contact the institution admin to assign a class.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  const classesQuery = supabase
    .from("class_sections")
    .select("id, class_name, section")
    .eq("school_id", profile.school_id)
    .order("class_name", { ascending: true });
  const studentsQuery = supabase
    .from("students")
    .select("id, full_name, admission_number, class_section_id, parent_name, parent_phone, class_sections(class_name, section)")
    .eq("school_id", profile.school_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  const attendanceQuery = supabase
    .from("student_daily_attendance")
    .select("id, student_id, class_section_id, attendance_date, status, remarks, students(full_name), class_sections(class_name, section)")
    .eq("school_id", profile.school_id)
    .order("attendance_date", { ascending: false })
    .limit(1000);

  if (assignedClassIds) {
    classesQuery.in("id", assignedClassIds);
    studentsQuery.in("class_section_id", assignedClassIds);
    attendanceQuery.in("class_section_id", assignedClassIds);
  }

  const [{ data: classRows }, { data: studentRows }, { data: attendanceRows }] = await Promise.all([
    classesQuery,
    studentsQuery,
    attendanceQuery,
  ]);

  const classes = ((classRows ?? []) as ClassRow[]).map((row) => ({
    id: row.id,
    label: classLabel(row),
  }));
  const students = ((studentRows ?? []) as unknown as StudentRow[]).map(toStudent);
  const attendance = ((attendanceRows ?? []) as unknown as AttendanceDbRow[]).map(toAttendance);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Student Attendance"
        description={
          isLeader
            ? "Command-level attendance intelligence, low attendance classes and chronic absentee alerts."
            : "Mark attendance for your assigned classes and watch early warning signals."
        }
      />

      {classes.length > 0 ? (
        <StudentAttendanceBoard
          attendance={attendance}
          classes={classes}
          currentUserId={profile.id}
          schoolId={profile.school_id}
          students={students}
          today={today}
        />
      ) : (
        <Card>
          <CardHeader title="No classes found" description="Class sections are needed before attendance can be marked." />
          <CardContent>
            <p className="text-sm text-muted-foreground">Add class sections and students before using this board.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function toStudent(row: StudentRow): AttendanceStudent {
  return {
    id: row.id,
    full_name: row.full_name,
    admission_number: row.admission_number,
    class_section_id: row.class_section_id,
    parent_name: row.parent_name,
    parent_phone: row.parent_phone,
    className: classLabel(relatedOne(row.class_sections)),
  };
}

function toAttendance(row: AttendanceDbRow): AttendanceRow {
  return {
    id: row.id,
    student_id: row.student_id,
    class_section_id: row.class_section_id,
    attendance_date: row.attendance_date,
    status: row.status,
    remarks: row.remarks,
    studentName: relatedOne(row.students)?.full_name ?? "Student",
    className: classLabel(relatedOne(row.class_sections)),
  };
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}

function classLabel(row: { class_name: string | null; section: string | null } | null) {
  if (!row?.class_name) return "Class";
  return [row.class_name, row.section].filter(Boolean).join("");
}
