import { AppShell } from "@/components/layout/app-shell";
import { ProductForm } from "@/components/products/product-form";
import { getProductById } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Editar Producto
          </h2>
          <p className="text-muted-foreground">
            Modifica la información de {product.name}
          </p>
        </div>
        <ProductForm product={product} />
      </div>
    </AppShell>
  );
}
