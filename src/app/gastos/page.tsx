export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ExpensesPage } from "@/components/expenses/expenses-page";
import { getExpenses, getExpenseCategories } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Gastos() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "OWNER") {
    redirect("/ventas/nueva");
  }

  const [expenses, categories] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
  ]);

  return (
    <AppShell>
      <ExpensesPage expenses={expenses} categories={categories} />
    </AppShell>
  );
}
