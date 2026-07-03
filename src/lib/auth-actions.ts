"use server";

import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./session";
import { z } from "zod";
import { cloudinary } from "./cloudinary";

function checkBusinessAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) throw new Error("No autenticado");
  if (!user.businessId) throw new Error("No pertenecés a ningún negocio");
  return user as typeof user & { businessId: string };
}

function requireOwner(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  const u = checkBusinessAccess(user);
  if (u.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");
  return u;
}

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
}) {
  const owner = requireOwner(await getCurrentUser());

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
      businessId: owner.businessId,
    },
  });

  revalidatePath("/usuarios");
  return { success: true, userId: user.id };
}

export async function deleteEmployee(userId: string) {
  const owner = requireOwner(await getCurrentUser());

  const target = await prisma.user.findFirst({
    where: { id: userId, businessId: owner.businessId },
  });

  if (!target) {
    throw new Error("Usuario no encontrado");
  }

  if (target.role === UserRole.OWNER) {
    throw new Error("No podés eliminar a un propietario");
  }

  if (target.id === owner.id) {
    throw new Error("No podés eliminarte a vos mismo");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function updateProfile(data: { name: string; email: string }) {
  const currentUser = checkBusinessAccess(await getCurrentUser());

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing && existing.id !== currentUser.id) {
    throw new Error("El email ya está en uso por otro usuario");
  }

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name: data.name,
      email: data.email,
    },
  });

  revalidatePath("/perfil");
  return { success: true, user };
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  const currentUser = checkBusinessAccess(await getCurrentUser());

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });

  if (!user || !user.password) {
    throw new Error("Usuario no encontrado");
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) {
    throw new Error("La contraseña actual es incorrecta");
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function getBusinessById(id: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    select: { id: true, name: true, logo: true, inviteCode: true },
  });
  return business;
}

const updateBusinessSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  logo: z.string().url("Debe ser una URL válida").optional().nullable(),
});

export async function updateBusiness(data: { name: string; logo?: string | null }) {
  const owner = requireOwner(await getCurrentUser());

  const parsed = updateBusinessSchema.safeParse(data);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    throw new Error(error?.message || "Datos inválidos");
  }

  const business = await prisma.business.update({
    where: { id: owner.businessId },
    data: {
      name: parsed.data.name,
      logo: parsed.data.logo ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/mi-vinoteca");

  return { success: true, business };
}

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const MAX_logo_sin_fondo_SIZE = 2 * 1024 * 1024; // 2MB

export async function uploadLogoToCloudinary(formData: FormData) {
  const owner = requireOwner(await getCurrentUser());
  const file = formData.get("logo") as File | null;

  if (!file) {
    throw new Error("No se proporcionó ninguna imagen");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato no válido. Usá PNG, JPG, WEBP o SVG.");
  }

  if (file.size > MAX_logo_sin_fondo_SIZE) {
    throw new Error("La imagen no debe superar los 2 MB.");
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "vinoteca-logos",
      public_id: `business-${owner.businessId}`,
      overwrite: true,
      resource_type: "image",
      transformation: [{ width: 400, height: 400, crop: "limit" }],
    });

    return { url: result.secure_url };
  } catch (error) {
    console.error("Error uploading logo to Cloudinary:", error);
    throw new Error("Error al subir el logo. Intentá de nuevo.");
  }
}
