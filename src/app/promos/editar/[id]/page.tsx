export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { PromotionForm } from "@/components/promos/promotion-form";
import { BackButton } from "@/components/ui/back-button";
import { getPromotionById, getProducts } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function EditPromotion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [promotion, products] = await Promise.all([
    getPromotionById(id),
    getProducts(),
  ]);

  if (!promotion) notFound();

  return (
    <AppShell>
      <div className="space-y-3 sm:space-y-6">
        <div className="flex flex-col gap-2">
          <BackButton href="/promos" />
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Editar Promoción
            </h2>
            <p className="text-muted-foreground">
              Modificá los productos o el precio de la promo.
            </p>
          </div>
        </div>
        <PromotionForm promotion={promotion} products={products} />
      </div>
    </AppShell>
  );
}
