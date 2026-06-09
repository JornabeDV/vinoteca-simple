import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getDashboardData } from "@/lib/actions";

export default async function Home() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <DashboardPage data={data} />
    </AppShell>
  );
}
