import { AppShell } from "@/components/layout/app-shell";
import { ProductForm } from "@/components/products/product-form";
import { BackButton } from "@/components/ui/back-button";
import { getProductById, getCategories } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-3 sm:space-y-6">
        <div className="flex flex-col gap-2">
          <BackButton href="/productos" />
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Editar Producto
            </h2>
            <p className="text-muted-foreground">
              Modifica la información de {product.name}
            </p>
          </div>
        </div>
        <ProductForm product={product} categories={categories} />
      </div>
    </AppShell>
  );
}
