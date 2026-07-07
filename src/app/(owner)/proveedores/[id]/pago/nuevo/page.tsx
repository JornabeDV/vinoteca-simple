import { AppShell } from "@/components/layout/app-shell";
import { SupplierPaymentForm } from "@/components/suppliers/supplier-payment-form";
import { getSupplierById } from "@/lib/supplier-actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NuevoPago({
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
      <SupplierPaymentForm supplier={supplier} />
    </AppShell>
  );
}
