import { PageHeader } from "@/components/app/page-header";
import { AccessDenied } from "@/components/app/access-denied";
import {
  SettingsWorkspace,
  type AssignmentSetting,
  type ClassSectionSetting,
  type InstitutionSettings,
  type ModuleSetting,
  type SchoolSettings,
  type StaffSetting,
  type SubjectSetting,
} from "@/components/settings/settings-workspace";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RelatedRow<T> = T | T[] | null;

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher" | "management";
  school_id: string | null;
};

type AssignmentRow = {
  id: string;
  teacher_id: string;
  class_section_id: string;
  subject_id: string;
  academic_year: string | null;
  profiles?: RelatedRow<{ full_name: string | null }>;
  class_sections?: RelatedRow<{ class_name: string | null; section: string | null }>;
  subjects?: RelatedRow<{ subject_name: string | null }>;
};

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Settings" description="Connect Supabase to manage EduCommand settings." />
        <Card>
          <CardHeader title="Supabase setup needed" description="Settings are not available yet." />
          <CardContent className="text-sm text-muted-foreground">
            Add Supabase environment variables and sign in as a principal.
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

  if (!profile?.school_id || profile.role !== "principal") {
    return (
      <>
        <PageHeader title="Settings" description="School settings are restricted to principals." />
        <AccessDenied message="Only the principal can manage school profile, institution profile, staff setup, and academic configuration." />
      </>
    );
  }

  const schoolId = profile.school_id;
  const [
    schoolResult,
    institutionResult,
    classesResult,
    subjectsResult,
    staffResult,
    assignmentsResult,
    modulesResult,
  ] = await Promise.all([
    supabase
      .from("schools")
      .select("id, name, address, city, state, board, institution_type, established_year")
      .eq("id", schoolId)
      .single<SchoolSettings>(),
    supabase
      .from("institution_profile")
      .select("id, vision, mission, total_students, total_teachers, total_admin_staff, total_classes, infrastructure_summary, achievements, special_programs, contact_email, contact_phone, website")
      .eq("school_id", schoolId)
      .maybeSingle<InstitutionSettings>(),
    supabase
      .from("class_sections")
      .select("id, class_name, section, academic_year")
      .eq("school_id", schoolId)
      .order("class_name", { ascending: true }),
    supabase
      .from("subjects")
      .select("id, subject_name")
      .eq("school_id", schoolId)
      .order("subject_name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, role, designation, department, is_active")
      .eq("school_id", schoolId)
      .order("full_name", { ascending: true }),
    supabase
      .from("teacher_assignments")
      .select("id, teacher_id, class_section_id, subject_id, academic_year, profiles(full_name), class_sections(class_name, section), subjects(subject_name)")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
    supabase
      .from("school_modules")
      .select("module_key, is_enabled")
      .eq("school_id", schoolId),
  ]);

  if (!schoolResult.data) {
    return (
      <>
        <PageHeader title="Settings" description="School profile could not be found." />
        <Card>
          <CardHeader title="Missing school" description="No school row is linked to this principal profile." />
          <CardContent className="text-sm text-muted-foreground">
            Please check the profile and school seed data in Supabase.
          </CardContent>
        </Card>
      </>
    );
  }

  const assignments = ((assignmentsResult.data ?? []) as unknown as AssignmentRow[]).map(toAssignmentSetting);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Principal-only setup for school profile, institution profile, academic structure, staff, and teacher assignments."
      />
      <SettingsWorkspace
        assignments={assignments}
        classes={(classesResult.data ?? []) as ClassSectionSetting[]}
        institution={institutionResult.data}
        modules={(modulesResult.data ?? []) as ModuleSetting[]}
        school={schoolResult.data}
        staff={(staffResult.data ?? []) as StaffSetting[]}
        subjects={(subjectsResult.data ?? []) as SubjectSetting[]}
      />
    </>
  );
}

function toAssignmentSetting(row: AssignmentRow): AssignmentSetting {
  const teacher = relatedOne(row.profiles);
  const classSection = relatedOne(row.class_sections);
  const subject = relatedOne(row.subjects);

  return {
    id: row.id,
    teacher_id: row.teacher_id,
    class_section_id: row.class_section_id,
    subject_id: row.subject_id,
    academic_year: row.academic_year,
    teacherName: teacher?.full_name ?? "Teacher",
    classLabel: classLabel(classSection),
    subjectName: subject?.subject_name ?? "Subject",
  };
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}

function classLabel(classSection: { class_name: string | null; section: string | null } | null) {
  if (!classSection?.class_name) return "Class";
  return [classSection.class_name, classSection.section].filter(Boolean).join("");
}
