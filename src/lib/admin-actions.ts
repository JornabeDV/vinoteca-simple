"use server";

import { prisma } from "./prisma";
import { getCurrentUser } from "./session";
import { serializeData } from "./serialization";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

function requireAdmin(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) throw new Error("No autenticado");
  if (user.role !== "ADMIN") throw new Error("No tenés permisos para realizar esta acción");
  return user;
}

export async function getBusinesses() {
  const user = requireAdmin(await getCurrentUser());

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          sales: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return serializeData(businesses);
}

export async function getBusinessUsers(businessId: string) {
  requireAdmin(await getCurrentUser());

  const users = await prisma.user.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return serializeData(users);
}

export async function resetUserPassword(userId: string, newPassword: string) {
  requireAdmin(await getCurrentUser());

  if (!newPassword || newPassword.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  revalidatePath("/admin");
  return { success: true };
}
