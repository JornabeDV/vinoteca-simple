import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { InventoryPage } from "@/components/inventory/inventory-page";
import { getInventoryMovements, getProducts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";

export default async function Inventory() {
  const [movements, products, user] = await Promise.all([
    getInventoryMovements(),
    getProducts(),
    getCurrentUser(),
  ]);

  return (
    <AppShell>
      <InventoryPage movements={movements} products={products} userRole={user?.role} />
    </AppShell>
  );
}
