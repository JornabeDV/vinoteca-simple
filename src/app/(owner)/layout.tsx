import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "OWNER") {
    redirect("/ventas/nueva");
  }

  return <>{children}</>;
}
