import { PageHeader } from "@/components/app/page-header";
import { CollegeCommandDashboard } from "@/components/college/college-command-dashboard";

export default function CollegeCommandPage() {
  return (
    <>
      <PageHeader
        title="College Command"
        description="Course-wise, department-wise and semester-wise command dashboard for College Mode."
      />
      <CollegeCommandDashboard />
    </>
  );
}
