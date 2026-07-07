import { AppShell } from "@/components/layout/app-shell";
import { CategoriesPage } from "@/components/categories/categories-page";
import { getCategories } from "@/lib/actions";
export default async function Categories() {
  const categories = await getCategories();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Categorías
          </h2>
          <p className="text-muted-foreground">
            Gestioná las categorías de tus productos
          </p>
        </div>
        <CategoriesPage categories={categories} />
      </div>
    </AppShell>
  );
}
