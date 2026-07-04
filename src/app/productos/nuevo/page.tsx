import { AppShell } from "@/components/layout/app-shell";
import { ProductForm } from "@/components/products/product-form";
import { BackButton } from "@/components/ui/back-button";
import { getCategories } from "@/lib/actions";

export default async function NewProduct() {
  const categories = await getCategories();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <BackButton href="/productos" />
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Nuevo Producto
            </h2>
            <p className="text-muted-foreground">
              Completa la información del nuevo vino
            </p>
          </div>
        </div>
        <ProductForm categories={categories} />
      </div>
    </AppShell>
  );
}
