export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { PromotionForm } from "@/components/promos/promotion-form";
import { BackButton } from "@/components/ui/back-button";
import { getProducts } from "@/lib/actions";
export default async function NewPromotion() {
  const products = await getProducts();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <BackButton href="/promos" />
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Nueva Promoción
            </h2>
            <p className="text-muted-foreground">
              Creá un combo con productos y asignale un precio especial.
            </p>
          </div>
        </div>
        <PromotionForm products={products} />
      </div>
    </AppShell>
  );
}
