"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { serializeData } from "./serialization";
import { getCurrentUser } from "./session";
import { MovementType, SupplierDebtStatus } from "@prisma/client";

function checkBusinessAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) throw new Error("No autenticado");
  if (!user.businessId) throw new Error("No perteneces a ningún negocio");
  return user as typeof user & { businessId: string };
}

function requireOwner(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  const u = checkBusinessAccess(user);
  if (u.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");
  return u;
}

export async function getPurchases() {
  const user = checkBusinessAccess(await getCurrentUser());

  const purchases = await prisma.purchase.findMany({
    where: { businessId: user.businessId },
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true } } } },
      debts: true,
      payments: true,
    },
    orderBy: { purchaseDate: "desc" },
  });

  const serialized = serializeData(purchases);
  return serialized.map((p: any) => {
    const totalPaid = p.payments.reduce((sum: number, pay: any) => sum + Number(pay.amount), 0);
    const remaining = p.isPaid ? 0 : Number(p.totalAmount) - totalPaid;
    return { ...p, totalPaid, remaining };
  });
}

export async function getPurchaseById(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const purchase = await prisma.purchase.findFirst({
    where: { id, businessId: user.businessId },
    include: {
      supplier: true,
      items: { include: { product: true } },
      debts: { include: { payments: true } },
      payments: true,
      inventoryMovements: true,
    },
  });

  if (!purchase) return null;

  const serialized = serializeData(purchase);
  const totalPaid = serialized.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const remaining = Number(serialized.totalAmount) - totalPaid;

  return { ...serialized, totalPaid, remaining };
}

export async function createPurchase(data: {
  supplierId: string;
  invoiceNumber?: string;
  purchaseDate?: Date;
  notes?: string;
  isPaid: boolean;
  paymentMethod?: string;
  paymentDate?: Date;
  items: { productId: string; quantity: number; unitCost: number }[];
}) {
  const user = requireOwner(await getCurrentUser());

  if (data.items.length === 0) throw new Error("La compra debe tener al menos un producto");

  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, businessId: user.businessId },
  });
  if (!supplier) throw new Error("Proveedor no encontrado");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: user.businessId },
  });
  if (products.length !== productIds.length) {
    throw new Error("Uno o más productos no fueron encontrados");
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  const purchase = await prisma.$transaction(async (tx) => {
    const created = await tx.purchase.create({
      data: {
        supplierId: data.supplierId,
        businessId: user.businessId,
        invoiceNumber: data.invoiceNumber,
        totalAmount,
        purchaseDate: data.purchaseDate || new Date(),
        isPaid: data.isPaid,
        notes: data.notes,
      },
    });

    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      await tx.purchaseItem.create({
        data: {
          purchaseId: created.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: product.currentStock + item.quantity },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          userId: user.id,
          businessId: user.businessId,
          purchaseId: created.id,
          quantity: item.quantity,
          type: MovementType.PURCHASE,
          notes: `Compra ${data.invoiceNumber || created.id}`,
        },
      });
    }

    if (data.isPaid) {
      await tx.supplierPayment.create({
        data: {
          supplierId: data.supplierId,
          purchaseId: created.id,
          businessId: user.businessId,
          amount: totalAmount,
          paymentDate: data.paymentDate || new Date(),
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        },
      });
    } else {
      await tx.supplierDebt.create({
        data: {
          supplierId: data.supplierId,
          businessId: user.businessId,
          purchaseId: created.id,
          invoiceNumber: data.invoiceNumber,
          concept: `Compra ${data.invoiceNumber || created.id}`,
          totalAmount,
          paidAmount: 0,
          issueDate: data.purchaseDate || new Date(),
          status: SupplierDebtStatus.PENDING,
        },
      });
    }

    return created;
  });

  revalidatePath("/compras");
  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${data.supplierId}`);
  revalidatePath("/inventario");
  revalidatePath("/productos");
  return serializeData(purchase);
}

export async function updatePurchase(
  id: string,
  data: {
    supplierId: string;
    invoiceNumber?: string;
    purchaseDate?: Date;
    notes?: string;
    isPaid: boolean;
    paymentMethod?: string;
    paymentDate?: Date;
    items: { productId: string; quantity: number; unitCost: number }[];
  }
) {
  const user = requireOwner(await getCurrentUser());

  if (data.items.length === 0) throw new Error("La compra debe tener al menos un producto");

  const existing = await prisma.purchase.findFirst({
    where: { id, businessId: user.businessId },
    include: { items: true, inventoryMovements: true, debts: true, payments: true },
  });
  if (!existing) throw new Error("Compra no encontrada");

  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, businessId: user.businessId },
  });
  if (!supplier) throw new Error("Proveedor no encontrado");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: user.businessId },
  });
  if (products.length !== productIds.length) {
    throw new Error("Uno o más productos no fueron encontrados");
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  const purchase = await prisma.$transaction(async (tx) => {
    // Revert stock from original items
    for (const item of existing.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: Math.max(0, product.currentStock - item.quantity) },
        });
      }
    }

    // Clean up related records
    await tx.inventoryMovement.deleteMany({ where: { purchaseId: id, businessId: user.businessId } });
    await tx.supplierPayment.deleteMany({ where: { purchaseId: id, businessId: user.businessId } });
    await tx.supplierDebt.deleteMany({ where: { purchaseId: id, businessId: user.businessId } });
    await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

    // Update purchase
    const updated = await tx.purchase.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        totalAmount,
        purchaseDate: data.purchaseDate || new Date(),
        isPaid: data.isPaid,
        notes: data.notes,
      },
    });

    // Create new items and apply stock
    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      await tx.purchaseItem.create({
        data: {
          purchaseId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: product.currentStock + item.quantity },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          userId: user.id,
          businessId: user.businessId,
          purchaseId: id,
          quantity: item.quantity,
          type: MovementType.PURCHASE,
          notes: `Compra ${data.invoiceNumber || id}`,
        },
      });
    }

    if (data.isPaid) {
      await tx.supplierPayment.create({
        data: {
          supplierId: data.supplierId,
          purchaseId: id,
          businessId: user.businessId,
          amount: totalAmount,
          paymentDate: data.paymentDate || new Date(),
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        },
      });
    } else {
      await tx.supplierDebt.create({
        data: {
          supplierId: data.supplierId,
          businessId: user.businessId,
          purchaseId: id,
          invoiceNumber: data.invoiceNumber,
          concept: `Compra ${data.invoiceNumber || id}`,
          totalAmount,
          paidAmount: 0,
          issueDate: data.purchaseDate || new Date(),
          status: SupplierDebtStatus.PENDING,
        },
      });
    }

    return updated;
  });

  revalidatePath("/compras");
  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${data.supplierId}`);
  revalidatePath(`/proveedores/${existing.supplierId}`);
  revalidatePath("/inventario");
  revalidatePath("/productos");
  return serializeData(purchase);
}

export async function deletePurchase(id: string) {
  const user = requireOwner(await getCurrentUser());

  const purchase = await prisma.purchase.findFirst({
    where: { id, businessId: user.businessId },
    include: { items: true, inventoryMovements: true, debts: true, payments: true },
  });
  if (!purchase) throw new Error("Compra no encontrada");

  await prisma.$transaction(async (tx) => {
    for (const item of purchase.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (product) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: Math.max(0, product.currentStock - item.quantity) },
        });
      }
    }

    await tx.inventoryMovement.deleteMany({
      where: { purchaseId: id, businessId: user.businessId },
    });

    await tx.supplierPayment.deleteMany({
      where: { purchaseId: id, businessId: user.businessId },
    });

    await tx.supplierDebt.deleteMany({
      where: { purchaseId: id, businessId: user.businessId },
    });

    await tx.purchaseItem.deleteMany({
      where: { purchaseId: id },
    });

    await tx.purchase.deleteMany({
      where: { id, businessId: user.businessId },
    });
  });

  revalidatePath("/compras");
  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${purchase.supplierId}`);
  revalidatePath("/inventario");
  revalidatePath("/productos");
}
