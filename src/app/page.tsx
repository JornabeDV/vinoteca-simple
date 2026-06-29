export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/lib/session";
import { LandingPage } from "@/components/landing/landing-page";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return <LandingPage />;
  }

  redirect("/ventas/nueva");
}
