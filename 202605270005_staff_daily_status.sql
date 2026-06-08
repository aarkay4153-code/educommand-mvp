"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import type { StatusTone } from "@/lib/types";

export type PlacementProfile = {
  id: string;
  studentName: string;
  admissionNumber: string | null;
  branch: string | null;
  year_of_study: string | null;
  cgpa: number | null;
  backlog_count: number | null;
  skills: string | null;
  coding_score: number | null;
  aptitude_score: number | null;
  communication_score: number | null;
  placement_status: string | null;
};

export type Recruiter = {
  id: string;
  company_name: string | null;
  industry: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  remarks: string | null;
};

export type PlacementDrive = {
  id: string;
  companyName: string;
  drive_date: string | null;
  role_title: string | null;
  eligibility_criteria: string | null;
  package_ctc: number | null;
  status: string | null;
};

export type PlacementOffer = {
  id: string;
  studentName: string;
  company_name: string | null;
  role_title: string | null;
  ctc: number | null;
  status: string | null;
};

export type Internship = {
  id: string;
  studentName: string;
  company_name: string | null;
  role_title: string | null;
  start_date: string | null;
  end_date: string | null;
  mode: string | null;
  stipend: number | null;
  status: string | null;
};

export function PlacementsDashboard({
  drives,
  internships,
  offers,
  profiles,
  recruiters,
}: {
  drives: PlacementDrive[];
  internships: Internship[];
  offers: PlacementOffer[];
  profiles: PlacementProfile[];
  recruiters: Recruiter[];
}) {
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const branches = unique(profiles.map((profile) => profile.branch));
  const years = unique(profiles.map((profile) => profile.year_of_study));
  const statuses = unique(profiles.map((profile) => profile.placement_status));
  const companies = unique([
    ...recruiters.map((recruiter) => recruiter.company_name),
    ...offers.map((offer) => offer.company_name),
    ...internships.map((internship) => internship.company_name),
  ]);

  const filteredProfiles = profiles.filter((profile) => {
    return (
      (branchFilter === "all" || profile.branch === branchFilter) &&
      (yearFilter === "all" || profile.year_of_study === yearFilter) &&
      (statusFilter === "all" || profile.placement_status === statusFilter)
    );
  });
  const filteredDrives = drives.filter((drive) => companyFilter === "all" || drive.companyName === companyFilter);
  const filteredOffers = offers.filter((offer) => companyFilter === "all" || offer.company_name === companyFilter);
  const filteredInternships = internships.filter((item) => companyFilter === "all" || item.company_name === companyFilter);
  const summary = buildSummary(filteredProfiles, filteredOffers, recruiters, filteredInternships);
  const branchRows = buildBranchRows(filteredProfiles, filteredOffers);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Placement Dashboard" description="Internal placement readiness, offers, recruiters and internships." />
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="Registered students" value={String(summary.registered)} />
            <Metric label="Eligible students" value={String(summary.eligible)} />
            <Metric label="Placed students" value={String(summary.placed)} />
            <Metric label="Unplaced students" value={String(summary.unplaced)} />
            <Metric label="Placement percentage" value={`${summary.placementPercentage}%`} />
            <Metric label="Highest package" value={formatLpa(summary.highestPackage)} />
            <Metric label="Average package" value={formatLpa(summary.averagePackage)} />
            <Metric label="Median package" value={formatLpa(summary.medianPackage)} />
            <Metric label="Companies visited" value={String(summary.companiesVisited)} />
            <Metric label="Internships completed" value={String(summary.internshipsCompleted)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Filters" description="Narrow the placement command view." />
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <SelectFilter label="Branch" onChange={setBranchFilter} options={branches} value={branchFilter} />
            <SelectFilter label="Year" onChange={setYearFilter} options={years} value={yearFilter} />
            <SelectFilter label="Status" onChange={setStatusFilter} options={statuses} value={statusFilter} />
            <SelectFilter label="Company" onChange={setCompanyFilter} options={companies} value={companyFilter} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader title="Branch-wise Placement" description="Placement spread by branch." />
          <CardContent>
            <DataTable
              headers={["Branch", "Registered", "Eligible", "Placed", "Placement %"]}
              rows={branchRows.map((row) => [
                row.branch,
                String(row.registered),
                String(row.eligible),
                String(row.placed),
                `${row.percentage}%`,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Student Readiness" description="Aptitude, coding and communication readiness." />
          <CardContent>
            <DataTable
              headers={["Student", "Branch", "CGPA", "Backlogs", "Coding", "Aptitude", "Communication", "Status"]}
              rows={filteredProfiles.map((profile) => [
                profile.studentName,
                profile.branch || "Not set",
                valueOrDash(profile.cgpa),
                String(profile.backlog_count ?? 0),
                valueOrDash(profile.coding_score),
                valueOrDash(profile.aptitude_score),
                valueOrDash(profile.communication_score),
                <Badge key={profile.id} tone={toneForPlacementStatus(profile.placement_status)}>
                  {labelize(profile.placement_status ?? "not_registered")}
                </Badge>,
              ])}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Recruiter Database" description="Internal recruiter relationship tracker." />
          <CardContent>
            <DataTable
              headers={["Company", "Industry", "Contact", "Email", "Phone"]}
              rows={recruiters.map((recruiter) => [
                recruiter.company_name || "Company",
                recruiter.industry || "Not set",
                recruiter.contact_person || "Not set",
                recruiter.contact_email || "Not set",
                recruiter.contact_phone || "Not set",
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Placement Drive Tracker" description="Upcoming and completed campus drives." />
          <CardContent>
            <DataTable
              headers={["Date", "Company", "Role", "Eligibility", "CTC", "Status"]}
              rows={filteredDrives.map((drive) => [
                formatDate(drive.drive_date),
                drive.companyName,
                drive.role_title || "Role",
                drive.eligibility_criteria || "Not set",
                formatLpa(drive.package_ctc),
                <Badge key={drive.id} tone={toneForDriveStatus(drive.status)}>
                  {labelize(drive.status ?? "planned")}
                </Badge>,
              ])}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Offer Tracker" description="Offer status and CTC visibility." />
          <CardContent>
            <DataTable
              headers={["Student", "Company", "Role", "CTC", "Status"]}
              rows={filteredOffers.map((offer) => [
                offer.studentName,
                offer.company_name || "Company",
                offer.role_title || "Role",
                formatLpa(offer.ctc),
                <Badge key={offer.id} tone={toneForOfferStatus(offer.status)}>
                  {labelize(offer.status ?? "offered")}
                </Badge>,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Internship Tracker" description="Internships, stipend, mode and completion." />
          <CardContent>
            <DataTable
              headers={["Student", "Company", "Role", "Dates", "Mode", "Stipend", "Status"]}
              rows={filteredInternships.map((internship) => [
                internship.studentName,
                internship.company_name || "Company",
                internship.role_title || "Role",
                `${formatDate(internship.start_date)} - ${formatDate(internship.end_date)}`,
                labelize(internship.mode ?? "not set"),
                internship.stipend == null ? "Not set" : `₹${internship.stipend}`,
                <Badge key={internship.id} tone={toneForInternshipStatus(internship.status)}>
                  {labelize(internship.status ?? "applied")}
                </Badge>,
              ])}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function buildSummary(
  profiles: PlacementProfile[],
  offers: PlacementOffer[],
  recruiters: Recruiter[],
  internships: Internship[],
) {
  const registered = profiles.filter((profile) => profile.placement_status !== "not_registered").length;
  const eligible = profiles.filter((profile) => profile.placement_status === "eligible" || profile.placement_status === "placed").length;
  const placed = profiles.filter((profile) => profile.placement_status === "placed").length;
  const unplaced = profiles.filter((profile) => ["eligible", "not_placed", "training", "registered"].includes(profile.placement_status ?? "")).length;
  const acceptedOffers = offers.filter((offer) => ["offered", "accepted", "joined"].includes(offer.status ?? ""));
  const packages = acceptedOffers.map((offer) => offer.ctc ?? 0).filter((ctc) => ctc > 0).sort((a, b) => a - b);
  const averagePackage = packages.length ? packages.reduce((sum, ctc) => sum + ctc, 0) / packages.length : 0;
  const medianPackage = packages.length ? packages[Math.floor(packages.length / 2)] : 0;

  return {
    registered,
    eligible,
    placed,
    unplaced,
    placementPercentage: eligible ? Math.round((placed / eligible) * 100) : 0,
    highestPackage: packages.at(-1) ?? 0,
    averagePackage,
    medianPackage,
    companiesVisited: recruiters.length,
    internshipsCompleted: internships.filter((internship) => internship.status === "completed").length,
  };
}

function buildBranchRows(profiles: PlacementProfile[], offers: PlacementOffer[]) {
  const branches = unique(profiles.map((profile) => profile.branch));
  return branches.map((branch) => {
    const branchProfiles = profiles.filter((profile) => profile.branch === branch);
    const eligible = branchProfiles.filter((profile) => profile.placement_status === "eligible" || profile.placement_status === "placed").length;
    const placed = branchProfiles.filter((profile) => profile.placement_status === "placed").length;
    return {
      branch,
      registered: branchProfiles.filter((profile) => profile.placement_status !== "not_registered").length,
      eligible,
      placed: Math.max(placed, offers.filter((offer) => branchProfiles.some((profile) => profile.studentName === offer.studentName)).length),
      percentage: eligible ? Math.round((placed / eligible) * 100) : 0,
    };
  });
}

function SelectFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select
        className="h-10 rounded-md border bg-background px-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelize(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function unique(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function formatLpa(value: number | null | undefined) {
  if (!value) return "Not set";
  return `${Number(value).toFixed(2)} LPA`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function valueOrDash(value: number | null | undefined) {
  return value == null ? "-" : String(value);
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function toneForPlacementStatus(status: string | null): StatusTone {
  if (status === "placed") return "success";
  if (status === "eligible" || status === "training" || status === "registered") return "info";
  if (status === "not_placed") return "danger";
  return "neutral";
}

function toneForDriveStatus(status: string | null): StatusTone {
  if (status === "completed") return "success";
  if (status === "open") return "info";
  if (status === "cancelled") return "danger";
  return "warning";
}

function toneForOfferStatus(status: string | null): StatusTone {
  if (status === "accepted" || status === "joined") return "success";
  if (status === "rejected" || status === "not_joined") return "danger";
  return "info";
}

function toneForInternshipStatus(status: string | null): StatusTone {
  if (status === "completed" || status === "selected") return "success";
  if (status === "ongoing") return "info";
  if (status === "rejected") return "danger";
  return "warning";
}
