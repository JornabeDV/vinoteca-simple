"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { serializeData } from "./serialization";
import { getCurrentUser } from "./session";
import { SupplierDebtStatus, BusinessStatus } from "@prisma/client";

function checkBusinessAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) throw new Error("No autenticado");
  if (!user.businessId) throw new Error("No perteneces a ningún negocio");
  return user as typeof user & { businessId: string };
}

async function checkBusinessNotSuspended(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { status: true },
  });
  if (business?.status === BusinessStatus.SUSPENDED) {
    throw new Error("Tu negocio se encuentra suspendido. Contactá al soporte.");
  }
}

function requireOwner(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  const u = checkBusinessAccess(user);
  if (u.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");
  return u;
}

function maskCbuAlias(cbuAlias?: string | null): string | null {
  if (!cbuAlias) return null;
  if (cbuAlias.length <= 6) return "•••";
  return `${cbuAlias.slice(0, 3)}${"•".repeat(cbuAlias.length - 6)}${cbuAlias.slice(-3)}`;
}

// ─── Suppliers ───

export async function getSuppliers() {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const suppliers = await prisma.supplier.findMany({
    where: { businessId: user.businessId },
    include: {
      debts: true,
      payments: true,
    },
    orderBy: { name: "asc" },
    take: 500,
  });

  return serializeData(
    suppliers.map((s) => {
      const totalDebt = s.debts.reduce((sum, d) => sum + Number(d.totalAmount), 0);
      const totalPaid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const debtPaidOnDebts = s.debts.reduce((sum, d) => sum + Number(d.paidAmount), 0);
      const balance = totalDebt - totalPaid;
      const pendingBalance = totalDebt - debtPaidOnDebts;
      const overdueAmount = s.debts
        .filter(
          (d) =>
            d.status !== SupplierDebtStatus.PAID &&
            d.dueDate &&
            new Date(d.dueDate) < new Date()
        )
        .reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)), 0);

      return {
        ...s,
        cbuAlias: maskCbuAlias(s.cbuAlias),
        totalDebt,
        totalPaid,
        balance,
        pendingBalance,
        overdueAmount,
      };
    })
  );
}

export async function getSupplierById(id: string) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const supplier = await prisma.supplier.findFirst({
    where: { id, businessId: user.businessId },
    include: {
      debts: {
        include: { payments: true },
        orderBy: { issueDate: "desc" },
      },
      payments: {
        include: { debt: true },
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!supplier) return null;

  const totalDebt = supplier.debts.reduce((sum, d) => sum + Number(d.totalAmount), 0);
  const totalPaid = supplier.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const debtPaidOnDebts = supplier.debts.reduce((sum, d) => sum + Number(d.paidAmount), 0);
  const balance = totalDebt - totalPaid;
  const pendingBalance = totalDebt - debtPaidOnDebts;
  const overdueAmount = supplier.debts
    .filter(
      (d) =>
        d.status !== SupplierDebtStatus.PAID &&
        d.dueDate &&
        new Date(d.dueDate) < new Date()
    )
    .reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)), 0);

  return serializeData({
    ...supplier,
    totalDebt,
    totalPaid,
    balance,
    pendingBalance,
    overdueAmount,
  });
}

export async function createSupplier(data: {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  cbuAlias?: string;
  notes?: string;
}) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const supplier = await prisma.supplier.create({
    data: {
      name: data.name.trim(),
      contactName: data.contactName?.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim().toLowerCase(),
      cbuAlias: data.cbuAlias?.trim(),
      notes: data.notes?.trim(),
      businessId: user.businessId,
    },
  });

  revalidatePath("/proveedores");
  return serializeData(supplier);
}

export async function updateSupplier(
  id: string,
  data: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    cbuAlias?: string;
    notes?: string;
  }
) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const supplier = await prisma.supplier.updateMany({
    where: { id, businessId: user.businessId },
    data: {
      name: data.name.trim(),
      contactName: data.contactName?.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim().toLowerCase(),
      cbuAlias: data.cbuAlias?.trim(),
      notes: data.notes?.trim(),
    },
  });

  if (supplier.count === 0) throw new Error("Proveedor no encontrado");

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${id}`);
  return serializeData(
    await prisma.supplier.findFirst({ where: { id, businessId: user.businessId } })
  );
}

export async function deleteSupplier(id: string) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  await prisma.supplier.deleteMany({
    where: { id, businessId: user.businessId },
  });

  revalidatePath("/proveedores");
}

// ─── Debts ───

function computeDebtStatus(paid: number, total: number): SupplierDebtStatus {
  if (paid >= total) return SupplierDebtStatus.PAID;
  if (paid > 0) return SupplierDebtStatus.PARTIAL;
  return SupplierDebtStatus.PENDING;
}

export async function createSupplierDebt(data: {
  supplierId: string;
  invoiceNumber?: string;
  concept: string;
  totalAmount: number;
  issueDate?: Date;
  dueDate?: Date | null;
}) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  if (data.totalAmount < 0) throw new Error("El monto no puede ser negativo");

  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, businessId: user.businessId },
  });
  if (!supplier) throw new Error("Proveedor no encontrado");

  const debt = await prisma.supplierDebt.create({
    data: {
      supplierId: data.supplierId,
      businessId: user.businessId,
      invoiceNumber: data.invoiceNumber,
      concept: data.concept,
      totalAmount: data.totalAmount,
      paidAmount: 0,
      issueDate: data.issueDate || new Date(),
      dueDate: data.dueDate || null,
      status: SupplierDebtStatus.PENDING,
    },
  });

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${data.supplierId}`);
  return serializeData(debt);
}

export async function deleteSupplierDebt(id: string) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const debt = await prisma.supplierDebt.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!debt) throw new Error("Deuda no encontrada");

  await prisma.supplierDebt.deleteMany({
    where: { id, businessId: user.businessId },
  });

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${debt.supplierId}`);
}

// ─── Payments ───

export async function createSupplierPayment(data: {
  supplierId: string;
  debtId?: string | null;
  amount: number;
  paymentDate?: Date;
  paymentMethod?: string;
  notes?: string;
}) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  if (data.amount <= 0) throw new Error("El monto debe ser mayor a cero");

  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, businessId: user.businessId },
  });
  if (!supplier) throw new Error("Proveedor no encontrado");

  if (data.debtId) {
    const debt = await prisma.supplierDebt.findFirst({
      where: { id: data.debtId, supplierId: data.supplierId, businessId: user.businessId },
    });
    if (!debt) throw new Error("Deuda no encontrada");

    const remaining = Number(debt.totalAmount) - Number(debt.paidAmount);
    if (data.amount > remaining) {
      throw new Error("El pago supera el saldo pendiente de la deuda");
    }

    const newPaid = Number(debt.paidAmount) + data.amount;
    const newStatus = computeDebtStatus(newPaid, Number(debt.totalAmount));

    const [payment] = await prisma.$transaction([
      prisma.supplierPayment.create({
        data: {
          supplierId: data.supplierId,
          debtId: data.debtId,
          businessId: user.businessId,
          amount: data.amount,
          paymentDate: data.paymentDate || new Date(),
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        },
      }),
      prisma.supplierDebt.update({
        where: { id: data.debtId },
        data: { paidAmount: newPaid, status: newStatus },
      }),
    ]);

    revalidatePath("/proveedores");
    revalidatePath(`/proveedores/${data.supplierId}`);
    return serializeData(payment);
  }

  // Payment on account
  const payment = await prisma.supplierPayment.create({
    data: {
      supplierId: data.supplierId,
      businessId: user.businessId,
      amount: data.amount,
      paymentDate: data.paymentDate || new Date(),
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    },
  });

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${data.supplierId}`);
  return serializeData(payment);
}

export async function deleteSupplierPayment(id: string) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const payment = await prisma.supplierPayment.findFirst({
    where: { id, businessId: user.businessId },
    include: { debt: true },
  });
  if (!payment) throw new Error("Pago no encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.supplierPayment.deleteMany({
      where: { id, businessId: user.businessId },
    });

    if (payment.debtId && payment.debt) {
      const newPaid = Math.max(0, Number(payment.debt.paidAmount) - Number(payment.amount));
      const newStatus = computeDebtStatus(newPaid, Number(payment.debt.totalAmount));
      await tx.supplierDebt.update({
        where: { id: payment.debtId },
        data: { paidAmount: newPaid, status: newStatus },
      });
    }
  });

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${payment.supplierId}`);
}

// ─── Dashboard ───

export async function getSupplierDashboard() {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const [suppliers, debts, payments] = await Promise.all([
    prisma.supplier.findMany({
      where: { businessId: user.businessId },
      include: { debts: true, payments: true },
    }),
    prisma.supplierDebt.findMany({
      where: { businessId: user.businessId },
    }),
    prisma.supplierPayment.findMany({
      where: { businessId: user.businessId },
    }),
  ]);

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.totalAmount), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalBalance = totalDebt - totalPaid;
  const overdueAmount = debts
    .filter(
      (d) =>
        d.status !== SupplierDebtStatus.PAID &&
        d.dueDate &&
        new Date(d.dueDate) < new Date()
    )
    .reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)), 0);

  const topSuppliers = suppliers
    .map((s) => {
      const sDebt = s.debts.reduce((sum, d) => sum + Number(d.totalAmount), 0);
      const sPaid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return { id: s.id, name: s.name, balance: sDebt - sPaid };
    })
    .filter((s) => s.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  return serializeData({
    totalDebt,
    totalPaid,
    totalBalance,
    overdueAmount,
    supplierCount: suppliers.length,
    topSuppliers,
  });
}

export async function getUpcomingDueDebts(limit = 10) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const debts = await prisma.supplierDebt.findMany({
    where: {
      businessId: user.businessId,
      status: { not: SupplierDebtStatus.PAID },
      dueDate: { gte: new Date() },
    },
    include: { supplier: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: limit,
  });

  return serializeData(
    debts.map((d) => ({
      ...d,
      remaining: Number(d.totalAmount) - Number(d.paidAmount),
    }))
  );
}
