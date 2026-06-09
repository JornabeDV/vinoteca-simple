import { AppShell } from "@/components/layout/app-shell";
import { ProductForm } from "@/components/products/product-form";

export default function NewProduct() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Nuevo Producto
          </h2>
          <p className="text-muted-foreground">
            Completa la información del nuevo vino
          </p>
        </div>
        <ProductForm />
      </div>
    </AppShell>
  );
}
