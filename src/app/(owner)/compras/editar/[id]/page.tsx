import { AppShell } from "@/components/layout/app-shell";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { BackButton } from "@/components/ui/back-button";
import { getPurchaseById } from "@/lib/purchase-actions";
import { getSuppliers } from "@/lib/supplier-actions";
import { getProducts } from "@/lib/actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditarCompra({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [purchase, suppliers, products] = await Promise.all([
    getPurchaseById(id),
    getSuppliers(),
    getProducts(),
  ]);

  if (!purchase) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <BackButton href="/compras" />
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Editar compra
            </h2>
            <p className="text-muted-foreground">
              Modificá los datos, productos o estado de pago de la compra.
            </p>
          </div>
        </div>
        <PurchaseForm suppliers={suppliers} products={products} purchase={purchase} />
      </div>
    </AppShell>
  );
}
