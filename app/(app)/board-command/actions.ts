"use server";

import { refreshBoardAlertsForCurrentUser } from "@/lib/board-command-alerts.server";

export async function refreshBoardAlerts() {
  return refreshBoardAlertsForCurrentUser({ revalidate: true });
}
