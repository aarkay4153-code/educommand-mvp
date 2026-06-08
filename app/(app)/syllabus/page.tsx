import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import {
  SyllabusUpdateForm,
  type TeacherAssignmentOption,
} from "@/components/syllabus/syllabus-update-form";
import {
  SyllabusReview,
  type MissingTeacher,
  type SyllabusReviewUpdate,
} from "@/components/syllabus/syllabus-review";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RelatedRow<T> = T | T[] | null;

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher";
  school_id: string | null;
};

type AssignmentRow = {
  id: string;
  school_id: string;
  teacher_id: string;
  class_section_id: string;
  subject_id: string;
  class_sections?: RelatedRow<{ class_name: string | null; section: string | null }>;
  subjects?: RelatedRow<{ subject_name: string | null }>;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

type UpdateRow = {
  id: string;
  teacher_id: string | null;
  class_section_id: string | null;
  subject_id: string | null;
  week_start_date: string | null;
  week_end_date: string | null;
  planned_portion: string | null;
  completed_portion: string | null;
  completion_percentage: number | null;
  status: string | null;
  delay_reason: string | null;
  next_week_target: string | null;
  proof_url: string | null;
  submitted_at: string | null;
  profiles?: RelatedRow<{ full_name: string | null }>;
  class_sections?: RelatedRow<{ class_name: string | null; section: string | null }>;
  subjects?: RelatedRow<{ subject_name: string | null }>;
};

export default async function SyllabusPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          title="Syllabus Coverage"
          description="Connect Supabase to manage weekly syllabus progress."
        />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live syllabus data is not available yet." />
          <CardContent className="text-sm text-muted-foreground">
            Add Supabase environment variables and sign in to use this module.
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
        <PageHeader
          title="Syllabus Coverage"
          description="Your syllabus workspace will appear after your profile is configured."
        />
        <Card>
          <CardHeader title="Profile setup needed" description="No school is linked to this account yet." />
          <CardContent className="text-sm text-muted-foreground">
            Please contact the institution admin to complete your EduCommand profile.
          </CardContent>
        </Card>
      </>
    );
  }

  const isTeacher = profile.role === "teacher";
  const schoolId = profile.school_id;

  const assignmentsQuery = supabase
    .from("teacher_assignments")
    .select("id, school_id, teacher_id, class_section_id, subject_id, class_sections(class_name, section), subjects(subject_name), profiles(full_name)")
    .eq("school_id", schoolId);

  if (isTeacher) {
    assignmentsQuery.eq("teacher_id", profile.id);
  }

  const updatesQuery = supabase
    .from("syllabus_updates")
    .select(
      "id, teacher_id, class_section_id, subject_id, week_start_date, week_end_date, planned_portion, completed_portion, completion_percentage, status, delay_reason, next_week_target, proof_url, submitted_at, profiles(full_name), class_sections(class_name, section), subjects(subject_name)",
    )
    .eq("school_id", schoolId)
    .order("week_start_date", { ascending: false })
    .order("submitted_at", { ascending: false });

  if (isTeacher) {
    updatesQuery.eq("teacher_id", profile.id);
  }

  const [{ data: assignmentsData }, { data: updatesData }] = await Promise.all([
    assignmentsQuery,
    updatesQuery,
  ]);

  const assignments = ((assignmentsData ?? []) as unknown as AssignmentRow[]).map(toAssignmentOption);
  const updates = ((updatesData ?? []) as unknown as UpdateRow[]).map(toReviewUpdate);

  if (isTeacher) {
    return (
      <>
        <PageHeader
          title="Syllabus Coverage"
          description="Submit a quick weekly update for your assigned classes and subjects."
        />
        <div className="space-y-6">
          <SyllabusUpdateForm assignments={assignments} schoolId={schoolId} teacherId={profile.id} />
          <TeacherUpdatesTable updates={updates} />
        </div>
      </>
    );
  }

  const missingTeachers = getMissingTeachersThisWeek(
    (assignmentsData ?? []) as unknown as AssignmentRow[],
    (updatesData ?? []) as unknown as UpdateRow[],
  );

  return (
    <>
      <PageHeader
        title="Syllabus Coverage"
        description="Review all teacher syllabus updates, filter submissions, and identify missing weekly updates."
      />
      <SyllabusReview missingTeachers={missingTeachers} updates={updates} />
    </>
  );
}

function TeacherUpdatesTable({ updates }: { updates: SyllabusReviewUpdate[] }) {
  return (
    <Card>
      <CardHeader title="My Recent Updates" description="Your submitted syllabus progress records." />
      <CardContent className="p-0">
        {updates.length > 0 ? (
          <DataTable
              headers={["Class", "Subject", "Week", "Progress", "Status", "Proof"]}
            rows={updates.slice(0, 10).map((update) => [
              update.class_label,
              update.subject_name,
              formatWeek(update.week_start_date, update.week_end_date),
              <Badge key={`${update.id}-progress`} tone={progressTone(update.completion_percentage)}>
                {update.completion_percentage}%
              </Badge>,
              <Badge key={update.id} tone={statusTone(update.status)}>
                {update.status.replaceAll("_", " ")}
              </Badge>,
              update.proof_url ? "Uploaded" : "Pending",
            ])}
          />
        ) : (
          <div className="p-5 text-sm text-muted-foreground">
            No updates submitted yet. Add your first weekly syllabus update above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function toAssignmentOption(row: AssignmentRow): TeacherAssignmentOption {
  const classSection = relatedOne(row.class_sections);
  const subject = relatedOne(row.subjects);

  return {
    id: row.id,
    school_id: row.school_id,
    teacher_id: row.teacher_id,
    class_section_id: row.class_section_id,
    subject_id: row.subject_id,
    class_name: classSection?.class_name ?? "Class",
    section: classSection?.section ?? null,
    subject_name: subject?.subject_name ?? "Subject",
  };
}

function toReviewUpdate(row: UpdateRow): SyllabusReviewUpdate {
  const teacher = relatedOne(row.profiles);
  const classSection = relatedOne(row.class_sections);
  const subject = relatedOne(row.subjects);

  return {
    id: row.id,
    teacher_id: row.teacher_id,
    class_section_id: row.class_section_id,
    subject_id: row.subject_id,
    teacher_name: teacher?.full_name ?? "Unassigned",
    class_label: classLabel(classSection),
    subject_name: subject?.subject_name ?? "Subject",
    week_start_date: row.week_start_date,
    week_end_date: row.week_end_date,
    planned_portion: row.planned_portion,
    completed_portion: row.completed_portion,
    completion_percentage: row.completion_percentage ?? 0,
    status: row.status ?? "not_started",
    delay_reason: row.delay_reason,
    next_week_target: row.next_week_target,
    proof_url: row.proof_url,
    submitted_at: row.submitted_at,
  };
}

function getMissingTeachersThisWeek(assignments: AssignmentRow[], updates: UpdateRow[]) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekStartDate = weekStart.toISOString().slice(0, 10);

  const submittedTeacherIds = new Set(
    updates
      .filter((update) => update.week_start_date === weekStartDate || (update.submitted_at ?? "") >= weekStartDate)
      .map((update) => update.teacher_id)
      .filter(Boolean),
  );

  const assignedTeachers = new Map<string, string>();
  assignments.forEach((assignment) => {
    if (assignment.teacher_id) {
      assignedTeachers.set(
        assignment.teacher_id,
        relatedOne(assignment.profiles)?.full_name ?? "Assigned teacher",
      );
    }
  });

  return Array.from(assignedTeachers.entries())
    .filter(([teacherId]) => !submittedTeacherIds.has(teacherId))
    .map(
      ([teacher_id, teacher_name]): MissingTeacher => ({
        teacher_id,
        teacher_name,
      }),
    );
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}

function classLabel(classSection: { class_name: string | null; section: string | null } | null) {
  if (!classSection?.class_name) return "Class";
  return [classSection.class_name, classSection.section].filter(Boolean).join("");
}

function formatWeek(start: string | null, end: string | null) {
  if (!start && !end) return "Not set";
  if (!end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function statusTone(status: string) {
  if (status === "completed" || status === "on_track") return "success" as const;
  if (status === "behind" || status === "not_started") return "danger" as const;
  return "neutral" as const;
}

function progressTone(value: number) {
  if (value >= 80) return "success" as const;
  if (value >= 50) return "warning" as const;
  return "danger" as const;
}
