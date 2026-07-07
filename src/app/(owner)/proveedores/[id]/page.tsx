import { AppShell } from "@/components/layout/app-shell";
import { SupplierDetailPage } from "@/components/suppliers/supplier-detail-page";
import { getSupplierById } from "@/lib/supplier-actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProveedorDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) {
    notFound();
  }

  return (
    <AppShell>
      <SupplierDetailPage supplier={supplier} />
    </AppShell>
  );
}
