import { AppShell } from "@/components/layout/app-shell";
import { CustomerDetailPage } from "@/components/customers/customer-detail-page";
import { getCustomerById, getCustomerBalance } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function CustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, balance] = await Promise.all([
    getCustomerById(id),
    getCustomerBalance(id),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <AppShell>
      <CustomerDetailPage customer={customer as any} balance={balance as any} />
    </AppShell>
  );
}
