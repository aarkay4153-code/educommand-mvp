"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import {
  configurableModuleKeys,
  defaultModulesByInstitutionType,
  institutionTypeLabels,
  isInstitutionType,
  moduleLabels,
  type InstitutionType,
  type ModuleKey,
} from "@/lib/modules";
import { createClient } from "@/lib/supabase/client";

export type SchoolSettings = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  board: string | null;
  institution_type: InstitutionType | null;
  established_year: number | null;
};

export type ModuleSetting = {
  module_key: ModuleKey;
  is_enabled: boolean;
};

export type InstitutionSettings = {
  id: string | null;
  vision: string | null;
  mission: string | null;
  total_students: number | null;
  total_teachers: number | null;
  total_admin_staff: number | null;
  total_classes: number | null;
  infrastructure_summary: string | null;
  achievements: string | null;
  special_programs: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
};

export type ClassSectionSetting = {
  id: string;
  class_name: string;
  section: string | null;
  academic_year: string | null;
};

export type SubjectSetting = {
  id: string;
  subject_name: string;
};

export type StaffSetting = {
  id: string;
  full_name: string;
  role: string;
  designation: string | null;
  department: string | null;
  is_active: boolean | null;
};

export type AssignmentSetting = {
  id: string;
  teacher_id: string;
  class_section_id: string;
  subject_id: string;
  academic_year: string | null;
  teacherName: string;
  classLabel: string;
  subjectName: string;
};

export function SettingsWorkspace({
  assignments,
  classes,
  institution,
  school,
  modules,
  staff,
  subjects,
}: {
  assignments: AssignmentSetting[];
  classes: ClassSectionSetting[];
  institution: InstitutionSettings | null;
  modules: ModuleSetting[];
  school: SchoolSettings;
  staff: StaffSetting[];
  subjects: SubjectSetting[];
}) {
  const teachers = staff.filter((member) => member.role === "teacher" && member.is_active !== false);

  return (
    <div className="space-y-6">
      <InstitutionModeSettings school={school} />
      <ModuleSettings modules={modules} school={school} />
      <SchoolProfileForm school={school} />
      <InstitutionProfileForm institution={institution} schoolId={school.id} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ClassSectionManager classes={classes} schoolId={school.id} />
        <SubjectManager schoolId={school.id} subjects={subjects} />
      </div>
      <StaffList staff={staff} />
      <TeacherAssignmentManager
        assignments={assignments}
        classes={classes}
        schoolId={school.id}
        subjects={subjects}
        teachers={teachers}
      />
    </div>
  );
}

function InstitutionModeSettings({ school }: { school: SchoolSettings }) {
  const router = useRouter();
  const currentType = isInstitutionType(school.institution_type) ? school.institution_type : "school";
  const [institutionType, setInstitutionType] = useState<InstitutionType>(currentType);
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSaving, setIsSaving] = useState(false);
  const recommendedModules = defaultModulesByInstitutionType[institutionType];

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);
    const { error } = await createClient()
      .from("schools")
      .update({ institution_type: institutionType })
      .eq("id", school.id);
    setIsSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({
      type: "success",
      text: "Institution type saved. Recommended modules are shown below; existing module settings were not overwritten.",
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Institution Type"
        description="Choose how EduCommand should behave for this institution."
      />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-[1fr_auto]" onSubmit={save}>
          <FormMessage message={message} />
          <Field label="Operating mode">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setInstitutionType(event.target.value as InstitutionType)}
              value={institutionType}
            >
              {Object.entries(institutionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save type"}
            </Button>
          </div>
          <div className="rounded-md border bg-background p-3 lg:col-span-2">
            <p className="text-sm font-medium">Recommended modules for {institutionTypeLabels[institutionType]}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {recommendedModules.map((moduleKey) => moduleLabels[moduleKey]).join(", ")}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ModuleSettings({ modules, school }: { modules: ModuleSetting[]; school: SchoolSettings }) {
  const router = useRouter();
  const institutionType = isInstitutionType(school.institution_type) ? school.institution_type : "school";
  const recommended = new Set(defaultModulesByInstitutionType[institutionType]);
  const saved = new Map(modules.map((module) => [module.module_key, module.is_enabled]));
  const [enabledModules, setEnabledModules] = useState(
    new Set<ModuleKey>(
      modules.length > 0
        ? modules.filter((module) => module.is_enabled).map((module) => module.module_key)
        : defaultModulesByInstitutionType[institutionType],
    ),
  );
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSaving, setIsSaving] = useState(false);

  function toggle(moduleKey: ModuleKey) {
    setEnabledModules((current) => {
      const next = new Set(current);
      if (next.has(moduleKey)) {
        next.delete(moduleKey);
      } else {
        next.add(moduleKey);
      }
      return next;
    });
  }

  async function saveModules() {
    setMessage(null);
    setIsSaving(true);
    const payload = configurableModuleKeys.map((moduleKey) => ({
      school_id: school.id,
      module_key: moduleKey,
      is_enabled: enabledModules.has(moduleKey),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await createClient()
      .from("school_modules")
      .upsert(payload, { onConflict: "school_id,module_key" });
    setIsSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Module settings saved." });
    router.refresh();
  }

  async function applyRecommended() {
    if (!window.confirm("Apply recommended defaults? This will replace current enabled/disabled module choices.")) {
      return;
    }
    setEnabledModules(new Set(defaultModulesByInstitutionType[institutionType]));
  }

  return (
    <Card>
      <CardHeader
        title="Module Settings"
        description="Enable only the modules that are relevant for this institution."
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={applyRecommended} type="button" variant="secondary">
              Use recommended defaults
            </Button>
            <Button disabled={isSaving} onClick={saveModules} type="button">
              {isSaving ? "Saving..." : "Save modules"}
            </Button>
          </div>
        }
      />
      <CardContent className="space-y-4">
        <FormMessage message={message} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {configurableModuleKeys.map((moduleKey) => {
            const checked = enabledModules.has(moduleKey);
            const isRecommended = recommended.has(moduleKey);
            const wasSaved = saved.has(moduleKey);
            return (
              <label
                className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm"
                key={moduleKey}
              >
                <input
                  checked={checked}
                  className="mt-1"
                  onChange={() => toggle(moduleKey)}
                  type="checkbox"
                />
                <span>
                  <span className="font-medium">{moduleLabels[moduleKey]}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {isRecommended ? "Recommended for this institution type" : "Optional module"}
                    {wasSaved ? " - saved setting" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SchoolProfileForm({ school }: { school: SchoolSettings }) {
  const router = useRouter();
  const [name, setName] = useState(school.name);
  const [address, setAddress] = useState(school.address ?? "");
  const [city, setCity] = useState(school.city ?? "");
  const [state, setState] = useState(school.state ?? "");
  const [board, setBoard] = useState(school.board ?? "");
  const [establishedYear, setEstablishedYear] = useState(school.established_year?.toString() ?? "");
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: "error", text: "School name is required." });
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("schools")
      .update({
        name: name.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        board: board.trim() || null,
        established_year: establishedYear ? Number(establishedYear) : null,
      })
      .eq("id", school.id);
    setIsSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "School profile updated." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="School Profile Settings" description="Core school identity used across EduCommand." />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-3" onSubmit={save}>
          <FormMessage message={message} />
          <Field label="School name">
            <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setName(e.target.value)} required value={name} />
          </Field>
          <Field label="City">
            <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setCity(e.target.value)} value={city} />
          </Field>
          <Field label="State">
            <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setState(e.target.value)} value={state} />
          </Field>
          <Field className="lg:col-span-2" label="Address">
            <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setAddress(e.target.value)} value={address} />
          </Field>
          <Field label="Board">
            <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setBoard(e.target.value)} value={board} />
          </Field>
          <Field label="Established year">
            <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" max="2100" min="1800" onChange={(e) => setEstablishedYear(e.target.value)} type="number" value={establishedYear} />
          </Field>
          <div className="lg:col-span-3">
            <Button disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save school profile"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function InstitutionProfileForm({
  institution,
  schoolId,
}: {
  institution: InstitutionSettings | null;
  schoolId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    vision: institution?.vision ?? "",
    mission: institution?.mission ?? "",
    total_students: institution?.total_students?.toString() ?? "",
    total_teachers: institution?.total_teachers?.toString() ?? "",
    total_admin_staff: institution?.total_admin_staff?.toString() ?? "",
    total_classes: institution?.total_classes?.toString() ?? "",
    infrastructure_summary: institution?.infrastructure_summary ?? "",
    achievements: institution?.achievements ?? "",
    special_programs: institution?.special_programs ?? "",
    contact_email: institution?.contact_email ?? "",
    contact_phone: institution?.contact_phone ?? "",
    website: institution?.website ?? "",
  });
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSaving, setIsSaving] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const payload = {
      school_id: schoolId,
      vision: form.vision.trim() || null,
      mission: form.mission.trim() || null,
      total_students: toNumberOrNull(form.total_students),
      total_teachers: toNumberOrNull(form.total_teachers),
      total_admin_staff: toNumberOrNull(form.total_admin_staff),
      total_classes: toNumberOrNull(form.total_classes),
      infrastructure_summary: form.infrastructure_summary.trim() || null,
      achievements: form.achievements.trim() || null,
      special_programs: form.special_programs.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      website: form.website.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const supabase = createClient();
    const request = institution?.id
      ? supabase.from("institution_profile").update(payload).eq("id", institution.id)
      : supabase.from("institution_profile").insert(payload);
    const { error } = await request;
    setIsSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Institution profile saved." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Institution Profile" description="Used for one-click institution briefs and reports." />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={save}>
          <FormMessage message={message} />
          <Field label="Vision"><textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => update("vision", e.target.value)} value={form.vision} /></Field>
          <Field label="Mission"><textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => update("mission", e.target.value)} value={form.mission} /></Field>
          <Field label="Total students"><NumberInput onChange={(value) => update("total_students", value)} value={form.total_students} /></Field>
          <Field label="Total teachers"><NumberInput onChange={(value) => update("total_teachers", value)} value={form.total_teachers} /></Field>
          <Field label="Total admin staff"><NumberInput onChange={(value) => update("total_admin_staff", value)} value={form.total_admin_staff} /></Field>
          <Field label="Total classes"><NumberInput onChange={(value) => update("total_classes", value)} value={form.total_classes} /></Field>
          <Field className="lg:col-span-2" label="Infrastructure summary"><textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => update("infrastructure_summary", e.target.value)} value={form.infrastructure_summary} /></Field>
          <Field label="Achievements"><textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => update("achievements", e.target.value)} value={form.achievements} /></Field>
          <Field label="Special programs"><textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => update("special_programs", e.target.value)} value={form.special_programs} /></Field>
          <Field label="Contact email"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => update("contact_email", e.target.value)} type="email" value={form.contact_email} /></Field>
          <Field label="Contact phone"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => update("contact_phone", e.target.value)} value={form.contact_phone} /></Field>
          <Field label="Website"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => update("website", e.target.value)} value={form.website} /></Field>
          <div className="lg:col-span-2">
            <Button disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save institution profile"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ClassSectionManager({ classes, schoolId }: { classes: ClassSectionSetting[]; schoolId: string }) {
  const router = useRouter();
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [message, setMessage] = useState<FormMessage>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!className.trim()) {
      setMessage({ type: "error", text: "Class name is required." });
      return;
    }
    const { error } = await createClient().from("class_sections").insert({
      school_id: schoolId,
      class_name: className.trim(),
      section: section.trim() || null,
      academic_year: academicYear.trim() || null,
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setClassName("");
    setSection("");
    setMessage({ type: "success", text: "Class section added." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Class & Section Management" description="Add and review class sections." />
      <CardContent className="space-y-4">
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={add}>
          <FormMessage message={message} />
          <input className="h-10 rounded-md border bg-card px-3 text-sm" onChange={(e) => setClassName(e.target.value)} placeholder="Class" value={className} />
          <input className="h-10 rounded-md border bg-card px-3 text-sm" onChange={(e) => setSection(e.target.value)} placeholder="Section" value={section} />
          <input className="h-10 rounded-md border bg-card px-3 text-sm" onChange={(e) => setAcademicYear(e.target.value)} placeholder="Academic year" value={academicYear} />
          <Button className="sm:col-span-3" type="submit">Add class/section</Button>
        </form>
        <DataTable headers={["Class", "Section", "Academic year"]} rows={classes.map((item) => [item.class_name, item.section ?? "-", item.academic_year ?? "-"])} />
      </CardContent>
    </Card>
  );
}

function SubjectManager({ schoolId, subjects }: { schoolId: string; subjects: SubjectSetting[] }) {
  const router = useRouter();
  const [subjectName, setSubjectName] = useState("");
  const [message, setMessage] = useState<FormMessage>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!subjectName.trim()) {
      setMessage({ type: "error", text: "Subject name is required." });
      return;
    }
    const { error } = await createClient().from("subjects").insert({
      school_id: schoolId,
      subject_name: subjectName.trim(),
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setSubjectName("");
    setMessage({ type: "success", text: "Subject added." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Subject Management" description="Add and review subjects." />
      <CardContent className="space-y-4">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={add}>
          <FormMessage message={message} />
          <input className="h-10 flex-1 rounded-md border bg-card px-3 text-sm" onChange={(e) => setSubjectName(e.target.value)} placeholder="Subject name" value={subjectName} />
          <Button type="submit">Add subject</Button>
        </form>
        <DataTable headers={["Subject"]} rows={subjects.map((subject) => [subject.subject_name])} />
      </CardContent>
    </Card>
  );
}

function StaffList({ staff }: { staff: StaffSetting[] }) {
  return (
    <Card>
      <CardHeader title="Staff Management" description="Auth users are currently created manually from the Supabase dashboard." />
      <CardContent className="p-0">
        <DataTable
          headers={["Name", "Role", "Designation", "Department", "Status"]}
          rows={staff.map((member) => [
            member.full_name,
            member.role,
            member.designation ?? "-",
            member.department ?? "-",
            <Badge key={member.id} tone={member.is_active === false ? "neutral" : "success"}>
              {member.is_active === false ? "Inactive" : "Active"}
            </Badge>,
          ])}
        />
      </CardContent>
    </Card>
  );
}

function TeacherAssignmentManager({
  assignments,
  classes,
  schoolId,
  subjects,
  teachers,
}: {
  assignments: AssignmentSetting[];
  classes: ClassSectionSetting[];
  schoolId: string;
  subjects: SubjectSetting[];
  teachers: StaffSetting[];
}) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [message, setMessage] = useState<FormMessage>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!teacherId || !classId || !subjectId) {
      setMessage({ type: "error", text: "Choose teacher, class, and subject." });
      return;
    }
    const { error } = await createClient().from("teacher_assignments").insert({
      school_id: schoolId,
      teacher_id: teacherId,
      class_section_id: classId,
      subject_id: subjectId,
      academic_year: academicYear.trim() || null,
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Assignment added." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Teacher Assignment Management" description="Assign teachers to class, section, and subject combinations." />
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={add}>
          <FormMessage message={message} />
          <select className="h-10 rounded-md border bg-card px-3 text-sm" onChange={(e) => setTeacherId(e.target.value)} value={teacherId}>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-card px-3 text-sm" onChange={(e) => setClassId(e.target.value)} value={classId}>
            {classes.map((item) => <option key={item.id} value={item.id}>{classLabel(item)}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-card px-3 text-sm" onChange={(e) => setSubjectId(e.target.value)} value={subjectId}>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.subject_name}</option>)}
          </select>
          <input className="h-10 rounded-md border bg-card px-3 text-sm" onChange={(e) => setAcademicYear(e.target.value)} value={academicYear} />
          <Button className="md:col-span-4" type="submit">Assign teacher</Button>
        </form>
        <DataTable
          headers={["Teacher", "Class", "Subject", "Academic year"]}
          rows={assignments.map((assignment) => [
            assignment.teacherName,
            assignment.classLabel,
            assignment.subjectName,
            assignment.academic_year ?? "-",
          ])}
        />
      </CardContent>
    </Card>
  );
}

type FormMessage = { type: "success" | "error"; text: string } | null;

function FormMessage({ message }: { message: FormMessage }) {
  if (!message) return null;
  return (
    <div className={`rounded-md border px-3 py-2 text-sm lg:col-span-full md:col-span-full sm:col-span-full ${
      message.type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
    }`}>
      {message.text}
    </div>
  );
}

function Field({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <label className={`block text-sm font-medium ${className ?? ""}`}>
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function NumberInput({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" min="0" onChange={(e) => onChange(e.target.value)} type="number" value={value} />;
}

function toNumberOrNull(value: string) {
  return value.trim() ? Number(value) : null;
}

function classLabel(item: ClassSectionSetting) {
  return [item.class_name, item.section].filter(Boolean).join("");
}
