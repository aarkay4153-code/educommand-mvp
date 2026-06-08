import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { AccessDenied } from "@/components/app/access-denied";
import {
  TeacherInputsWorkspace,
  type BoardInputRow,
  type BoardSubjectOption,
} from "@/components/board-command/teacher-inputs-workspace";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RelatedRow<T> = T | T[] | null;
type BoardClass = "class_10" | "class_12";

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher" | "management";
  school_id: string | null;
};

type SubjectRow = {
  id: string;
  board_class: BoardClass;
  subject_name: string;
  teacher_id: string | null;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

type DailyInputRow = {
  id: string;
  board_class: BoardClass | null;
  input_date: string | null;
  topic_taught_today: string | null;
  urgent_concern: string | null;
  board_subjects?: RelatedRow<{ subject_name: string | null }>;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

type WeeklyInputRow = {
  id: string;
  board_class: BoardClass | null;
  week_start_date: string | null;
  week_end_date: string | null;
  test_title: string | null;
  test_marks_summary: { summary?: string } | null;
  main_weak_chapters: string | null;
  board_subjects?: RelatedRow<{ subject_name: string | null }>;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

type MonthlyInputRow = {
  id: string;
  board_class: BoardClass | null;
  month: string | null;
  syllabus_completion_percentage: number | null;
  revision_status: string | null;
  top_academic_risks: string | null;
  board_subjects?: RelatedRow<{ subject_name: string | null }>;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

export default async function BoardTeacherInputsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Board Inputs" description="Connect Supabase to submit board inputs." />
        <Card>
          <CardHeader title="Supabase setup needed" description="Board inputs need the live database." />
          <CardContent className="text-sm text-muted-foreground">
            Add Supabase environment variables and run the Board Command migration.
          </CardContent>
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
        <PageHeader title="Board Inputs" description="Your profile must be linked to an institution." />
        <Card>
          <CardHeader title="Profile setup needed" description="No school is linked to this account yet." />
          <CardContent className="text-sm text-muted-foreground">
            Please contact the institution admin to complete your EduCommand profile.
          </CardContent>
        </Card>
      </>
    );
  }

  if (profile.role === "management") {
    return (
      <>
        <PageHeader title="Board Inputs" description="Teacher inputs are not available to management users." />
        <AccessDenied />
      </>
    );
  }

  const isTeacher = profile.role === "teacher";
  const schoolId = profile.school_id;

  const subjectsQuery = supabase
    .from("board_subjects")
    .select("id, board_class, subject_name, teacher_id, profiles(full_name)")
    .eq("school_id", schoolId)
    .order("board_class", { ascending: true })
    .order("subject_name", { ascending: true });

  const dailyQuery = supabase
    .from("board_daily_inputs")
    .select("id, board_class, input_date, topic_taught_today, urgent_concern, board_subjects(subject_name), profiles(full_name)")
    .eq("school_id", schoolId)
    .order("input_date", { ascending: false })
    .limit(30);

  const weeklyQuery = supabase
    .from("board_weekly_inputs")
    .select("id, board_class, week_start_date, week_end_date, test_title, test_marks_summary, main_weak_chapters, board_subjects(subject_name), profiles(full_name)")
    .eq("school_id", schoolId)
    .order("week_start_date", { ascending: false })
    .limit(30);

  const monthlyQuery = supabase
    .from("board_monthly_inputs")
    .select("id, board_class, month, syllabus_completion_percentage, revision_status, top_academic_risks, board_subjects(subject_name), profiles(full_name)")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (isTeacher) {
    subjectsQuery.eq("teacher_id", profile.id);
    dailyQuery.eq("teacher_id", profile.id);
    weeklyQuery.eq("teacher_id", profile.id);
    monthlyQuery.eq("teacher_id", profile.id);
  }

  const [subjectsResult, dailyResult, weeklyResult, monthlyResult] = await Promise.all([
    subjectsQuery,
    dailyQuery,
    weeklyQuery,
    monthlyQuery,
  ]);

  const subjects = ((subjectsResult.data ?? []) as unknown as SubjectRow[]).map(toSubjectOption);

  return (
    <>
      <PageHeader
        title="Board Inputs"
        description={
          isTeacher
            ? "Submit fast daily, weekly, and monthly board readiness updates."
            : "Review teacher-submitted Board Command inputs without editing them."
        }
        action={
          !isTeacher ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
              href="/board-command"
            >
              Back to Board Command
            </Link>
          ) : undefined
        }
      />

      <TeacherInputsWorkspace
        currentUserId={profile.id}
        dailyInputs={((dailyResult.data ?? []) as unknown as DailyInputRow[]).map(toDailyInput)}
        isTeacher={isTeacher}
        monthlyInputs={((monthlyResult.data ?? []) as unknown as MonthlyInputRow[]).map(toMonthlyInput)}
        schoolId={schoolId}
        subjects={subjects}
        weeklyInputs={((weeklyResult.data ?? []) as unknown as WeeklyInputRow[]).map(toWeeklyInput)}
      />
    </>
  );
}

function toSubjectOption(row: SubjectRow): BoardSubjectOption {
  return {
    id: row.id,
    board_class: row.board_class,
    subject_name: row.subject_name,
    teacher_id: row.teacher_id,
    teacherName: relatedOne(row.profiles)?.full_name ?? "Unassigned",
  };
}

function toDailyInput(row: DailyInputRow): BoardInputRow {
  return {
    id: row.id,
    board_class: row.board_class,
    subjectName: relatedOne(row.board_subjects)?.subject_name ?? "Subject",
    teacherName: relatedOne(row.profiles)?.full_name ?? "Teacher",
    dateLabel: formatDate(row.input_date),
    summary: row.urgent_concern || row.topic_taught_today || "Daily input submitted",
    status: "Daily",
  };
}

function toWeeklyInput(row: WeeklyInputRow): BoardInputRow {
  return {
    id: row.id,
    board_class: row.board_class,
    subjectName: relatedOne(row.board_subjects)?.subject_name ?? "Subject",
    teacherName: relatedOne(row.profiles)?.full_name ?? "Teacher",
    dateLabel: `${formatDate(row.week_start_date)} - ${formatDate(row.week_end_date)}`,
    summary: row.main_weak_chapters || row.test_marks_summary?.summary || row.test_title || "Weekly input submitted",
    status: "Weekly",
  };
}

function toMonthlyInput(row: MonthlyInputRow): BoardInputRow {
  return {
    id: row.id,
    board_class: row.board_class,
    subjectName: relatedOne(row.board_subjects)?.subject_name ?? "Subject",
    teacherName: relatedOne(row.profiles)?.full_name ?? "Teacher",
    dateLabel: row.month || "Month not set",
    summary: row.top_academic_risks || `${row.syllabus_completion_percentage ?? 0}% syllabus, ${formatStatus(row.revision_status)}`,
    status: "Monthly",
  };
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function formatStatus(status: string | null) {
  return status ? status.replaceAll("_", " ") : "revision not set";
}
