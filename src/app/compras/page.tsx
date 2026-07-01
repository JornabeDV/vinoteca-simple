import { AppShell } from "@/components/layout/app-shell";
import { PurchasesPage } from "@/components/purchases/purchases-page";
import { getPurchases } from "@/lib/purchase-actions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Compras() {
  const user = await getCurrentUser();
  if (user?.role !== "OWNER") {
    redirect("/ventas");
  }

  const purchases = await getPurchases();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Compras</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Registrá compras a proveedores y controlá stock y deudas.
          </p>
        </div>
        <PurchasesPage purchases={purchases} />
      </div>
    </AppShell>
  );
}
