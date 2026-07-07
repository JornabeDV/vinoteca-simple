export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ExpensesPage } from "@/components/expenses/expenses-page";
import { getExpenses, getExpenseCategories } from "@/lib/actions";
export default async function Gastos() {
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
