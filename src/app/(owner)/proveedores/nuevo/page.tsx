import { AppShell } from "@/components/layout/app-shell";
import { SupplierForm } from "@/components/suppliers/supplier-form";
export const dynamic = "force-dynamic";

export default async function NuevoProveedor() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Nuevo proveedor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Agregá un nuevo proveedor para registrar sus deudas y pagos.
          </p>
        </div>
        <SupplierForm />
      </div>
    </AppShell>
  );
}
