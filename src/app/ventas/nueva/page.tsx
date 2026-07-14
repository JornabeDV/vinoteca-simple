import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { NewSalePage } from "@/components/sales/new-sale-page";
import { getProducts, getCustomers, getPromotions } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";

export default async function NewSale() {
  const [products, promotions, user] = await Promise.all([
    getProducts(),
    getPromotions(),
    getCurrentUser(),
  ]);

  const isOwner = user?.role === "OWNER";
  const customers = isOwner ? await getCustomers() : [];

  return (
    <AppShell>
      <NewSalePage
        products={products}
        promotions={promotions}
        customers={customers}
        userRole={user?.role}
      />
    </AppShell>
  );
}
