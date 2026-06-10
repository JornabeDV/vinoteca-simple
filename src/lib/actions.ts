"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { MovementType, ProductStatus, Prisma } from "@prisma/client";
import { serializeData } from "./serialization";
import { getCurrentUser } from "./session";

function checkBusinessAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) throw new Error("No autenticado");
  if (!user.businessId) throw new Error("No perteneces a ningún negocio");
  return user as typeof user & { businessId: string };
}

// ─── Product Actions ───

export async function getProducts(search?: string, status?: ProductStatus) {
  const user = checkBusinessAccess(await getCurrentUser());

  const where: any = { businessId: user.businessId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { winery: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { varietal: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const products = await prisma.wineProduct.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return serializeData(products);
}

export async function getProductById(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const product = await prisma.wineProduct.findFirst({
    where: { id, businessId: user.businessId },
  });
  return serializeData(product);
}

export async function createProduct(data: {
  name: string;
  winery: string;
  category: string;
  varietal: string;
  vintage?: number | null;
  description?: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  image?: string;
}) {
  const user = checkBusinessAccess(await getCurrentUser());

  const product = await prisma.wineProduct.create({
    data: {
      ...data,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      businessId: user.businessId,
    },
  });

  if (data.currentStock > 0) {
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        userId: user.id,
        businessId: user.businessId,
        quantity: data.currentStock,
        type: MovementType.PURCHASE,
        notes: "Stock inicial",
      },
    });
  }

  revalidatePath("/productos");
  return serializeData(product);
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    winery?: string;
    category?: string;
    varietal?: string;
    vintage?: number | null;
    description?: string;
    costPrice?: number;
    salePrice?: number;
    minStock?: number;
    image?: string;
    status?: ProductStatus;
  }
) {
  const user = checkBusinessAccess(await getCurrentUser());

  const existing = await prisma.wineProduct.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Producto no encontrado");

  const product = await prisma.wineProduct.update({
    where: { id },
    data,
  });
  revalidatePath("/productos");
  return serializeData(product);
}

export async function archiveProduct(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const existing = await prisma.wineProduct.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Producto no encontrado");

  const product = await prisma.wineProduct.update({
    where: { id },
    data: { status: ProductStatus.ARCHIVED },
  });
  revalidatePath("/productos");
  return serializeData(product);
}

export async function activateProduct(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const existing = await prisma.wineProduct.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Producto no encontrado");

  const product = await prisma.wineProduct.update({
    where: { id },
    data: { status: ProductStatus.ACTIVE },
  });
  revalidatePath("/productos");
  return serializeData(product);
}

// ─── Inventory Actions ───

export async function getInventoryMovements(productId?: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const where: any = { businessId: user.businessId };
  if (productId) where.productId = productId;

  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: {
      product: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return serializeData(movements);
}

export async function adjustStock(data: {
  productId: string;
  userId: string;
  quantity: number;
  type: MovementType;
  notes?: string;
}) {
  const user = checkBusinessAccess(await getCurrentUser());

  const product = await prisma.wineProduct.findFirst({
    where: { id: data.productId, businessId: user.businessId },
  });

  if (!product) throw new Error("Producto no encontrado");

  const newStock = product.currentStock + data.quantity;
  if (newStock < 0) throw new Error("Stock insuficiente");

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        businessId: user.businessId,
        quantity: data.quantity,
        type: data.type,
        notes: data.notes,
      },
    }),
    prisma.wineProduct.update({
      where: { id: data.productId },
      data: { currentStock: newStock },
    }),
  ]);

  revalidatePath("/inventario");
  revalidatePath("/productos");
  revalidatePath("/");
  return movement;
}

// ─── Sale Actions ───

export async function getSales(search?: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const where: any = { businessId: user.businessId };
  if (search) {
    where.saleNumber = { contains: search, mode: "insensitive" };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return serializeData(sales);
}

const saleWithDetailsArgs = {
  include: {
    user: { select: { name: true, email: true } as const },
    items: { include: { product: true } },
  },
} satisfies Prisma.SaleFindFirstArgs;

export type SaleWithDetails = Prisma.SaleGetPayload<typeof saleWithDetailsArgs>;

export async function getSaleById(id: string): Promise<SaleWithDetails | null> {
  const user = checkBusinessAccess(await getCurrentUser());

  const sale = await prisma.sale.findFirst({
    where: { id, businessId: user.businessId },
    ...saleWithDetailsArgs,
  });
  return serializeData(sale);
}

export async function createSale(data: {
  userId: string;
  items: { productId: string; quantity: number }[];
}) {
  const user = checkBusinessAccess(await getCurrentUser());

  const saleNumber = `V-${Date.now()}`;
  let totalAmount = 0;

  const products = await prisma.wineProduct.findMany({
    where: {
      id: { in: data.items.map((i) => i.productId) },
      businessId: user.businessId,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate stock
  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Producto no encontrado");
    if (product.currentStock < item.quantity) {
      throw new Error(`Stock insuficiente para ${product.name}`);
    }
  }

  const sale = await prisma.$transaction(async (tx) => {
    const createdSale = await tx.sale.create({
      data: {
        saleNumber,
        userId: data.userId,
        businessId: user.businessId,
        totalAmount: 0,
      },
    });

    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.salePrice;
      const totalPrice = Number(unitPrice) * item.quantity;
      totalAmount += totalPrice;

      await tx.saleItem.create({
        data: {
          saleId: createdSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        },
      });

      await tx.wineProduct.update({
        where: { id: item.productId },
        data: { currentStock: product.currentStock - item.quantity },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          userId: data.userId,
          businessId: user.businessId,
          quantity: -item.quantity,
          type: MovementType.SALE,
          notes: `Venta ${saleNumber}`,
        },
      });
    }

    return tx.sale.update({
      where: { id: createdSale.id },
      data: { totalAmount },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });
  });

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/productos");
  revalidatePath("/");
  return serializeData(sale);
}

// ─── Dashboard Actions ───

export async function getDashboardData() {
  const user = checkBusinessAccess(await getCurrentUser());

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    salesToday,
    salesWeek,
    salesMonth,
    totalProducts,
    lowStockProducts,
    recentSales,
    topProducts,
    inventoryValue,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId: user.businessId, createdAt: { gte: startOfDay } },
      include: { items: { include: { product: true } } },
    }),
    prisma.sale.findMany({
      where: { businessId: user.businessId, createdAt: { gte: startOfWeek } },
    }),
    prisma.sale.findMany({
      where: { businessId: user.businessId, createdAt: { gte: startOfMonth } },
      include: { items: { include: { product: true } } },
    }),
    prisma.wineProduct.count({
      where: { businessId: user.businessId, status: ProductStatus.ACTIVE },
    }),
    prisma.wineProduct.findMany({
      where: {
        businessId: user.businessId,
        status: ProductStatus.ACTIVE,
        currentStock: { lte: prisma.wineProduct.fields.minStock },
      },
      orderBy: { currentStock: "asc" },
      take: 5,
    }),
    prisma.sale.findMany({
      where: { businessId: user.businessId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { businessId: user.businessId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.wineProduct.findMany({
      where: { businessId: user.businessId, status: ProductStatus.ACTIVE },
      select: { currentStock: true, costPrice: true },
    }),
  ]);

  const topProductIds = topProducts.map((p) => p.productId);
  const topProductDetails =
    topProductIds.length > 0
      ? await prisma.wineProduct.findMany({
          where: { businessId: user.businessId, id: { in: topProductIds } },
        })
      : [];

  const revenueToday = salesToday.reduce(
    (sum, s) => sum + Number(s.totalAmount),
    0
  );
  const revenueMonth = salesMonth.reduce(
    (sum, s) => sum + Number(s.totalAmount),
    0
  );
  const totalInventoryValue = inventoryValue.reduce(
    (sum, p) => sum + Number(p.costPrice) * p.currentStock,
    0
  );

  // Sales trend for chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const salesTrend = await Promise.all(
    last7Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      const daySales = await prisma.sale.findMany({
        where: {
          businessId: user.businessId,
          createdAt: { gte: date, lt: nextDay },
        },
      });
      return {
        date: date.toLocaleDateString("es-AR", { weekday: "short" }),
        sales: daySales.length,
        revenue: daySales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
      };
    })
  );

  return serializeData({
    salesToday: {
      count: salesToday.length,
      revenue: revenueToday,
    },
    salesWeek: salesWeek.length,
    salesMonth: {
      count: salesMonth.length,
      revenue: revenueMonth,
    },
    totalProducts,
    totalInventoryValue,
    lowStockProducts,
    recentSales,
    topProducts: topProducts.map((tp) => ({
      ...tp,
      product: topProductDetails.find((p) => p.id === tp.productId),
    })),
    salesTrend,
  });
}
