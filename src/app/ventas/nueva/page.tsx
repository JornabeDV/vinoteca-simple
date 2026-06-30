import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { NewSalePage } from "@/components/sales/new-sale-page";
import { getProducts, getCustomers } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";

export default async function NewSale() {
  const [products, customers, user] = await Promise.all([
    getProducts(),
    getCustomers(),
    getCurrentUser(),
  ]);

  return (
    <AppShell>
      <NewSalePage
        products={products}
        customers={customers}
        userRole={user?.role}
      />
    </AppShell>
  );
}
