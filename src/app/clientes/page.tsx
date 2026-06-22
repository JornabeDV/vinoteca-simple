import { AppShell } from "@/components/layout/app-shell";
import { CustomersPage } from "@/components/customers/customers-page";
import { getCustomers } from "@/lib/actions";

export default async function Customers() {
  const customers = await getCustomers();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Clientes
          </h2>
          <p className="text-muted-foreground">
            Gestioná tus clientes y sus cuentas corrientes
          </p>
        </div>
        <CustomersPage customers={customers} />
      </div>
    </AppShell>
  );
}
