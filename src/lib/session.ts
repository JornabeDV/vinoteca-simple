import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * Use this in Server Pages that require an authenticated user belonging to a
 * business. Throws if the user is not authenticated or has no business.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  if (!user.businessId) {
    throw new Error("No pertenecés a ningún negocio");
  }
  return user;
}

/**
 * Use this in Server Pages that are restricted to OWNER only.
 */
export async function requireOwner() {
  const user = await requireAuth();
  if (user.role !== "OWNER") {
    throw new Error("No tenés permisos para realizar esta acción");
  }
  return user;
}
