import { AppShell } from "@/components/layout/app-shell";
import { PurchaseDetailPage } from "@/components/purchases/purchase-detail-page";
import { getPurchaseById } from "@/lib/purchase-actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CompraDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchase = await getPurchaseById(id);
  if (!purchase) {
    notFound();
  }

  return (
    <AppShell>
      <PurchaseDetailPage purchase={purchase} />
    </AppShell>
  );
}
