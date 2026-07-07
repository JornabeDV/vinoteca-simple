import { AppShell } from "@/components/layout/app-shell";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getSupplierById } from "@/lib/supplier-actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditarProveedor({
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
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Editar proveedor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Actualizá los datos de {supplier.name}.
          </p>
        </div>
        <SupplierForm supplier={supplier} />
      </div>
    </AppShell>
  );
}
