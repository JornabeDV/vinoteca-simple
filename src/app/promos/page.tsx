export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { PromosPage } from "@/components/promos/promos-page";
import { getPromotions } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";

export default async function Promos() {
  const [promotions, user] = await Promise.all([
    getPromotions(),
    getCurrentUser(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Promociones</h1>
          <p className="text-sm text-muted-foreground">
            Armá combos y promos con tus productos.
          </p>
        </div>
        <PromosPage promotions={promotions} userRole={user?.role} />
      </div>
    </AppShell>
  );
}
