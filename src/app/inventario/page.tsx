import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { InventoryPage } from "@/components/inventory/inventory-page";
import { getInventoryMovements, getProducts } from "@/lib/actions";

export default async function Inventory() {
  const [movements, products] = await Promise.all([
    getInventoryMovements(),
    getProducts(),
  ]);

  return (
    <AppShell>
      <InventoryPage movements={movements} products={products} />
    </AppShell>
  );
}
