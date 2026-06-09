import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { NewSalePage } from "@/components/sales/new-sale-page";
import { getProducts } from "@/lib/actions";

export default async function NewSale() {
  const products = await getProducts();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Nueva Venta
          </h2>
          <p className="text-muted-foreground">
            Registra una venta rápidamente
          </p>
        </div>
        <NewSalePage products={products} />
      </div>
    </AppShell>
  );
}
