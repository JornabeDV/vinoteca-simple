import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { SalesPage } from "@/components/sales/sales-page";
import { getSales } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";

export default async function Sales() {
  const user = await getCurrentUser();
  const sales = await getSales();

  return (
    <AppShell>
      <SalesPage sales={sales} userRole={user?.role} />
    </AppShell>
  );
}
