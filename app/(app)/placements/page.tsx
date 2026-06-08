import { AccessDenied } from "@/components/app/access-denied";
import { PageHeader } from "@/components/app/page-header";
import {
  PlacementsDashboard,
  type Internship,
  type PlacementDrive,
  type PlacementOffer,
  type PlacementProfile,
  type Recruiter,
} from "@/components/placements/placements-dashboard";
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

type PlacementProfileRow = {
  id: string;
  branch: string | null;
  year_of_study: string | null;
  cgpa: number | null;
  backlog_count: number | null;
  skills: string | null;
  coding_score: number | null;
  aptitude_score: number | null;
  communication_score: number | null;
  placement_status: string | null;
  students?: RelatedRow<{ full_name: string | null; admission_number: string | null }>;
};

type DriveRow = {
  id: string;
  drive_date: string | null;
  role_title: string | null;
  eligibility_criteria: string | null;
  package_ctc: number | null;
  status: string | null;
  recruiters?: RelatedRow<{ company_name: string | null }>;
};

type OfferRow = {
  id: string;
  company_name: string | null;
  role_title: string | null;
  ctc: number | null;
  status: string | null;
  students?: RelatedRow<{ full_name: string | null }>;
};

type InternshipRow = {
  id: string;
  company_name: string | null;
  role_title: string | null;
  start_date: string | null;
  end_date: string | null;
  mode: string | null;
  stipend: number | null;
  status: string | null;
  students?: RelatedRow<{ full_name: string | null }>;
};

export default async function PlacementsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Placements" description="Connect Supabase to view the Placement Command Centre." />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live placement data is not available yet." />
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
        <PageHeader title="Placements" description="Your placement dashboard will appear after your profile is configured." />
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
        <PageHeader title="Placements" description="Placement Command Centre is for college leadership and placement cells." />
        <AccessDenied message="Placements are hidden for teachers in this MVP." />
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
        <PageHeader title="Placements" description="Placement Command Centre is available in College Mode." />
        <AccessDenied title="College Mode required" message="Switch this institution to College Mode and enable Placements to use this module." />
      </>
    );
  }

  const [
    profilesResult,
    recruitersResult,
    drivesResult,
    offersResult,
    internshipsResult,
  ] = await Promise.all([
    supabase
      .from("placement_profiles")
      .select("id, branch, year_of_study, cgpa, backlog_count, skills, coding_score, aptitude_score, communication_score, placement_status, students(full_name, admission_number)")
      .eq("school_id", profile.school_id)
      .order("branch", { ascending: true }),
    supabase
      .from("recruiters")
      .select("id, company_name, industry, contact_person, contact_email, contact_phone, remarks")
      .eq("school_id", profile.school_id)
      .order("company_name", { ascending: true }),
    supabase
      .from("placement_drives")
      .select("id, drive_date, role_title, eligibility_criteria, package_ctc, status, recruiters(company_name)")
      .eq("school_id", profile.school_id)
      .order("drive_date", { ascending: false }),
    supabase
      .from("placement_offers")
      .select("id, company_name, role_title, ctc, status, students(full_name)")
      .eq("school_id", profile.school_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("internships")
      .select("id, company_name, role_title, start_date, end_date, mode, stipend, status, students(full_name)")
      .eq("school_id", profile.school_id)
      .order("created_at", { ascending: false }),
  ]);

  const placementProfiles = ((profilesResult.data ?? []) as unknown as PlacementProfileRow[]).map(toPlacementProfile);
  const recruiters = (recruitersResult.data ?? []) as Recruiter[];
  const drives = ((drivesResult.data ?? []) as unknown as DriveRow[]).map(toDrive);
  const offers = ((offersResult.data ?? []) as unknown as OfferRow[]).map(toOffer);
  const internships = ((internshipsResult.data ?? []) as unknown as InternshipRow[]).map(toInternship);

  return (
    <>
      <PageHeader
        title="Placement Command Centre"
        description="Internal dashboard for placement readiness, recruiters, drives, offers and internships."
      />

      {placementProfiles.length || recruiters.length || drives.length || offers.length || internships.length ? (
        <PlacementsDashboard
          drives={drives}
          internships={internships}
          offers={offers}
          profiles={placementProfiles}
          recruiters={recruiters}
        />
      ) : (
        <Card>
          <CardHeader title="No placement data yet" description="Add placement profiles, recruiters, drives, offers and internships in Supabase." />
          <CardContent className="text-sm text-muted-foreground">
            This module is an internal placement command dashboard. It does not integrate external job portals.
          </CardContent>
        </Card>
      )}
    </>
  );
}

function toPlacementProfile(row: PlacementProfileRow): PlacementProfile {
  const student = relatedOne(row.students);
  return {
    id: row.id,
    studentName: student?.full_name ?? "Student",
    admissionNumber: student?.admission_number ?? null,
    branch: row.branch,
    year_of_study: row.year_of_study,
    cgpa: row.cgpa,
    backlog_count: row.backlog_count,
    skills: row.skills,
    coding_score: row.coding_score,
    aptitude_score: row.aptitude_score,
    communication_score: row.communication_score,
    placement_status: row.placement_status,
  };
}

function toDrive(row: DriveRow): PlacementDrive {
  return {
    id: row.id,
    companyName: relatedOne(row.recruiters)?.company_name ?? "Company",
    drive_date: row.drive_date,
    role_title: row.role_title,
    eligibility_criteria: row.eligibility_criteria,
    package_ctc: row.package_ctc,
    status: row.status,
  };
}

function toOffer(row: OfferRow): PlacementOffer {
  return {
    id: row.id,
    studentName: relatedOne(row.students)?.full_name ?? "Student",
    company_name: row.company_name,
    role_title: row.role_title,
    ctc: row.ctc,
    status: row.status,
  };
}

function toInternship(row: InternshipRow): Internship {
  return {
    id: row.id,
    studentName: relatedOne(row.students)?.full_name ?? "Student",
    company_name: row.company_name,
    role_title: row.role_title,
    start_date: row.start_date,
    end_date: row.end_date,
    mode: row.mode,
    stipend: row.stipend,
    status: row.status,
  };
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}
