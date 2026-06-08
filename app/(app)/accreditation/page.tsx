import { AccessDenied } from "@/components/app/access-denied";
import { PageHeader } from "@/components/app/page-header";
import {
  AccreditationDashboard,
  type AccreditationCriterion,
  type AccreditationEvidence,
  type AccreditationProfile,
} from "@/components/accreditation/accreditation-dashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isInstitutionType } from "@/lib/modules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RelatedRow<T> = T | T[] | null;

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher" | "management";
  school_id: string | null;
};

type SchoolRow = {
  institution_type: string | null;
};

type CriterionRow = {
  id: string;
  accreditation_type: string | null;
  criterion_code: string | null;
  criterion_title: string | null;
  description: string | null;
  owner_id: string | null;
  target_date: string | null;
  status: string | null;
  completion_percentage: number | null;
  profiles?: RelatedRow<{ full_name: string | null; department: string | null }>;
};

type EvidenceRow = {
  id: string;
  criterion_id: string | null;
  evidence_title: string | null;
  evidence_description: string | null;
  file_url: string | null;
  status: string | null;
  remarks: string | null;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

export default async function AccreditationPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Accreditation" description="Connect Supabase to track accreditation readiness." />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live accreditation data is not available yet." />
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
        <PageHeader title="Accreditation" description="Your accreditation workspace will appear after your profile is configured." />
        <Card>
          <CardHeader title="Profile setup needed" description="No institution is linked to this account yet." />
          <CardContent className="text-sm text-muted-foreground">
            Please contact the institution admin to complete your EduCommand profile.
          </CardContent>
        </Card>
      </>
    );
  }

  if (profile.role === "teacher") {
    return (
      <>
        <PageHeader title="Accreditation" description="Accreditation readiness is available to college leadership." />
        <AccessDenied message="Accreditation Readiness is hidden for teachers in this MVP." />
      </>
    );
  }

  const { data: school } = await supabase
    .from("schools")
    .select("institution_type")
    .eq("id", profile.school_id)
    .maybeSingle<SchoolRow>();

  if (!isInstitutionType(school?.institution_type) || school.institution_type !== "college") {
    return (
      <>
        <PageHeader title="Accreditation" description="Accreditation Readiness is available in College Mode." />
        <AccessDenied title="College Mode required" message="Switch this institution to College Mode and enable Accreditation to use this module." />
      </>
    );
  }

  const [profilesResult, criteriaResult, evidenceResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, department")
      .eq("school_id", profile.school_id)
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("accreditation_criteria")
      .select("id, accreditation_type, criterion_code, criterion_title, description, owner_id, target_date, status, completion_percentage, profiles(full_name, department)")
      .eq("school_id", profile.school_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("accreditation_evidence")
      .select("id, criterion_id, evidence_title, evidence_description, file_url, status, remarks, profiles(full_name)")
      .eq("school_id", profile.school_id)
      .order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesResult.data ?? []) as AccreditationProfile[];
  const criteria = ((criteriaResult.data ?? []) as unknown as CriterionRow[]).map(toCriterion);
  const evidence = ((evidenceResult.data ?? []) as unknown as EvidenceRow[]).map(toEvidence);
  const generatedDate = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  return (
    <>
      <PageHeader
        title="Accreditation Readiness"
        description="Track NAAC/NBA/AICTE-style readiness criteria, owners and evidence. This is not official compliance certification."
      />

      <AccreditationDashboard
        criteria={criteria}
        evidence={evidence}
        generatedDate={generatedDate}
        profiles={profiles}
        schoolId={profile.school_id}
        userId={profile.id}
      />
    </>
  );
}

function toCriterion(row: CriterionRow): AccreditationCriterion {
  const owner = relatedOne(row.profiles);
  return {
    id: row.id,
    accreditation_type: row.accreditation_type,
    criterion_code: row.criterion_code,
    criterion_title: row.criterion_title,
    description: row.description,
    owner_id: row.owner_id,
    ownerName: owner?.full_name ?? "Unassigned",
    ownerDepartment: owner?.department ?? null,
    target_date: row.target_date,
    status: row.status,
    completion_percentage: row.completion_percentage,
  };
}

function toEvidence(row: EvidenceRow): AccreditationEvidence {
  return {
    id: row.id,
    criterion_id: row.criterion_id,
    evidence_title: row.evidence_title,
    evidence_description: row.evidence_description,
    file_url: row.file_url,
    uploadedByName: relatedOne(row.profiles)?.full_name ?? "Uploaded user",
    status: row.status,
    remarks: row.remarks,
  };
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}
