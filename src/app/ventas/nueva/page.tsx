import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { NewSalePage } from "@/components/sales/new-sale-page";
import { getProducts, getCustomers } from "@/lib/actions";

export default async function NewSale() {
  const [products, customers] = await Promise.all([
    getProducts(),
    getCustomers(),
  ]);

  return (
    <AppShell>
      <NewSalePage products={products} customers={customers} />
    </AppShell>
  );
}
