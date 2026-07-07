import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { EditSalePage } from "@/components/sales/edit-sale-page";
import { getProducts, getCustomers, getSaleById, getPromotions } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";
import { notFound } from "next/navigation";

export default async function EditSale({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sale, products, customers, promotions, user] = await Promise.all([
    getSaleById(id),
    getProducts(),
    getCustomers(),
    getPromotions(),
    getCurrentUser(),
  ]);

  if (!sale) {
    notFound();
  }

  return (
    <AppShell>
      <EditSalePage
        sale={sale}
        products={products}
        promotions={promotions}
        customers={customers}
        userRole={user?.role}
      />
    </AppShell>
  );
}
