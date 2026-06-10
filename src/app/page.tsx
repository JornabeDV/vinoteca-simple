export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getDashboardData } from "@/lib/actions";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return <LandingPage />;
  }

  const data = await getDashboardData();

  return (
    <AppShell>
      <DashboardPage data={data} />
    </AppShell>
  );
}
