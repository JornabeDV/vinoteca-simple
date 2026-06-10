import { getCurrentUser } from "@/lib/session";
import { Header } from "./header";
import { DesktopSidebar } from "./sidebar";
import { redirect } from "next/navigation";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-full">
      {/* Desktop sidebar - fixed, outside document flow */}
      <DesktopSidebar userRole={user.role} />

      {/* Main content area - offset on desktop */}
      <div className="lg:ml-72">
        <Header user={user as any} />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
