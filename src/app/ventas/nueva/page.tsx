import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { NewSalePage } from "@/components/sales/new-sale-page";
import { getProducts } from "@/lib/actions";

export default async function NewSale() {
  const products = await getProducts();

  return (
    <AppShell>
      <NewSalePage products={products} />
    </AppShell>
  );
}
