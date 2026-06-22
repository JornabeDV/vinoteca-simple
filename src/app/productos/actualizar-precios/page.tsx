import { AppShell } from "@/components/layout/app-shell";
import { BulkPriceUpdatePage } from "@/components/products/bulk-price-update-page";
import { getProducts } from "@/lib/actions";

export default async function BulkPriceUpdate() {
  const products = await getProducts();

  return (
    <AppShell>
      <BulkPriceUpdatePage products={products as any} />
    </AppShell>
  );
}
