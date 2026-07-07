import { AppShell } from "@/components/layout/app-shell";
import { SupplierDebtForm } from "@/components/suppliers/supplier-debt-form";
import { getSupplierById } from "@/lib/supplier-actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NuevaDeuda({
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
      <SupplierDebtForm supplier={supplier} />
    </AppShell>
  );
}
