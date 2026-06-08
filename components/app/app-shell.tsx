import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileNav } from "@/components/app/mobile-nav";
import { ModuleGate } from "@/components/app/module-gate";
import { Sidebar } from "@/components/app/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, supabaseConfigError } from "@/lib/supabase/config";
import { isAppRole, type AppRole } from "@/lib/permissions";
import {
  defaultModulesByInstitutionType,
  isInstitutionType,
  moduleRowsToEnabledSet,
  type InstitutionType,
  type ModuleKey,
  type SchoolModule,
} from "@/lib/modules";

type Profile = {
  full_name: string;
  role: string;
  school_id: string | null;
};

type SchoolShellRow = {
  name: string;
  institution_type: string | null;
};

const missingProfileMessage =
  "Your account exists, but your EduCommand profile has not been configured. Please contact the institution admin.";

export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <AuthenticatedShell schoolName="EduCommand" userName="Configuration needed" userRole="setup">
        <Card>
          <CardHeader title="Supabase setup needed" description="Authentication is not ready yet." />
          <CardContent className="text-sm text-muted-foreground">{supabaseConfigError}</CardContent>
        </Card>
      </AuthenticatedShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, school_id")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile) {
    return (
      <AuthenticatedShell schoolName="EduCommand" userName={user.email ?? "Signed-in user"} userRole="unconfigured">
        <Card>
          <CardHeader title="Profile not configured" description="Your login was successful." />
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">{missingProfileMessage}</p>
            <LogoutButton />
          </CardContent>
        </Card>
      </AuthenticatedShell>
    );
  }

  let schoolName = "EduCommand";
  let institutionType: InstitutionType = "school";
  let enabledModules: ModuleKey[] = defaultModulesByInstitutionType.school;

  if (profile.school_id) {
    const { data: school } = await supabase
      .from("schools")
      .select("name, institution_type")
      .eq("id", profile.school_id)
      .maybeSingle<SchoolShellRow>();

    if (school?.name) {
      schoolName = school.name;
    }

    if (isInstitutionType(school?.institution_type)) {
      institutionType = school.institution_type;
    }

    const { data: moduleRows } = await supabase
      .from("school_modules")
      .select("module_key, is_enabled")
      .eq("school_id", profile.school_id);

    enabledModules = Array.from(
      moduleRowsToEnabledSet((moduleRows ?? []) as SchoolModule[], institutionType),
    );
  }

  return (
    <AuthenticatedShell
      role={isAppRole(profile.role) ? profile.role : null}
      enabledModules={enabledModules}
      institutionType={institutionType}
      schoolName={schoolName}
      userName={profile.full_name}
      userRole={profile.role}
    >
      {children}
    </AuthenticatedShell>
  );
}

function AuthenticatedShell({
  children,
  enabledModules = defaultModulesByInstitutionType.school,
  institutionType = "school",
  role,
  schoolName,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  enabledModules?: ModuleKey[];
  institutionType?: InstitutionType;
  role?: AppRole | null;
  schoolName: string;
  userName: string;
  userRole: string;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar enabledModules={enabledModules} institutionType={institutionType} role={role ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-sm font-semibold">{schoolName}</p>
            <p className="text-xs text-muted-foreground">Command dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Badge tone="info">{userRole}</Badge>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <ModuleGate enabledModules={enabledModules} institutionType={institutionType} role={role ?? null}>{children}</ModuleGate>
        </main>
        <MobileNav enabledModules={enabledModules} institutionType={institutionType} role={role ?? null} />
      </div>
    </div>
  );
}
