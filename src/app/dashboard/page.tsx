export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getDashboardData } from "@/lib/actions";

export default async function DashboardRoute({
  searchParams,
}: {
  searchParams: Promise<{ chart?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "OWNER") {
    redirect("/ventas/nueva");
  }

  const { chart } = await searchParams;
  const chartDays = chart === "30" ? 30 : chart === "365" ? 365 : 7;
  const data = await getDashboardData(chartDays);

  return (
    <AppShell>
      <DashboardPage data={data} chartDays={chartDays} />
    </AppShell>
  );
}
