export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { PromotionForm } from "@/components/promos/promotion-form";
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Editar Promoción</h1>
          <p className="text-sm text-muted-foreground">
            Modificá los productos o el precio de la promo.
          </p>
        </div>
        <PromotionForm promotion={promotion} products={products} />
      </div>
    </AppShell>
  );
}
