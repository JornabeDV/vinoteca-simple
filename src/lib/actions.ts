"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { MovementType, ProductStatus, ProductType, Prisma } from "@prisma/client";
import { serializeData } from "./serialization";
import { getCurrentUser } from "./session";

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

async function verifyBusinessAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  const u = checkBusinessAccess(user);
  const business = await prisma.business.findUnique({
    where: { id: u.businessId },
  });
  if (!business) {
    throw new Error(
      "Tu negocio no fue encontrado. Es probable que los datos hayan cambiado. Por favor, cerrá sesión y volvé a ingresar."
    );
  }
  return u;
}

// ─── Category Actions ───

export async function getCategories() {
  const user = checkBusinessAccess(await getCurrentUser());

  const categories = await prisma.category.findMany({
    where: { businessId: user.businessId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  return serializeData(categories);
}

export async function getCategoryById(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const category = await prisma.category.findFirst({
    where: { id, businessId: user.businessId },
  });
  return serializeData(category);
}

export async function getCategoryByName(name: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const category = await prisma.category.findFirst({
    where: {
      businessId: user.businessId,
      name: { equals: name, mode: "insensitive" },
    },
  });
  return serializeData(category);
}

export async function createCategory(data: {
  name: string;
  description?: string;
  color?: string;
}) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const category = await prisma.category.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim(),
      color: data.color?.trim(),
      businessId: user.businessId,
    },
  });

  revalidatePath("/productos");
  revalidatePath("/categorias");
  return serializeData(category);
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
  }
) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.category.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Categoría no encontrada");

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      description: data.description?.trim(),
      color: data.color?.trim(),
    },
  });

  revalidatePath("/productos");
  revalidatePath("/categorias");
  return serializeData(category);
}

export async function deleteCategory(id: string) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.category.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Categoría no encontrada");

  await prisma.category.delete({ where: { id } });

  revalidatePath("/productos");
  revalidatePath("/categorias");
  return { success: true };
}

// Helper: find or create a category by name within a transaction
async function upsertCategoryByName(
  tx: Prisma.TransactionClient,
  businessId: string,
  name: string
) {
  const normalizedName = name.trim();
  const existing = await tx.category.findFirst({
    where: {
      businessId,
      name: { equals: normalizedName, mode: "insensitive" },
    },
  });

  if (existing) return existing;

  return tx.category.create({
    data: {
      name: normalizedName,
      businessId,
    },
  });
}

// ─── Product Actions ───

export async function getProducts(search?: string, status?: ProductStatus) {
  const user = checkBusinessAccess(await getCurrentUser());

  const where: any = { businessId: user.businessId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { style: { contains: search, mode: "insensitive" } },
      { category: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status) where.status = status;

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return serializeData(products);
}

export async function getProductById(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const product = await prisma.product.findFirst({
    where: { id, businessId: user.businessId },
  });
  return serializeData(product);
}

export async function createProduct(data: {
  name: string;
  brand: string;
  categoryId?: string;
  categoryName?: string;
  style: string;
  year?: number | null;
  description?: string;
  productType?: ProductType;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  image?: string;
}) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const { categoryName, ...productData } = data;

  const product = await prisma.$transaction(async (tx) => {
    let categoryId = productData.categoryId;

    if (!categoryId && categoryName) {
      const category = await upsertCategoryByName(
        tx,
        user.businessId,
        categoryName
      );
      categoryId = category.id;
    }

    return tx.product.create({
      data: {
        ...productData,
        categoryId,
        costPrice: productData.costPrice,
        salePrice: productData.salePrice,
        businessId: user.businessId,
      },
      include: { category: true },
    });
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
    brand?: string;
    categoryId?: string;
    categoryName?: string;
    style?: string;
    year?: number | null;
    description?: string;
    productType?: ProductType;
    costPrice?: number;
    salePrice?: number;
    minStock?: number;
    image?: string;
    status?: ProductStatus;
  }
) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.product.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Producto no encontrado");

  const { categoryName, ...productData } = data;

  const product = await prisma.$transaction(async (tx) => {
    let categoryId = productData.categoryId;

    if (categoryName !== undefined && !categoryId) {
      const category = await upsertCategoryByName(
        tx,
        user.businessId,
        categoryName
      );
      categoryId = category.id;
    }

    return tx.product.update({
      where: { id },
      data: {
        ...productData,
        categoryId,
      },
    });
  });

  revalidatePath("/productos");
  return serializeData(product);
}

export async function archiveProduct(id: string) {
  const user = requireOwner(await getCurrentUser());

  const existing = await prisma.product.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Producto no encontrado");

  const product = await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.ARCHIVED },
  });
  revalidatePath("/productos");
  return serializeData(product);
}

export async function activateProduct(id: string) {
  const user = requireOwner(await getCurrentUser());

  const existing = await prisma.product.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Producto no encontrado");

  const product = await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.ACTIVE },
  });
  revalidatePath("/productos");
  return serializeData(product);
}

export async function deleteProduct(id: string) {
  const user = requireOwner(await getCurrentUser());

  const existing = await prisma.product.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Producto no encontrado");

  await prisma.product.delete({
    where: { id },
  });

  revalidatePath("/productos");
  revalidatePath("/inventario");
  revalidatePath("/");
  return { success: true };
}

export async function importProducts(
  items: Array<{
    name: string;
    brand: string;
    category: string;
    style: string;
    year?: number | null;
    productType?: string;
    description?: string;
    costPrice: number;
    salePrice: number;
    currentStock: number;
    minStock: number;
  }>
) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  if (!items.length) {
    return { success: false, error: "No hay productos para importar", count: 0 };
  }

  if (items.length > 500) {
    return { success: false, error: "Máximo 500 productos por importación", count: 0 };
  }

  // Map string productType to enum
  const parseProductType = (val?: string): ProductType => {
    if (!val) return ProductType.WINE;
    const upper = val.toUpperCase().trim();
    if (Object.values(ProductType).includes(upper as ProductType)) {
      return upper as ProductType;
    }
    return ProductType.WINE;
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdProducts = [];
      const movements = [];

      for (const item of items) {
        const category = await upsertCategoryByName(
          tx,
          user.businessId,
          item.category
        );

        const product = await tx.product.create({
          data: {
            name: item.name,
            brand: item.brand,
            categoryId: category.id,
            style: item.style,
            year: item.year ?? null,
            productType: parseProductType(item.productType),
            description: item.description,
            costPrice: item.costPrice,
            salePrice: item.salePrice,
            currentStock: item.currentStock,
            minStock: item.minStock,
            businessId: user.businessId,
          },
        });

        createdProducts.push(product);

        if (item.currentStock > 0) {
          movements.push(
            tx.inventoryMovement.create({
              data: {
                productId: product.id,
                userId: user.id,
                businessId: user.businessId,
                quantity: item.currentStock,
                type: MovementType.PURCHASE,
                notes: "Stock inicial (importación masiva)",
              },
            })
          );
        }
      }

      if (movements.length > 0) {
        await Promise.all(movements);
      }

      return createdProducts.length;
    });

    revalidatePath("/productos");
    revalidatePath("/inventario");
    revalidatePath("/");

    return { success: true, count: result };
  } catch (error: any) {
    console.error("Import error:", error);
    return {
      success: false,
      error: error.message || "Error al importar productos",
      count: 0,
    };
  }
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
    take: 300,
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
  const user = requireOwner(await getCurrentUser());

  const product = await prisma.product.findFirst({
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
    prisma.product.update({
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
      customer: { select: { name: true } },
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return serializeData(sales);
}

const saleWithDetailsArgs = {
  include: {
    user: { select: { name: true, email: true } as const },
    customer: { select: { name: true, id: true } as const },
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
  customerId?: string;
  isPaid?: boolean;
}) {
  const user = checkBusinessAccess(await getCurrentUser());

  if (data.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, businessId: user.businessId },
    });
    if (!customer) throw new Error("Cliente no encontrado");
  }

  const saleNumber = `V-${Date.now()}`;
  let totalAmount = 0;

  const products = await prisma.product.findMany({
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
        customerId: data.customerId,
        totalAmount: 0,
        isPaid: data.isPaid ?? true,
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

      await tx.product.update({
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

export async function updateSale(
  id: string,
  data: {
    userId: string;
    items: { productId: string; quantity: number }[];
    customerId?: string;
    isPaid?: boolean;
  }
) {
  const user = requireOwner(await getCurrentUser());

  const existingSale = await prisma.sale.findFirst({
    where: { id, businessId: user.businessId },
    include: { items: { include: { product: true } } },
  });
  if (!existingSale) throw new Error("Venta no encontrada");

  if (data.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, businessId: user.businessId },
    });
    if (!customer) throw new Error("Cliente no encontrado");
  }

  if (data.items.length === 0) throw new Error("La venta debe tener al menos un producto");

  const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: user.businessId },
  });

  if (products.length !== productIds.length) {
    throw new Error("Uno o más productos no fueron encontrados");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Stock disponible si revertimos los ítems originales de la venta
  const originalQtyByProduct = new Map<string, number>();
  for (const item of existingSale.items) {
    originalQtyByProduct.set(
      item.productId,
      (originalQtyByProduct.get(item.productId) || 0) + item.quantity
    );
  }

  const newQtyByProduct = new Map<string, number>();
  for (const item of data.items) {
    newQtyByProduct.set(item.productId, (newQtyByProduct.get(item.productId) || 0) + item.quantity);
  }

  // Validar stock considerando que primero se devolverá el stock original
  for (const [productId, newQty] of newQtyByProduct.entries()) {
    const product = productMap.get(productId)!;
    const originalQty = originalQtyByProduct.get(productId) || 0;
    const availableStock = product.currentStock + originalQty;
    if (availableStock < newQty) {
      throw new Error(`Stock insuficiente para ${product.name}`);
    }
  }

  let totalAmount = 0;

  const updatedSale = await prisma.$transaction(async (tx) => {
    // 1. Revertir stock original
    for (const [productId, originalQty] of originalQtyByProduct.entries()) {
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: originalQty } },
      });
    }

    // 2. Eliminar movimientos de inventario de la venta original
    await tx.inventoryMovement.deleteMany({
      where: {
        businessId: user.businessId,
        type: MovementType.SALE,
        notes: `Venta ${existingSale.saleNumber}`,
      },
    });

    // 3. Eliminar ítems originales
    await tx.saleItem.deleteMany({ where: { saleId: id } });

    // 4. Actualizar datos de la venta
    await tx.sale.update({
      where: { id },
      data: {
        customerId: data.customerId || null,
        isPaid: data.isPaid ?? true,
        totalAmount: 0,
      },
    });

    // 5. Crear nuevos ítems, descontar stock y registrar movimientos
    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.salePrice;
      const totalPrice = Number(unitPrice) * item.quantity;
      totalAmount += totalPrice;

      await tx.saleItem.create({
        data: {
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          userId: data.userId,
          businessId: user.businessId,
          quantity: -item.quantity,
          type: MovementType.SALE,
          notes: `Venta ${existingSale.saleNumber}`,
        },
      });
    }

    return tx.sale.update({
      where: { id },
      data: { totalAmount },
      include: {
        user: { select: { name: true, email: true } },
        customer: { select: { name: true, id: true } },
        items: { include: { product: true } },
      },
    });
  });

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/productos");
  revalidatePath("/");
  return serializeData(updatedSale);
}

export async function deleteSale(id: string) {
  const user = requireOwner(await getCurrentUser());

  const existingSale = await prisma.sale.findFirst({
    where: { id, businessId: user.businessId },
    include: { items: { include: { product: true } } },
  });
  if (!existingSale) throw new Error("Venta no encontrada");

  await prisma.$transaction(async (tx) => {
    // Revertir stock
    for (const item of existingSale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } },
      });
    }

    // Eliminar movimientos de inventario de la venta
    await tx.inventoryMovement.deleteMany({
      where: {
        businessId: user.businessId,
        type: MovementType.SALE,
        notes: `Venta ${existingSale.saleNumber}`,
      },
    });

    // Eliminar ítems y venta
    await tx.saleItem.deleteMany({ where: { saleId: id } });
    await tx.sale.delete({ where: { id } });
  });

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/productos");
  revalidatePath("/");
}

// ─── Dashboard Actions ───

export async function getDashboardData(chartDays: number = 7) {
  const user = checkBusinessAccess(await getCurrentUser());

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Comparative periods
  const startOfYesterday = new Date(startOfDay);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const [
    salesToday,
    salesWeek,
    salesMonth,
    salesYesterday,
    salesLastWeek,
    salesLastMonth,
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
    prisma.sale.findMany({
      where: { businessId: user.businessId, createdAt: { gte: startOfYesterday, lt: startOfDay } },
    }),
    prisma.sale.findMany({
      where: { businessId: user.businessId, createdAt: { gte: startOfLastWeek, lt: startOfWeek } },
    }),
    prisma.sale.findMany({
      where: { businessId: user.businessId, createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
    }),
    prisma.product.count({
      where: { businessId: user.businessId, status: ProductStatus.ACTIVE },
    }),
    prisma.product.findMany({
      where: {
        businessId: user.businessId,
        status: ProductStatus.ACTIVE,
        currentStock: { lte: prisma.product.fields.minStock },
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
    prisma.product.findMany({
      where: { businessId: user.businessId, status: ProductStatus.ACTIVE },
      select: { currentStock: true, costPrice: true },
    }),
  ]);

  const topProductIds = topProducts.map((p) => p.productId);
  const topProductDetails =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { businessId: user.businessId, id: { in: topProductIds } },
        })
      : [];

  const revenueToday = salesToday.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const revenueWeek = salesWeek.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const revenueMonth = salesMonth.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const revenueYesterday = salesYesterday.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const revenueLastWeek = salesLastWeek.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const revenueLastMonth = salesLastMonth.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  const avgTicketToday = salesToday.length > 0 ? revenueToday / salesToday.length : 0;
  const avgTicketYesterday = salesYesterday.length > 0 ? revenueYesterday / salesYesterday.length : 0;
  const avgTicketMonth = salesMonth.length > 0 ? revenueMonth / salesMonth.length : 0;
  const avgTicketLastMonth = salesLastMonth.length > 0 ? revenueLastMonth / salesLastMonth.length : 0;

  // Helper to calc % change
  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Sales trend for chart (dynamic days)
  const trendDates = Array.from({ length: chartDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (chartDays - 1 - i));
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const salesTrend = await Promise.all(
    trendDates.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      const daySales = await prisma.sale.findMany({
        where: {
          businessId: user.businessId,
          createdAt: { gte: date, lt: nextDay },
        },
      });
      return {
        date: date.toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
        sales: daySales.length,
        revenue: daySales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
      };
    })
  );

  return serializeData({
    salesToday: {
      count: salesToday.length,
      revenue: revenueToday,
      change: pctChange(revenueToday, revenueYesterday),
    },
    salesWeek: {
      count: salesWeek.length,
      revenue: revenueWeek,
      change: pctChange(revenueWeek, revenueLastWeek),
    },
    salesMonth: {
      count: salesMonth.length,
      revenue: revenueMonth,
      change: pctChange(revenueMonth, revenueLastMonth),
    },
    avgTicket: {
      today: avgTicketToday,
      month: avgTicketMonth,
      change: pctChange(avgTicketMonth, avgTicketLastMonth),
    },
    totalProducts,
    totalInventoryValue: inventoryValue.reduce((sum, p) => sum + Number(p.costPrice) * p.currentStock, 0),
    lowStockProducts,
    recentSales,
    topProducts: topProducts.map((tp) => ({
      ...tp,
      product: topProductDetails.find((p) => p.id === tp.productId),
    })),
    salesTrend,
  });
}

// ─── Bulk Price Update Action ───

export async function bulkUpdatePrices(data: {
  productIds: string[];
  type: "percentage" | "fixed";
  value: number;
  roundTo100?: boolean;
}) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  if (!data.productIds.length) {
    throw new Error("Seleccioná al menos un producto");
  }
  if (data.value <= 0) {
    throw new Error("El valor debe ser mayor a cero");
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: data.productIds },
      businessId: user.businessId,
    },
  });

  if (products.length !== data.productIds.length) {
    throw new Error("Algunos productos no fueron encontrados");
  }

  const updated = await prisma.$transaction(
    products.map((product) => {
      let newPrice: number;
      if (data.type === "percentage") {
        newPrice = Number(product.salePrice) * (1 + data.value / 100);
      } else {
        newPrice = Number(product.salePrice) + data.value;
      }

      if (data.roundTo100) {
        newPrice = Math.round(newPrice / 100) * 100;
      } else {
        newPrice = Math.round(newPrice);
      }

      // Ensure minimum sale price
      if (newPrice < Number(product.costPrice)) {
        newPrice = Number(product.costPrice);
      }

      return prisma.product.update({
        where: { id: product.id },
        data: { salePrice: newPrice },
      });
    })
  );

  revalidatePath("/productos");
  revalidatePath("/inventario");
  revalidatePath("/");
  return { success: true, count: updated.length };
}

// ─── Customer Actions ───

export async function getCustomers() {
  const user = checkBusinessAccess(await getCurrentUser());

  const customers = await prisma.customer.findMany({
    where: { businessId: user.businessId },
    orderBy: { name: "asc" },
    include: {
      sales: {
        where: { isPaid: false },
        select: { totalAmount: true },
      },
      payments: {
        select: { amount: true },
      },
    },
  });

  const withBalance = customers.map((customer) => {
    const debt = customer.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const paid = customer.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      ...customer,
      balance: debt - paid,
    };
  });

  return serializeData(withBalance);
}

export async function getCustomerById(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: user.businessId },
    include: {
      sales: {
        where: { isPaid: false },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return serializeData(customer);
}

export async function createCustomer(data: {
  name: string;
  email?: string;
  phone?: string;
  dni?: string;
  address?: string;
  notes?: string;
}) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const customer = await prisma.customer.create({
    data: {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      dni: data.dni?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      businessId: user.businessId,
    },
  });

  revalidatePath("/clientes");
  return serializeData(customer);
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    dni?: string;
    address?: string;
    notes?: string;
  }
) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.customer.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Cliente no encontrado");

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      dni: data.dni?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/clientes");
  return serializeData(customer);
}

export async function deleteCustomer(id: string) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.customer.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Cliente no encontrado");

  await prisma.customer.delete({ where: { id } });

  revalidatePath("/clientes");
  return { success: true };
}

export async function createPayment(data: {
  customerId: string;
  amount: number;
  notes?: string;
}) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, businessId: user.businessId },
  });
  if (!customer) throw new Error("Cliente no encontrado");

  const payment = await prisma.payment.create({
    data: {
      amount: data.amount,
      notes: data.notes?.trim(),
      customerId: data.customerId,
      businessId: user.businessId,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${data.customerId}`);
  return serializeData(payment);
}

export async function getCustomerBalance(customerId: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const [sales, payments] = await Promise.all([
    prisma.sale.findMany({
      where: {
        customerId,
        businessId: user.businessId,
        isPaid: false,
      },
    }),
    prisma.payment.findMany({
      where: {
        customerId,
        businessId: user.businessId,
      },
    }),
  ]);

  const totalDebt = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return serializeData({
    debt: totalDebt,
    paid: totalPaid,
    balance: totalDebt - totalPaid,
  });
}
