import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import {
  TimetableWorkspace,
  type StaffStatusForSubstitution,
  type SubstitutionItem,
  type TimetableClass,
  type TimetablePeriod,
  type TimetableProfile,
  type TimetableSubject,
} from "@/components/timetable/timetable-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RelatedRow<T> = T | T[] | null;

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher" | "management";
  school_id: string | null;
};

type PeriodRow = {
  id: string;
  class_section_id: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  day_of_week: string;
  period_number: number;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  class_sections?: RelatedRow<{ class_name: string | null; section: string | null }>;
  subjects?: RelatedRow<{ subject_name: string | null }>;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

type SubstitutionRow = {
  id: string;
  date: string;
  absent_teacher_id: string | null;
  original_period_id: string | null;
  substitute_teacher_id: string | null;
  class_section_id: string | null;
  subject_id: string | null;
  status: string | null;
  remarks: string | null;
  absent_teacher?: RelatedRow<{ full_name: string | null }>;
  substitute_teacher?: RelatedRow<{ full_name: string | null }>;
  class_sections?: RelatedRow<{ class_name: string | null; section: string | null }>;
  subjects?: RelatedRow<{ subject_name: string | null }>;
  timetable_periods?: RelatedRow<{ period_number: number | null }>;
};

function EmptyState({ message }: { message: string }) {
  return <p className="p-5 text-sm text-muted-foreground">{message}</p>;
}

export default async function TimetablePage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          title="Timetable"
          description="Connect Supabase to manage daily periods and substitutions."
        />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live timetable data is not available yet." />
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
          title="Timetable"
          description="Your timetable will appear after your profile is configured."
        />
        <Card>
          <CardHeader title="Profile setup needed" description="No institution is linked to this account yet." />
          <EmptyState message="Please contact the institution admin to complete your EduCommand profile." />
        </Card>
      </>
    );
  }

  const isLeader = profile.role === "principal" || profile.role === "coordinator";
  const today = new Date().toISOString().slice(0, 10);
  const todayDay = new Intl.DateTimeFormat("en", { weekday: "long" })
    .format(new Date(`${today}T00:00:00`))
    .toLowerCase();

  const periodsQuery = supabase
    .from("timetable_periods")
    .select(
      "id, class_section_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room, class_sections(class_name, section), subjects(subject_name), profiles(full_name)",
    )
    .eq("school_id", profile.school_id)
    .order("day_of_week", { ascending: true })
    .order("period_number", { ascending: true });

  const substitutionsQuery = supabase
    .from("substitutions")
    .select(
      "id, date, absent_teacher_id, original_period_id, substitute_teacher_id, class_section_id, subject_id, status, remarks, absent_teacher:profiles!substitutions_absent_teacher_id_fkey(full_name), substitute_teacher:profiles!substitutions_substitute_teacher_id_fkey(full_name), class_sections(class_name, section), subjects(subject_name), timetable_periods(period_number)",
    )
    .eq("school_id", profile.school_id)
    .order("date", { ascending: false })
    .limit(200);

  if (!isLeader) {
    periodsQuery.eq("teacher_id", profile.id);
    substitutionsQuery.eq("substitute_teacher_id", profile.id);
  }

  const [
    teachersResult,
    classesResult,
    subjectsResult,
    periodsResult,
    staffStatusResult,
    substitutionsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, department")
      .eq("school_id", profile.school_id)
      .eq("is_active", true)
      .in("role", ["teacher", "coordinator"])
      .order("full_name", { ascending: true }),
    supabase
      .from("class_sections")
      .select("id, class_name, section")
      .eq("school_id", profile.school_id)
      .order("class_name", { ascending: true }),
    supabase
      .from("subjects")
      .select("id, subject_name")
      .eq("school_id", profile.school_id)
      .order("subject_name", { ascending: true }),
    periodsQuery,
    supabase
      .from("staff_daily_status")
      .select("staff_id, status_date, status")
      .eq("school_id", profile.school_id)
      .order("status_date", { ascending: false })
      .limit(500),
    substitutionsQuery,
  ]);

  const teachers = (teachersResult.data ?? []) as TimetableProfile[];
  const classes = (classesResult.data ?? []) as TimetableClass[];
  const subjects = (subjectsResult.data ?? []) as TimetableSubject[];
  const periods = ((periodsResult.data ?? []) as unknown as PeriodRow[]).map(toPeriod);
  const staffStatuses = (staffStatusResult.data ?? []) as StaffStatusForSubstitution[];
  const substitutions = ((substitutionsResult.data ?? []) as unknown as SubstitutionRow[]).map(toSubstitution);

  return (
    <>
      <PageHeader
        title="Timetable"
        description={
          isLeader
            ? "Daily periods and simple substitution planning based on staff status."
            : "Your timetable periods and substitution duties."
        }
      />

      <TimetableWorkspace
        classes={classes}
        currentUserId={profile.id}
        isLeader={isLeader}
        periods={periods}
        schoolId={profile.school_id}
        staffStatuses={staffStatuses}
        subjects={subjects}
        substitutions={substitutions}
        teachers={teachers}
        today={today}
        todayDay={todayDay}
      />
    </>
  );
}

function toPeriod(row: PeriodRow): TimetablePeriod {
  return {
    id: row.id,
    class_section_id: row.class_section_id,
    subject_id: row.subject_id,
    teacher_id: row.teacher_id,
    day_of_week: row.day_of_week,
    period_number: row.period_number,
    start_time: row.start_time,
    end_time: row.end_time,
    room: row.room,
    className: classLabel(relatedOne(row.class_sections)),
    subjectName: relatedOne(row.subjects)?.subject_name ?? "Subject",
    teacherName: relatedOne(row.profiles)?.full_name ?? "Teacher",
  };
}

function toSubstitution(row: SubstitutionRow): SubstitutionItem {
  return {
    id: row.id,
    date: row.date,
    absent_teacher_id: row.absent_teacher_id,
    original_period_id: row.original_period_id,
    substitute_teacher_id: row.substitute_teacher_id,
    class_section_id: row.class_section_id,
    subject_id: row.subject_id,
    status: row.status,
    remarks: row.remarks,
    absentTeacherName: relatedOne(row.absent_teacher)?.full_name ?? "Absent teacher",
    substituteTeacherName: relatedOne(row.substitute_teacher)?.full_name ?? "Substitute teacher",
    className: classLabel(relatedOne(row.class_sections)),
    subjectName: relatedOne(row.subjects)?.subject_name ?? "Subject",
    periodNumber: relatedOne(row.timetable_periods)?.period_number ?? null,
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
