export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getDashboardData } from "@/lib/actions";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ chart?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <LandingPage />;
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
