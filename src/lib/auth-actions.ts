"use server";

import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function registerOwner(data: {
  name: string;
  businessName: string;
  email: string;
  password: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("El email ya está registrado");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Generar código único
  let inviteCode = generateInviteCode();
  let existingCode = await prisma.business.findUnique({
    where: { inviteCode },
  });
  while (existingCode) {
    inviteCode = generateInviteCode();
    existingCode = await prisma.business.findUnique({ where: { inviteCode } });
  }

  const user = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: data.businessName,
        inviteCode,
      },
    });

    return tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: UserRole.OWNER,
        businessId: business.id,
      },
    });
  });

  return { success: true, userId: user.id };
}

export async function registerEmployee(data: {
  name: string;
  email: string;
  password: string;
  inviteCode: string;
}) {
  const business = await prisma.business.findUnique({
    where: { inviteCode: data.inviteCode.toUpperCase() },
  });

  if (!business) {
    throw new Error("Código de invitación inválido");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("El email ya está registrado");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      businessId: business.id,
    },
  });

  return { success: true, userId: user.id };
}

export async function createEmployeeByOwner(data: {
  name: string;
  email: string;
  password: string;
  businessId: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("El email ya está registrado");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      businessId: data.businessId,
    },
  });

  revalidatePath("/usuarios");
  return { success: true, userId: user.id };
}

export async function getBusinessById(id: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    select: { id: true, name: true, inviteCode: true },
  });
  return business;
}
