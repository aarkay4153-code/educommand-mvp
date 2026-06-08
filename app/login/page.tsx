import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">EduCommand</h1>
            <p className="text-sm text-muted-foreground">School command dashboard</p>
          </div>
        </div>

        <Card>
          <CardHeader title="Sign in" description="Use the account created by your institution admin." />
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
