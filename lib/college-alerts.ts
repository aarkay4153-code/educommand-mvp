import { collegeAlerts } from "@/lib/college-mode-data";

export function generateCollegeCourseAlerts() {
  return collegeAlerts.map((alert) => ({
    ...alert,
    status: "new",
    generatedFrom: "college_mode_mvp",
  }));
}
