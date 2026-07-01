import { AppShell } from "@/components/layout/app-shell";
import { SupplierDebtForm } from "@/components/suppliers/supplier-debt-form";
import { getSupplierById } from "@/lib/supplier-actions";
import { getCurrentUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NuevaDeuda({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (user?.role !== "OWNER") {
    redirect("/ventas");
  }

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
