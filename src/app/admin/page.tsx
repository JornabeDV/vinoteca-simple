import { AppShell } from "@/components/layout/app-shell";
import { getBusinesses } from "@/lib/admin-actions";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const businesses = await getBusinesses();

  return (
    <AppShell>
      <AdminDashboard businesses={businesses as any} />
    </AppShell>
  );
}
