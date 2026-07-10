"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { MovementType, ProductStatus, ProductType, PaymentMethod, Prisma, BusinessStatus } from "@prisma/client";
import { serializeData } from "./serialization";
import { getCurrentUser } from "./session";

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
  if (business.status === BusinessStatus.SUSPENDED) {
    throw new Error("Tu negocio se encuentra suspendido. Contactá al soporte.");
  }
  return u;
}

const categorySelect = {
  id: true,
  name: true,
  description: true,
  color: true,
  businessId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

// Field selectors that avoid leaking sensitive data to non-owner roles.
const publicProductSelect = {
  id: true,
  name: true,
  brand: true,
  style: true,
  year: true,
  description: true,
  productType: true,
  salePrice: true,
  currentStock: true,
  minStock: true,
  image: true,
  status: true,
  categoryId: true,
  businessId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: categorySelect },
} satisfies Prisma.ProductSelect;

const ownerProductSelect = {
  ...publicProductSelect,
  costPrice: true,
} satisfies Prisma.ProductSelect;

function productSelectForRole(role?: string) {
  return role === "OWNER" ? ownerProductSelect : publicProductSelect;
}

function userSelectForRole(role?: string) {
  return role === "OWNER"
    ? ({ name: true, email: true } as const)
    : ({ name: true } as const);
}

function promotionSelectForRole(role?: string) {
  return {
    id: true,
    name: true,
    description: true,
    salePrice: true,
    status: true,
    businessId: true,
    createdAt: true,
    updatedAt: true,
    items: {
      select: {
        id: true,
        promotionId: true,
        productId: true,
        quantity: true,
        product: { select: productSelectForRole(role) },
      },
    },
  } satisfies Prisma.PromotionSelect;
}

function saleIncludeForRole(role?: string) {
  return {
    user: { select: userSelectForRole(role) },
    customer: { select: { name: true, id: true } as const },
    items: {
      include: {
        product: { select: productSelectForRole(role) },
      },
    },
    salePromotions: {
      include: {
        items: {
          include: {
            product: { select: productSelectForRole(role) },
          },
        },
      },
    },
  };
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
  await checkBusinessNotSuspended(user.businessId);

  const where: Prisma.ProductWhereInput = { businessId: user.businessId };
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
    select: productSelectForRole(user.role),
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return serializeData(products);
}

export async function getProductById(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const product = await prisma.product.findFirst({
    where: { id, businessId: user.businessId },
    select: productSelectForRole(user.role),
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

    if (categoryId) {
      const category = await tx.category.findFirst({
        where: { id: categoryId, businessId: user.businessId },
      });
      if (!category) throw new Error("Categoría inválida");
    }

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

    if (categoryId) {
      const category = await tx.category.findFirst({
        where: { id: categoryId, businessId: user.businessId },
      });
      if (!category) throw new Error("Categoría inválida");
    }

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

// ─── Promotion Actions ───

export async function getPromotions(status?: ProductStatus) {
  const user = checkBusinessAccess(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const where: Prisma.PromotionWhereInput = { businessId: user.businessId };
  if (status) where.status = status;

  const promotions = await prisma.promotion.findMany({
    where,
    select: promotionSelectForRole(user.role),
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return serializeData(promotions);
}

export async function getPromotionById(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const promotion = await prisma.promotion.findFirst({
    where: { id, businessId: user.businessId },
    select: promotionSelectForRole(user.role),
  });
  return serializeData(promotion);
}

export async function createPromotion(data: {
  name: string;
  description?: string;
  salePrice: number;
  items: { productId: string; quantity: number }[];
}) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  if (!data.items.length) throw new Error("La promo debe tener al menos un producto");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: user.businessId },
  });
  if (products.length !== productIds.length) throw new Error("Uno o más productos no fueron encontrados");

  const promotion = await prisma.promotion.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim(),
      salePrice: data.salePrice,
      businessId: user.businessId,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    },
    select: promotionSelectForRole(user.role),
  });

  revalidatePath("/promos");
  return serializeData(promotion);
}

export async function updatePromotion(
  id: string,
  data: {
    name?: string;
    description?: string;
    salePrice?: number;
    status?: ProductStatus;
    items?: { productId: string; quantity: number }[];
  }
) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.promotion.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Promoción no encontrada");

  if (data.items && data.items.length === 0) {
    throw new Error("La promo debe tener al menos un producto");
  }

  if (data.items) {
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, businessId: user.businessId },
    });
    if (products.length !== productIds.length) {
      throw new Error("Uno o más productos no fueron encontrados");
    }
  }

  const promotion = await prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.promotionItem.deleteMany({ where: { promotionId: id } });
    }

    return tx.promotion.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        description: data.description?.trim(),
        salePrice: data.salePrice,
        status: data.status,
        items: data.items
          ? {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            }
          : undefined,
      },
      select: promotionSelectForRole(user.role),
    });
  });

  revalidatePath("/promos");
  return serializeData(promotion);
}

export async function archivePromotion(id: string) {
  const user = requireOwner(await getCurrentUser());

  const existing = await prisma.promotion.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Promoción no encontrada");

  const promotion = await prisma.promotion.update({
    where: { id },
    data: { status: ProductStatus.ARCHIVED },
  });

  revalidatePath("/promos");
  return serializeData(promotion);
}

export async function activatePromotion(id: string) {
  const user = requireOwner(await getCurrentUser());

  const existing = await prisma.promotion.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Promoción no encontrada");

  const promotion = await prisma.promotion.update({
    where: { id },
    data: { status: ProductStatus.ACTIVE },
  });

  revalidatePath("/promos");
  return serializeData(promotion);
}

export async function deletePromotion(id: string) {
  const user = requireOwner(await getCurrentUser());

  const existing = await prisma.promotion.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Promoción no encontrada");

  await prisma.promotion.delete({ where: { id } });

  revalidatePath("/promos");
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
    const synonyms: Record<string, ProductType> = {
      VINO: ProductType.WINE,
      CERVEZA: ProductType.BEER,
      DESTILADO: ProductType.SPIRIT,
      AGUA: ProductType.WATER,
      "SIN ALCOHOL": ProductType.NON_ALCOHOLIC,
      SIN_ALCOHOL: ProductType.NON_ALCOHOLIC,
      "NO ALCOHOLIC": ProductType.NON_ALCOHOLIC,
      "NON ALCOHOLIC": ProductType.NON_ALCOHOLIC,
      "BEBIDA SIN ALCOHOL": ProductType.NON_ALCOHOLIC,
      GASEOSA: ProductType.NON_ALCOHOLIC,
      JUGO: ProductType.NON_ALCOHOLIC,
      ENERGIZANTE: ProductType.NON_ALCOHOLIC,
      OTRO: ProductType.OTHER,
    };
    return synonyms[upper] || ProductType.WINE;
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
  } catch (error) {
    console.error("Import error");
    return {
      success: false,
      error: "Error al importar productos. Verificá el formato y volvé a intentar.",
      count: 0,
    };
  }
}

// ─── Inventory Actions ───

export async function getInventoryMovements(productId?: string) {
  const user = checkBusinessAccess(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const where: Prisma.InventoryMovementWhereInput = { businessId: user.businessId };
  if (productId) where.productId = productId;

  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: {
      product: { select: productSelectForRole(user.role) },
      user: { select: userSelectForRole(user.role) },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return serializeData(movements);
}

export async function adjustStock(data: {
  productId: string;
  quantity: number;
  type: MovementType;
  notes?: string;
}) {
  const user = checkBusinessAccess(await getCurrentUser());

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
        userId: user.id,
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
  await checkBusinessNotSuspended(user.businessId);

  const where: Prisma.SaleWhereInput = { businessId: user.businessId };
  if (search) {
    where.saleNumber = { contains: search, mode: "insensitive" };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: saleIncludeForRole(user.role),
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return serializeData(sales);
}

function saleWithDetailsArgs(role?: string) {
  return {
    include: saleIncludeForRole(role),
  } satisfies Prisma.SaleFindFirstArgs;
}

export type SaleWithDetails = Prisma.SaleGetPayload<ReturnType<typeof saleWithDetailsArgs>>;

export async function getSaleById(id: string): Promise<SaleWithDetails | null> {
  const user = checkBusinessAccess(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const sale = await prisma.sale.findFirst({
    where: { id, businessId: user.businessId },
    ...saleWithDetailsArgs(user.role),
  });
  return serializeData(sale);
}

export async function createSale(data: {
  items: { productId: string; quantity: number }[];
  promotions?: { promotionId: string; quantity: number }[];
  customerId?: string;
  isPaid?: boolean;
  paymentMethod?: string;
  discountPercentage?: number;
}) {
  const user = checkBusinessAccess(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  if (!data.items.length && (!data.promotions || !data.promotions.length)) {
    throw new Error("La venta debe tener al menos un producto o promo");
  }

  for (const item of data.items) {
    if (!item.productId || item.quantity <= 0) {
      throw new Error("Cantidad inválida");
    }
  }
  for (const promo of data.promotions || []) {
    if (!promo.promotionId || promo.quantity <= 0) {
      throw new Error("Cantidad de promo inválida");
    }
  }

  if (data.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, businessId: user.businessId },
    });
    if (!customer) throw new Error("Cliente no encontrado");
  }

  const saleNumber = `V-${Date.now()}`;
  let subtotal = 0;

  const promotions = data.promotions?.length
    ? await prisma.promotion.findMany({
        where: {
          id: { in: data.promotions.map((p) => p.promotionId) },
          businessId: user.businessId,
          status: ProductStatus.ACTIVE,
        },
        include: { items: true },
      })
    : [];

  if (data.promotions && promotions.length !== data.promotions.length) {
    throw new Error("Una o más promociones no fueron encontradas");
  }

  const promotionMap = new Map(promotions.map((p) => [p.id, p]));

  // Aggregate stock needed per product (items + promotions)
  const stockNeeded = new Map<string, number>();
  for (const item of data.items) {
    stockNeeded.set(item.productId, (stockNeeded.get(item.productId) || 0) + item.quantity);
  }
  for (const promo of data.promotions || []) {
    const promotion = promotionMap.get(promo.promotionId)!;
    for (const promoItem of promotion.items) {
      stockNeeded.set(
        promoItem.productId,
        (stockNeeded.get(promoItem.productId) || 0) + promoItem.quantity * promo.quantity
      );
    }
  }

  const productIds = Array.from(stockNeeded.keys());
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: user.businessId },
  });

  if (products.length !== productIds.length) {
    throw new Error("Uno o más productos no fueron encontrados");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate stock
  for (const [productId, needed] of stockNeeded.entries()) {
    const product = productMap.get(productId)!;
    if (product.currentStock < needed) {
      throw new Error(`Stock insuficiente para ${product.name}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    const createdSale = await tx.sale.create({
      data: {
        saleNumber,
        userId: user.id,
        businessId: user.businessId,
        customerId: data.customerId,
        totalAmount: 0,
        isPaid: data.isPaid ?? true,
        paymentMethod:
          data.paymentMethod && Object.values(PaymentMethod).includes(data.paymentMethod as PaymentMethod)
            ? (data.paymentMethod as PaymentMethod)
            : PaymentMethod.CASH,
      },
    });

    // Create regular sale items
    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.salePrice;
      const totalPrice = Number(unitPrice) * item.quantity;
      subtotal += totalPrice;

      await tx.saleItem.create({
        data: {
          saleId: createdSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        },
      });
    }

    // Create promotion sale lines
    for (const promo of data.promotions || []) {
      const promotion = promotionMap.get(promo.promotionId)!;
      const unitPrice = promotion.salePrice;
      const totalPrice = Number(unitPrice) * promo.quantity;
      subtotal += totalPrice;

      const salePromotion = await tx.salePromotion.create({
        data: {
          saleId: createdSale.id,
          promotionId: promotion.id,
          name: promotion.name,
          salePrice: unitPrice,
          quantity: promo.quantity,
          totalPrice,
        },
      });

      for (const promoItem of promotion.items) {
        await tx.salePromotionItem.create({
          data: {
            salePromotionId: salePromotion.id,
            productId: promoItem.productId,
            quantity: promoItem.quantity * promo.quantity,
          },
        });
      }
    }

    // Update stock and create inventory movements
    for (const [productId, needed] of stockNeeded.entries()) {
      const product = productMap.get(productId)!;
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: product.currentStock - needed },
      });

      await tx.inventoryMovement.create({
        data: {
          productId,
          userId: user.id,
          businessId: user.businessId,
          quantity: -needed,
          type: MovementType.SALE,
          notes: `Venta ${saleNumber}`,
        },
      });
    }

    const discountPercentage = Math.max(0, Math.min(100, Math.round(data.discountPercentage || 0)));
    const discountAmount = Math.round((subtotal * discountPercentage) / 100);
    const totalAmount = subtotal - discountAmount;

    await tx.sale.update({
      where: { id: createdSale.id },
      data: {
        totalAmount,
        discountPercentage,
        discountAmount,
      },
    });
  });

  const sale = await prisma.sale.findFirst({
    where: { saleNumber, businessId: user.businessId },
    ...saleWithDetailsArgs(user.role),
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
    items: { productId: string; quantity: number }[];
    promotions?: { promotionId: string; quantity: number }[];
    customerId?: string;
    isPaid?: boolean;
    paymentMethod?: string;
    discountPercentage?: number;
  }
) {
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const existingSale = await prisma.sale.findFirst({
    where: { id, businessId: user.businessId },
    include: {
      items: { include: { product: true } },
      salePromotions: { include: { items: true } },
    },
  });
  if (!existingSale) throw new Error("Venta no encontrada");

  if (data.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, businessId: user.businessId },
    });
    if (!customer) throw new Error("Cliente no encontrado");
  }

  if (data.items.length === 0 && (!data.promotions || data.promotions.length === 0)) {
    throw new Error("La venta debe tener al menos un producto o promo");
  }

  for (const item of data.items) {
    if (!item.productId || item.quantity <= 0) {
      throw new Error("Cantidad inválida");
    }
  }
  for (const promo of data.promotions || []) {
    if (!promo.promotionId || promo.quantity <= 0) {
      throw new Error("Cantidad de promo inválida");
    }
  }

  const promotions = data.promotions?.length
    ? await prisma.promotion.findMany({
        where: {
          id: { in: data.promotions.map((p) => p.promotionId) },
          businessId: user.businessId,
          status: ProductStatus.ACTIVE,
        },
        include: { items: true },
      })
    : [];

  if (data.promotions && promotions.length !== data.promotions.length) {
    throw new Error("Una o más promociones no fueron encontradas");
  }

  const promotionMap = new Map(promotions.map((p) => [p.id, p]));

  // Aggregate original stock per product
  const originalQtyByProduct = new Map<string, number>();
  for (const item of existingSale.items) {
    originalQtyByProduct.set(
      item.productId,
      (originalQtyByProduct.get(item.productId) || 0) + item.quantity
    );
  }
  for (const salePromotion of existingSale.salePromotions) {
    for (const spi of salePromotion.items) {
      originalQtyByProduct.set(
        spi.productId,
        (originalQtyByProduct.get(spi.productId) || 0) + spi.quantity
      );
    }
  }

  // Aggregate new stock needed per product
  const newQtyByProduct = new Map<string, number>();
  for (const item of data.items) {
    newQtyByProduct.set(
      item.productId,
      (newQtyByProduct.get(item.productId) || 0) + item.quantity
    );
  }
  for (const promo of data.promotions || []) {
    const promotion = promotionMap.get(promo.promotionId)!;
    for (const promoItem of promotion.items) {
      newQtyByProduct.set(
        promoItem.productId,
        (newQtyByProduct.get(promoItem.productId) || 0) + promoItem.quantity * promo.quantity
      );
    }
  }

  const productIds = Array.from(new Set([...originalQtyByProduct.keys(), ...newQtyByProduct.keys()]));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: user.businessId },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate stock considering original items will be returned first
  for (const [productId, newQty] of newQtyByProduct.entries()) {
    const product = productMap.get(productId);
    if (!product) throw new Error("Producto no encontrado");
    const originalQty = originalQtyByProduct.get(productId) || 0;
    const availableStock = product.currentStock + originalQty;
    if (availableStock < newQty) {
      throw new Error(`Stock insuficiente para ${product.name}`);
    }
  }

  let subtotal = 0;

  await prisma.$transaction(async (tx) => {
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

    // 3. Eliminar ítems y promos originales
    await tx.saleItem.deleteMany({ where: { saleId: id } });
    await tx.salePromotion.deleteMany({ where: { saleId: id } });

    // 4. Actualizar datos de la venta
    await tx.sale.update({
      where: { id },
      data: {
        customerId: data.customerId || null,
        isPaid: data.isPaid ?? true,
        paymentMethod:
          data.paymentMethod && Object.values(PaymentMethod).includes(data.paymentMethod as PaymentMethod)
            ? (data.paymentMethod as PaymentMethod)
            : PaymentMethod.CASH,
        totalAmount: 0,
        discountPercentage: 0,
        discountAmount: 0,
      },
    });

    // 5. Crear nuevos ítems
    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.salePrice;
      const totalPrice = Number(unitPrice) * item.quantity;
      subtotal += totalPrice;

      await tx.saleItem.create({
        data: {
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        },
      });
    }

    // 6. Crear nuevas promos
    for (const promo of data.promotions || []) {
      const promotion = promotionMap.get(promo.promotionId)!;
      const unitPrice = promotion.salePrice;
      const totalPrice = Number(unitPrice) * promo.quantity;
      subtotal += totalPrice;

      const salePromotion = await tx.salePromotion.create({
        data: {
          saleId: id,
          promotionId: promotion.id,
          name: promotion.name,
          salePrice: unitPrice,
          quantity: promo.quantity,
          totalPrice,
        },
      });

      for (const promoItem of promotion.items) {
        await tx.salePromotionItem.create({
          data: {
            salePromotionId: salePromotion.id,
            productId: promoItem.productId,
            quantity: promoItem.quantity * promo.quantity,
          },
        });
      }
    }

    // 7. Descontar stock nuevo y registrar movimientos
    for (const [productId, newQty] of newQtyByProduct.entries()) {
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { decrement: newQty } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId,
          userId: user.id,
          businessId: user.businessId,
          quantity: -newQty,
          type: MovementType.SALE,
          notes: `Venta ${existingSale.saleNumber}`,
        },
      });
    }

    const discountPercentage = Math.max(0, Math.min(100, Math.round(data.discountPercentage || 0)));
    const discountAmount = Math.round((subtotal * discountPercentage) / 100);
    const totalAmount = subtotal - discountAmount;

    await tx.sale.update({
      where: { id },
      data: {
        totalAmount,
        discountPercentage,
        discountAmount,
      },
    });
  });

  const updatedSale = await prisma.sale.findFirst({
    where: { id, businessId: user.businessId },
    ...saleWithDetailsArgs(user.role),
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
    include: {
      items: { include: { product: true } },
      salePromotions: { include: { items: true } },
    },
  });
  if (!existingSale) throw new Error("Venta no encontrada");

  await prisma.$transaction(async (tx) => {
    // Aggregate stock to return per product
    const qtyByProduct = new Map<string, number>();
    for (const item of existingSale.items) {
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) || 0) + item.quantity);
    }
    for (const salePromotion of existingSale.salePromotions) {
      for (const spi of salePromotion.items) {
        qtyByProduct.set(spi.productId, (qtyByProduct.get(spi.productId) || 0) + spi.quantity);
      }
    }

    // Revertir stock
    for (const [productId, quantity] of qtyByProduct.entries()) {
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: quantity } },
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

    // Eliminar ítems, promos y venta
    await tx.saleItem.deleteMany({ where: { saleId: id } });
    await tx.salePromotion.deleteMany({ where: { saleId: id } });
    await tx.sale.delete({ where: { id } });
  });

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/productos");
  revalidatePath("/");
}

// ─── Expense Actions ───

export async function getExpenseCategories() {
  const user = checkBusinessAccess(await getCurrentUser());

  const categories = await prisma.expenseCategory.findMany({
    where: { businessId: user.businessId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { expenses: true },
      },
    },
  });
  return serializeData(categories);
}

export async function getExpenseCategoryById(id: string) {
  const user = checkBusinessAccess(await getCurrentUser());

  const category = await prisma.expenseCategory.findFirst({
    where: { id, businessId: user.businessId },
  });
  return serializeData(category);
}

export async function createExpenseCategory(data: { name: string; color?: string }) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const name = data.name.trim();
  if (!name) throw new Error("El nombre es obligatorio");
  if (name.length > 100) throw new Error("El nombre no puede superar los 100 caracteres");
  if (data.color && data.color.length > 50) throw new Error("El color no puede superar los 50 caracteres");

  const category = await prisma.expenseCategory.create({
    data: {
      name,
      color: data.color?.trim(),
      businessId: user.businessId,
    },
  });

  revalidatePath("/gastos");
  return serializeData(category);
}

export async function updateExpenseCategory(
  id: string,
  data: { name?: string; color?: string }
) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.expenseCategory.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Categoría no encontrada");

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) throw new Error("El nombre es obligatorio");
    if (name.length > 100) throw new Error("El nombre no puede superar los 100 caracteres");
  }
  if (data.color && data.color.length > 50) throw new Error("El color no puede superar los 50 caracteres");

  const category = await prisma.expenseCategory.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      color: data.color?.trim(),
    },
  });

  revalidatePath("/gastos");
  return serializeData(category);
}

export async function deleteExpenseCategory(id: string) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.expenseCategory.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Categoría no encontrada");

  await prisma.expenseCategory.delete({ where: { id } });

  revalidatePath("/gastos");
  return { success: true };
}

export async function getExpenses(search?: string, categoryId?: string, from?: string, to?: string) {
  const user = requireOwner(await getCurrentUser());

  const where: any = { businessId: user.businessId };
  if (search) {
    where.concept = { contains: search, mode: "insensitive" };
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
    take: 500,
  });
  return serializeData(expenses);
}

export async function getExpenseById(id: string) {
  const user = requireOwner(await getCurrentUser());

  const expense = await prisma.expense.findFirst({
    where: { id, businessId: user.businessId },
    include: { category: true },
  });
  return serializeData(expense);
}

export async function createExpense(data: {
  concept: string;
  amount: number;
  date: string;
  notes?: string;
  categoryId?: string;
}) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const concept = data.concept.trim();
  if (!concept) throw new Error("El concepto es obligatorio");
  if (concept.length > 200) throw new Error("El concepto no puede superar los 200 caracteres");
  if (data.amount < 0) throw new Error("El monto no puede ser negativo");
  if (data.notes && data.notes.length > 1000) throw new Error("Las notas no pueden superar los 1000 caracteres");

  if (data.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: data.categoryId, businessId: user.businessId },
    });
    if (!category) throw new Error("Categoría no encontrada");
  }

  const expense = await prisma.expense.create({
    data: {
      concept,
      amount: data.amount,
      date: new Date(data.date),
      notes: data.notes?.trim() || null,
      categoryId: data.categoryId || null,
      businessId: user.businessId,
    },
    include: { category: true },
  });

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  return serializeData(expense);
}

export async function updateExpense(
  id: string,
  data: {
    concept?: string;
    amount?: number;
    date?: string;
    notes?: string;
    categoryId?: string | null;
  }
) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.expense.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Gasto no encontrado");

  if (data.concept !== undefined) {
    const concept = data.concept.trim();
    if (!concept) throw new Error("El concepto es obligatorio");
    if (concept.length > 200) throw new Error("El concepto no puede superar los 200 caracteres");
  }
  if (data.amount !== undefined && data.amount < 0) throw new Error("El monto no puede ser negativo");
  if (data.notes && data.notes.length > 1000) throw new Error("Las notas no pueden superar los 1000 caracteres");

  if (data.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: data.categoryId, businessId: user.businessId },
    });
    if (!category) throw new Error("Categoría no encontrada");
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      concept: data.concept?.trim(),
      amount: data.amount,
      date: data.date ? new Date(data.date) : undefined,
      notes: data.notes !== undefined ? data.notes?.trim() || null : undefined,
      categoryId: data.categoryId !== undefined ? data.categoryId || null : undefined,
    },
    include: { category: true },
  });

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  return serializeData(expense);
}

export async function deleteExpense(id: string) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.expense.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Gasto no encontrado");

  await prisma.expense.delete({ where: { id } });

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Dashboard Actions ───

export async function getDashboardData(chartDays: number = 7) {
  const user = requireOwner(await getCurrentUser());

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
    expensesToday,
    expensesWeek,
    expensesMonth,
    expensesYesterday,
    expensesLastWeek,
    expensesLastMonth,
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
    prisma.expense.findMany({
      where: { businessId: user.businessId, date: { gte: startOfDay } },
    }),
    prisma.expense.findMany({
      where: { businessId: user.businessId, date: { gte: startOfWeek } },
    }),
    prisma.expense.findMany({
      where: { businessId: user.businessId, date: { gte: startOfMonth } },
    }),
    prisma.expense.findMany({
      where: { businessId: user.businessId, date: { gte: startOfYesterday, lt: startOfDay } },
    }),
    prisma.expense.findMany({
      where: { businessId: user.businessId, date: { gte: startOfLastWeek, lt: startOfWeek } },
    }),
    prisma.expense.findMany({
      where: { businessId: user.businessId, date: { gte: startOfLastMonth, lt: startOfMonth } },
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

  const expensesTodayTotal = expensesToday.reduce((sum, e) => sum + Number(e.amount), 0);
  const expensesWeekTotal = expensesWeek.reduce((sum, e) => sum + Number(e.amount), 0);
  const expensesMonthTotal = expensesMonth.reduce((sum, e) => sum + Number(e.amount), 0);
  const expensesYesterdayTotal = expensesYesterday.reduce((sum, e) => sum + Number(e.amount), 0);
  const expensesLastWeekTotal = expensesLastWeek.reduce((sum, e) => sum + Number(e.amount), 0);
  const expensesLastMonthTotal = expensesLastMonth.reduce((sum, e) => sum + Number(e.amount), 0);

  const profitToday = revenueToday - expensesTodayTotal;
  const profitWeek = revenueWeek - expensesWeekTotal;
  const profitMonth = revenueMonth - expensesMonthTotal;
  const profitYesterday = revenueYesterday - expensesYesterdayTotal;
  const profitLastWeek = revenueLastWeek - expensesLastWeekTotal;
  const profitLastMonth = revenueLastMonth - expensesLastMonthTotal;

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
      const [daySales, dayExpenses] = await Promise.all([
        prisma.sale.findMany({
          where: {
            businessId: user.businessId,
            createdAt: { gte: date, lt: nextDay },
          },
        }),
        prisma.expense.findMany({
          where: {
            businessId: user.businessId,
            date: { gte: date, lt: nextDay },
          },
        }),
      ]);
      const revenue = daySales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const expenses = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        date: date.toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
        sales: daySales.length,
        revenue,
        expenses,
        profit: revenue - expenses,
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
    expensesToday: {
      total: expensesTodayTotal,
      change: pctChange(expensesTodayTotal, expensesYesterdayTotal),
    },
    expensesWeek: {
      total: expensesWeekTotal,
      change: pctChange(expensesWeekTotal, expensesLastWeekTotal),
    },
    expensesMonth: {
      total: expensesMonthTotal,
      change: pctChange(expensesMonthTotal, expensesLastMonthTotal),
    },
    profitToday: {
      total: profitToday,
      change: pctChange(profitToday, profitYesterday),
    },
    profitWeek: {
      total: profitWeek,
      change: pctChange(profitWeek, profitLastWeek),
    },
    profitMonth: {
      total: profitMonth,
      change: pctChange(profitMonth, profitLastMonth),
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
  const user = requireOwner(await getCurrentUser());
  await checkBusinessNotSuspended(user.businessId);

  const customers = await prisma.customer.findMany({
    where: { businessId: user.businessId },
    orderBy: { name: "asc" },
    take: 500,
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
  const user = requireOwner(await getCurrentUser());

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

  const name = data.name.trim();
  if (!name) throw new Error("El nombre es obligatorio");
  if (name.length > 100) throw new Error("El nombre no puede superar los 100 caracteres");
  if (data.email && data.email.length > 255) throw new Error("El email no puede superar los 255 caracteres");
  if (data.phone && data.phone.length > 50) throw new Error("El teléfono no puede superar los 50 caracteres");
  if (data.dni && data.dni.length > 50) throw new Error("El DNI/CUIT no puede superar los 50 caracteres");
  if (data.address && data.address.length > 255) throw new Error("La dirección no puede superar los 255 caracteres");
  if (data.notes && data.notes.length > 1000) throw new Error("Las notas no pueden superar los 1000 caracteres");

  const customer = await prisma.customer.create({
    data: {
      name,
      email: data.email?.trim().toLowerCase() || null,
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

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) throw new Error("El nombre es obligatorio");
    if (name.length > 100) throw new Error("El nombre no puede superar los 100 caracteres");
  }
  if (data.email && data.email.length > 255) throw new Error("El email no puede superar los 255 caracteres");
  if (data.phone && data.phone.length > 50) throw new Error("El teléfono no puede superar los 50 caracteres");
  if (data.dni && data.dni.length > 50) throw new Error("El DNI/CUIT no puede superar los 50 caracteres");
  if (data.address && data.address.length > 255) throw new Error("La dirección no puede superar los 255 caracteres");
  if (data.notes && data.notes.length > 1000) throw new Error("Las notas no pueden superar los 1000 caracteres");

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      email: data.email !== undefined ? data.email?.trim().toLowerCase() || null : undefined,
      phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
      dni: data.dni !== undefined ? data.dni?.trim() || null : undefined,
      address: data.address !== undefined ? data.address?.trim() || null : undefined,
      notes: data.notes !== undefined ? data.notes?.trim() || null : undefined,
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

  if (data.amount <= 0) throw new Error("El monto debe ser mayor a cero");
  if (data.notes && data.notes.length > 1000) throw new Error("Las notas no pueden superar los 1000 caracteres");

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

export async function updatePayment(
  id: string,
  data: {
    amount?: number;
    notes?: string;
  }
) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.payment.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Pago no encontrado");

  const amount = data.amount !== undefined ? Number(data.amount) : Number(existing.amount);
  if (!amount || amount <= 0) throw new Error("El monto debe ser mayor a cero");

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      amount,
      notes: data.notes !== undefined ? data.notes?.trim() || null : existing.notes,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${existing.customerId}`);
  return serializeData(payment);
}

export async function deletePayment(id: string) {
  const user = await verifyBusinessAccess(await getCurrentUser());
  if (user.role !== "OWNER") throw new Error("No tenés permisos para realizar esta acción");

  const existing = await prisma.payment.findFirst({
    where: { id, businessId: user.businessId },
  });
  if (!existing) throw new Error("Pago no encontrado");

  await prisma.payment.delete({ where: { id } });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${existing.customerId}`);
  return { success: true };
}

export async function getCustomerBalance(customerId: string) {
  const user = requireOwner(await getCurrentUser());

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
