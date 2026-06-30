import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { EditSalePage } from "@/components/sales/edit-sale-page";
import { getProducts, getCustomers, getSaleById } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function EditSale({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sale, products, customers, user] = await Promise.all([
    getSaleById(id),
    getProducts(),
    getCustomers(),
    getCurrentUser(),
  ]);

  if (!sale) {
    notFound();
  }

  if (user?.role !== "OWNER") {
    redirect("/ventas");
  }

  return (
    <AppShell>
      <EditSalePage
        sale={sale}
        products={products}
        customers={customers}
        userRole={user?.role}
      />
    </AppShell>
  );
}
