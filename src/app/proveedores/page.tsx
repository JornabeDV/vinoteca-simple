import { AppShell } from "@/components/layout/app-shell";
import { SuppliersPage } from "@/components/suppliers/suppliers-page";
import { getSuppliers } from "@/lib/supplier-actions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Proveedores() {
  const user = await getCurrentUser();
  if (user?.role !== "OWNER") {
    redirect("/ventas");
  }

  const suppliers = await getSuppliers();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Proveedores</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Controlá las deudas y pagos a tus proveedores.
          </p>
        </div>
        <SuppliersPage suppliers={suppliers} />
      </div>
    </AppShell>
  );
}
