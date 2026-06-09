import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { SalesPage } from "@/components/sales/sales-page";
import { getSales } from "@/lib/actions";

export default async function Sales() {
  const sales = await getSales();

  return (
    <AppShell>
      <SalesPage sales={sales} />
    </AppShell>
  );
}
