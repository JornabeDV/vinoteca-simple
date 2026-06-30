export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { PromotionForm } from "@/components/promos/promotion-form";
import { getProducts } from "@/lib/actions";

export default async function NewPromotion() {
  const products = await getProducts();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Nueva Promoción</h1>
          <p className="text-sm text-muted-foreground">
            Creá un combo con productos y asignale un precio especial.
          </p>
        </div>
        <PromotionForm products={products} />
      </div>
    </AppShell>
  );
}
