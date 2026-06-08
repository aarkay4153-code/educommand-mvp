import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  GraduationCap,
  School,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

const modeCards = [
  {
    title: "EduCommand for Schools",
    subtitle: "For Principals, Headmasters and School Management",
    button: "View School Demo",
    href: "/demo/school-dashboard",
    icon: School,
    features: [
      "Daily staff status",
      "Student attendance",
      "Syllabus coverage",
      "Timetable and substitution",
      "Board Command for Class 10 and Class 12",
      "Events and PTM readiness",
      "Compliance vault",
      "One-click school brief",
    ],
  },
  {
    title: "EduCommand for Colleges",
    subtitle: "For Directors, Principals, HODs, TPOs, Faculty and Management",
    button: "View College Demo",
    href: "/demo/college-dashboard",
    icon: GraduationCap,
    features: [
      "Course-wise command dashboards",
      "B.Tech, MBA, Diploma and Degree programme tracking",
      "Department-wise academic progress",
      "Semester syllabus and lab completion",
      "Internal and final exam readiness",
      "Fee pending dashboard",
      "Placement and internship command centre",
      "Accreditation readiness",
      "HOD and management reports",
    ],
  },
];

const operatingModes = [
  "School Mode",
  "College Mode",
  "Coaching Centre Mode",
  "Training Institute Mode",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden border-b bg-card">
        <div className="absolute inset-0 -z-10 opacity-80">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent to-transparent" />
        </div>

        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">EduCommand</span>
              <span className="block text-xs text-muted-foreground">Institution command dashboard</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/login"
            >
              Login
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-18">
          <div className="max-w-4xl">
            <Badge tone="info">One platform, multiple operating modes</Badge>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              One-glance command dashboard for schools and colleges.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Track staff, academics, tasks, events, compliance and institutional progress from one command board.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {operatingModes.map((mode) => (
                <span className="rounded-md border bg-background px-3 py-2 text-sm font-medium" key={mode}>
                  {mode}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {modeCards.map((card) => {
              const Icon = card.icon;
              return (
                <section className="rounded-lg border bg-card p-6 shadow-sm" key={card.title}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-semibold">{card.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.subtitle}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {card.features.map((feature) => (
                      <div className="flex items-start gap-2 text-sm" key={feature}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={card.href}
                  >
                    {card.button}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b bg-card py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold">Not an ERP. A command layer.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              EduCommand sits above daily operations to show leaders what needs attention now.
            </p>
          </div>
          {[
            ["Academics", "Syllabus, semester progress, internal exams and board readiness."],
            ["Operations", "Tasks, events, substitutions, complaints, maintenance and ownership."],
            ["Readiness", "Compliance alerts, inspection prep, accreditation files and institution briefs."],
          ].map(([title, text]) => (
            <div className="rounded-md border bg-background p-5" key={title}>
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold">Built for Indian institutions</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use the same platform for a school, college, coaching centre or training institute, with labels and dashboards shaped around that institution type.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Principals and Headmasters",
              "Directors and Management",
              "Coordinators and HODs",
              "Teachers and Faculty",
            ].map((label) => (
              <div className="flex items-center gap-3 rounded-md border bg-card p-4" key={label}>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Users className="h-5 w-5" />
                </span>
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-card py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>EduCommand</p>
          <p>One command dashboard for institutional progress.</p>
        </div>
      </footer>
    </main>
  );
}
