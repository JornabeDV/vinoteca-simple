import { getCurrentUser } from "@/lib/session";
import { getBusinessById } from "@/lib/auth-actions";
import { Header } from "./header";
import { DesktopSidebar } from "./sidebar";
import { TourClientWrapper } from "@/components/onboarding/tour-wrapper";
import { redirect } from "next/navigation";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const business = user.businessId
    ? await getBusinessById(user.businessId)
    : null;

  return (
    <div className="min-h-full">
      {/* Desktop sidebar - fixed, outside document flow */}
      <DesktopSidebar userRole={user.role} businessName={business?.name} />

      {/* Main content area - offset on desktop */}
      <TourClientWrapper userRole={user?.role}>
        <div className="lg:ml-72">
          <Header user={user as any} businessName={business?.name} />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </TourClientWrapper>
    </div>
  );
}
