import { AppShell } from "@/components/layout/app-shell";
import { PurchaseDetailPage } from "@/components/purchases/purchase-detail-page";
import { getPurchaseById } from "@/lib/purchase-actions";
import { getCurrentUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CompraDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (user?.role !== "OWNER") {
    redirect("/ventas");
  }

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
