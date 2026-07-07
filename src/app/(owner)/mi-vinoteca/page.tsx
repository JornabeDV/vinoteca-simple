import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getBusinessById } from "@/lib/auth-actions";
import { MiVinotecaForm } from "@/components/business/mi-vinoteca-form";
import { Store } from "lucide-react";

export default async function MiVinotecaPage() {
  const user = await getCurrentUser();

  if (!user!.businessId) {
    redirect("/ventas/nueva");
  }

  const business = await getBusinessById(user!.businessId);

  if (!business) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground">No se encontró la vinoteca.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight flex items-center gap-2">
            Mi Vinoteca
          </h2>
          <p className="text-muted-foreground">
            Personalizá el nombre y el logo de tu vinoteca.
          </p>
        </div>

        <MiVinotecaForm business={business} />
      </div>
    </AppShell>
  );
}
