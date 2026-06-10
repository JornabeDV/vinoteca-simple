import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { ProductsPage } from "@/components/products/products-page";
import { getProducts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;

  const [products, user] = await Promise.all([
    getProducts(search, status as any),
    getCurrentUser(),
  ]);

  return (
    <AppShell>
      <ProductsPage products={products} userRole={user?.role} />
    </AppShell>
  );
}
