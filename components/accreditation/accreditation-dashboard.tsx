"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrintButton } from "@/components/reports/print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import type { StatusTone } from "@/lib/types";

export type AccreditationProfile = {
  id: string;
  full_name: string;
  department: string | null;
};

export type AccreditationCriterion = {
  id: string;
  accreditation_type: string | null;
  criterion_code: string | null;
  criterion_title: string | null;
  description: string | null;
  owner_id: string | null;
  ownerName: string;
  ownerDepartment: string | null;
  target_date: string | null;
  status: string | null;
  completion_percentage: number | null;
};

export type AccreditationEvidence = {
  id: string;
  criterion_id: string | null;
  evidence_title: string | null;
  evidence_description: string | null;
  file_url: string | null;
  uploadedByName: string;
  status: string | null;
  remarks: string | null;
};

const accreditationTypes = ["naac", "nba", "aicte", "university", "internal"];
const criterionStatuses = ["not_started", "in_progress", "completed", "delayed", "needs_review"];
const evidenceStatuses = ["uploaded", "verified", "rejected", "needs_revision"];

export function AccreditationDashboard({
  criteria,
  evidence,
  generatedDate,
  profiles,
  schoolId,
  userId,
}: {
  criteria: AccreditationCriterion[];
  evidence: AccreditationEvidence[];
  generatedDate: string;
  profiles: AccreditationProfile[];
  schoolId: string;
  userId: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const summary = buildSummary(criteria, evidence);
  const departmentRows = buildDepartmentRows(criteria);

  function createCriterion(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const { error } = await createClient().from("accreditation_criteria").insert({
        accreditation_type: String(formData.get("accreditation_type")),
        completion_percentage: Number(formData.get("completion_percentage") || 0),
        criterion_code: valueOrNull(formData.get("criterion_code")),
        criterion_title: valueOrNull(formData.get("criterion_title")),
        description: valueOrNull(formData.get("description")),
        owner_id: valueOrNull(formData.get("owner_id")),
        school_id: schoolId,
        status: String(formData.get("status")),
        target_date: valueOrNull(formData.get("target_date")),
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Criterion saved.");
      router.refresh();
    });
  }

  function createEvidence(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const { error } = await createClient().from("accreditation_evidence").insert({
        criterion_id: String(formData.get("criterion_id")),
        evidence_description: valueOrNull(formData.get("evidence_description")),
        evidence_title: valueOrNull(formData.get("evidence_title")),
        file_url: valueOrNull(formData.get("file_url")),
        remarks: valueOrNull(formData.get("remarks")),
        school_id: schoolId,
        status: String(formData.get("status")),
        uploaded_by: userId,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Evidence saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Readiness tracker only. EduCommand does not claim official accreditation compliance.
      </div>

      <div className="print-document-header hidden">
        <h1 className="print-document-title">Accreditation Readiness Report</h1>
        <p className="print-document-meta">Generated on {generatedDate}</p>
        <p className="print-document-meta">Readiness tracker only, not an official compliance certificate.</p>
      </div>

      <Card className="print-card">
        <CardHeader
          title="Readiness Dashboard"
          description="NAAC/NBA/AICTE readiness and evidence movement."
          action={<PrintButton label="Print Readiness Report" />}
        />
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="NAAC readiness" value={`${summary.naac}%`} />
            <Metric label="NBA readiness" value={`${summary.nba}%`} />
            <Metric label="AICTE docs readiness" value={`${summary.aicte}%`} />
            <Metric label="Pending evidence" value={String(summary.pendingEvidence)} />
            <Metric label="Delayed criteria" value={String(summary.delayedCriteria)} />
          </div>
        </CardContent>
      </Card>

      {message ? <p className="print:hidden rounded-md border bg-card p-3 text-sm text-muted-foreground">{message}</p> : null}

      <div className="print:hidden grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Add Criterion" description="Create NAAC/NBA/AICTE readiness item and assign an owner." />
          <CardContent>
            <form action={createCriterion} className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField label="Type" name="accreditation_type" options={accreditationTypes} />
                <InputField label="Code" name="criterion_code" />
                <InputField label="Title" name="criterion_title" required />
                <SelectField label="Owner" name="owner_id" options={profiles.map((profile) => [profile.id, profile.full_name])} raw />
                <InputField label="Target date" name="target_date" type="date" />
                <SelectField label="Status" name="status" options={criterionStatuses} />
                <InputField label="Completion %" max="100" min="0" name="completion_percentage" type="number" />
              </div>
              <TextareaField label="Description" name="description" />
              <Button disabled={isPending} type="submit">Save Criterion</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Add Evidence" description="Store evidence link or uploaded file path against a criterion." />
          <CardContent>
            <form action={createEvidence} className="grid gap-3">
              <SelectField
                label="Criterion"
                name="criterion_id"
                options={criteria.map((item) => [item.id, `${item.criterion_code ?? "Item"} - ${item.criterion_title ?? "Untitled"}`])}
                raw
              />
              <InputField label="Evidence title" name="evidence_title" required />
              <InputField label="File URL / path" name="file_url" />
              <SelectField label="Status" name="status" options={evidenceStatuses} />
              <TextareaField label="Evidence description" name="evidence_description" />
              <TextareaField label="Remarks" name="remarks" />
              <Button disabled={isPending} type="submit">Save Evidence</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="print-card">
        <CardHeader title="Criteria Tracker" description="Criterion ownership, target dates and completion." />
        <CardContent>
          <DataTable
            emptyMessage="No accreditation criteria added yet."
            headers={["Type", "Code", "Criterion", "Owner", "Target", "Progress", "Status"]}
            rows={criteria.map((item) => [
              labelize(item.accreditation_type ?? "internal"),
              item.criterion_code ?? "-",
              item.criterion_title ?? "Untitled",
              item.ownerName,
              formatDate(item.target_date),
              `${item.completion_percentage ?? 0}%`,
              <Badge key={item.id} tone={toneForCriterion(item.status)}>{labelize(item.status ?? "not_started")}</Badge>,
            ])}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="print-card">
          <CardHeader title="Evidence Repository" description="Evidence upload and verification status." />
          <CardContent>
            <DataTable
              emptyMessage="No evidence uploaded yet."
              headers={["Evidence", "Uploaded by", "File", "Status", "Remarks"]}
              rows={evidence.map((item) => [
                item.evidence_title ?? "Evidence",
                item.uploadedByName,
                item.file_url ? <a className="text-primary" href={item.file_url} key={item.id}>Open</a> : "Not added",
                <Badge key={`${item.id}-status`} tone={toneForEvidence(item.status)}>{labelize(item.status ?? "uploaded")}</Badge>,
                item.remarks ?? "No remarks",
              ])}
            />
          </CardContent>
        </Card>

        <Card className="print-card">
          <CardHeader title="Department-wise Readiness" description="Uses criterion owner department where available." />
          <CardContent>
            <DataTable
              emptyMessage="No department-wise readiness available yet."
              headers={["Department", "Criteria", "Average readiness", "Delayed"]}
              rows={departmentRows.map((row) => [
                row.department,
                String(row.criteria),
                `${row.average}%`,
                String(row.delayed),
              ])}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function buildSummary(criteria: AccreditationCriterion[], evidence: AccreditationEvidence[]) {
  return {
    naac: averageForType(criteria, "naac"),
    nba: averageForType(criteria, "nba"),
    aicte: averageForType(criteria, "aicte"),
    pendingEvidence: evidence.filter((item) => item.status !== "verified").length,
    delayedCriteria: criteria.filter((item) => item.status === "delayed").length,
  };
}

function averageForType(criteria: AccreditationCriterion[], type: string) {
  const rows = criteria.filter((item) => item.accreditation_type === type);
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((sum, item) => sum + (item.completion_percentage ?? 0), 0) / rows.length);
}

function buildDepartmentRows(criteria: AccreditationCriterion[]) {
  const map = new Map<string, AccreditationCriterion[]>();
  criteria.forEach((item) => {
    const department = item.ownerDepartment || "Unassigned";
    map.set(department, [...(map.get(department) ?? []), item]);
  });

  return Array.from(map.entries()).map(([department, rows]) => ({
    department,
    criteria: rows.length,
    average: Math.round(rows.reduce((sum, item) => sum + (item.completion_percentage ?? 0), 0) / rows.length),
    delayed: rows.filter((item) => item.status === "delayed").length,
  }));
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="print-metric rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="print-metric-value mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  raw,
}: {
  label: string;
  name: string;
  options: string[] | string[][];
  raw?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select className="h-10 rounded-md border bg-background px-3 text-sm" name={name} required>
        <option value="">Select</option>
        {options.map((option) => {
          const value = Array.isArray(option) ? option[0] : option;
          const text = Array.isArray(option) ? option[1] : raw ? option : labelize(option);
          return <option key={value} value={value}>{text}</option>;
        })}
      </select>
    </label>
  );
}

function InputField({
  label,
  max,
  min,
  name,
  required,
  type = "text",
}: {
  label: string;
  max?: string;
  min?: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input className="h-10 rounded-md border bg-background px-3 text-sm" max={max} min={min} name={name} required={required} type={type} />
    </label>
  );
}

function TextareaField({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" name={name} />
    </label>
  );
}

function toneForCriterion(status: string | null): StatusTone {
  if (status === "completed") return "success";
  if (status === "delayed") return "danger";
  if (status === "needs_review") return "warning";
  if (status === "in_progress") return "info";
  return "neutral";
}

function toneForEvidence(status: string | null): StatusTone {
  if (status === "verified") return "success";
  if (status === "rejected") return "danger";
  if (status === "needs_revision") return "warning";
  return "info";
}

function valueOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function labelize(value: string) {
  return value.replaceAll("_", " ").toUpperCase();
}
