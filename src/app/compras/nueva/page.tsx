import { AppShell } from "@/components/layout/app-shell";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { BackButton } from "@/components/ui/back-button";
import { getSuppliers } from "@/lib/supplier-actions";
import { getProducts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NuevaCompra() {
  const user = await getCurrentUser();
  if (user?.role !== "OWNER") {
    redirect("/ventas");
  }

  const [suppliers, products] = await Promise.all([getSuppliers(), getProducts()]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <BackButton href="/compras" />
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">Nueva compra</h2>
            <p className="text-muted-foreground">
              Registrá una compra, se actualizará el stock y se generará la deuda o el pago.
            </p>
          </div>
        </div>
        <PurchaseForm suppliers={suppliers} products={products} />
      </div>
    </AppShell>
  );
}
