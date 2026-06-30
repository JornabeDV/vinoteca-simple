import "dotenv/config";
import { PrismaClient, UserRole, ProductStatus, ProductType, MovementType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WINERIES = [
  "Trapiche", "Rutini Wines", "Luigi Bosca", "Zuccardi", "Salentein",
  "Colomé", "Susana Balbo", "Familia Zuccardi", "Achaval-Ferrer", "Alta Vista",
  "Bodega Catena Zapata", "El Enemigo", "Finca Las Moras", "La Rural",
  "Navarro Correas", "Norton", "Piattelli", "Pulenta Estate", "Riccitelli",
  "Santa Julia", "Terrazas de los Andes", "Tikal", "Viña Cobos", "Viña Don Cristobal",
  "Weinert", "Bianchi", "Chandon", "Dante Robino", "Escorihuela Gascón",
  "Finca Flichman", "La Linda", "Lopez", "Mendel", "Perdriel",
];

const VARIETALS = [
  "Malbec", "Cabernet Sauvignon", "Merlot", "Syrah", "Pinot Noir",
  "Bonarda", "Tannat", "Tempranillo", "Blend", "Torrontés",
  "Chardonnay", "Sauvignon Blanc", "Chenin Blanc", "Viognier", "Riesling",
  "Semillón", "Rosé", "Espumante",
];

const CATEGORIES = [
  "Vino Tinto", "Vino Blanco", "Vino Rosado", "Espumante", "Vino Dulce",
];

const ADJECTIVES = [
  "Reserva", "Gran Reserva", "Estate", "Single Vineyard", "Icono",
  "Premium", "Selección", "Alta Gama", "Clásico", "Joven",
  "Roble", "Crianza", "Añejo", "Viejas Viñas", "Parcela",
];

const WINE_NAMES = [
  "Malbec", "Cabernet", "Merlot", "Syrah", "Pinot",
  "Blend", "Torrontés", "Chardonnay", "Sauvignon", "Rosé",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) / 100) * 100;
}

function randDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysBack));
  d.setHours(randInt(9, 22), randInt(0, 59), 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Iniciando seed masivo...");

  // ─── LIMPIAR DATOS EXISTENTES ───
  await prisma.salePromotionItem.deleteMany();
  await prisma.salePromotion.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.promotionItem.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  // ─── NEGOCIO ───
  const business = await prisma.business.create({
    data: {
      name: "Vinoteca Demo",
      inviteCode: "DEMO2024",
    },
  });
  console.log(`✅ Negocio creado: ${business.name} (código: ${business.inviteCode})`);

  // ─── USUARIOS ───
  const ownerPass = await bcrypt.hash("owner123", 12);
  const empPass = await bcrypt.hash("empleado123", 12);

  const adminPass = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@vinotecasimple.com",
      name: "Super Admin",
      password: adminPass,
      role: UserRole.ADMIN,
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@vinotecasimple.com",
      name: "Carlos Mendoza",
      password: ownerPass,
      role: UserRole.OWNER,
      businessId: business.id,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: "empleado@vinotecasimple.com",
      name: "María López",
      password: empPass,
      role: UserRole.EMPLOYEE,
      businessId: business.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: "juan@vinotecasimple.com",
      name: "Juan Pérez",
      password: empPass,
      role: UserRole.EMPLOYEE,
      businessId: business.id,
    },
  });

  const users = [owner, employee1, employee2];
  console.log(`✅ ${users.length} usuarios creados`);

  // ─── CLIENTES ───
  const customerData = [
    { name: "Juan Pérez", phone: "11-5555-1111", dni: "30123456", email: "juan.perez@email.com" },
    { name: "María González", phone: "11-5555-2222", dni: "27123456", email: "maria.gonzalez@email.com" },
    { name: "Carlos Rodríguez", phone: "11-5555-3333", dni: "25123456" },
    { name: "Lucía Fernández", phone: "11-5555-4444", dni: "33123456", email: "lucia.fernandez@email.com" },
    { name: "Roberto Martínez", phone: "11-5555-5555", dni: "20123456" },
  ];

  const customers: any[] = [];
  for (const c of customerData) {
    customers.push(await prisma.customer.create({
      data: { ...c, businessId: business.id },
    }));
  }
  console.log(`✅ ${customers.length} clientes creados`);

  // ─── CATEGORÍAS ───
  const categoryNames = [
    "Vino Tinto",
    "Vino Blanco",
    "Vino Rosado",
    "Espumante",
    "Cerveza",
    "Whisky",
    "Agua",
    "Aperitivo",
  ];

  const categoryRecords = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.create({
        data: { name, businessId: business.id },
      })
    )
  );

  const categoryByName = new Map(categoryRecords.map((c) => [c.name, c.id]));

  function resolveCategoryId(categoryName: string): string | undefined {
    return categoryByName.get(categoryName);
  }

  // ─── PRODUCTOS (40 vinos) ───
  const productsData: any[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < 40; i++) {
    const brand = rand(WINERIES);
    const baseName = rand(WINE_NAMES);
    const adj = Math.random() > 0.4 ? rand(ADJECTIVES) : "";
    const name = adj ? `${baseName} ${adj}` : baseName;
    const fullName = `${brand} ${name}`;

    if (usedNames.has(fullName)) continue;
    usedNames.add(fullName);

    const style = rand(VARIETALS);
    const categoryName =
      style === "Rosé" ? "Vino Rosado" :
      style === "Espumante" ? "Espumante" :
      ["Torrontés", "Chardonnay", "Sauvignon Blanc", "Chenin Blanc", "Viognier", "Riesling", "Semillón"].includes(style)
        ? "Vino Blanco" : "Vino Tinto";

    const costPrice = randPrice(2500, 12000);
    const margin = 1.4 + Math.random() * 0.8; // 40% - 120% margin
    const salePrice = Math.round(costPrice * margin / 100) * 100;
    const currentStock = randInt(2, 45);
    const minStock = randInt(3, 10);

    productsData.push({
      id: `wine-${i + 1}`,
      name: fullName,
      brand,
      categoryId: resolveCategoryId(categoryName),
      style,
      year: randInt(2018, 2023),
      description: `${categoryName} de ${brand}. Varietal ${style}${adj ? `, línea ${adj}` : ""}. Producción limitada de la región de Mendoza, Argentina.`,
      productType: ProductType.WINE,
      costPrice,
      salePrice,
      currentStock,
      minStock,
      status: Math.random() > 0.9 ? ProductStatus.ARCHIVED : ProductStatus.ACTIVE,
      businessId: business.id,
    });
  }

  // ─── OTROS PRODUCTOS (cervezas, whiskies, aguas) ───
  const otherProducts = [
    {
      id: "beer-1", name: "Quilmes Clásica", brand: "Quilmes", categoryId: resolveCategoryId("Cerveza"), style: "Lager",
      year: null, description: "Cerveza rubia clásica argentina.", productType: ProductType.BEER,
      costPrice: 800, salePrice: 1400, currentStock: 60, minStock: 10, status: ProductStatus.ACTIVE, businessId: business.id,
    },
    {
      id: "beer-2", name: "Stella Artois", brand: "Stella Artois", categoryId: resolveCategoryId("Cerveza"), style: "Premium Lager",
      year: null, description: "Cerveza belga premium.", productType: ProductType.BEER,
      costPrice: 1200, salePrice: 2100, currentStock: 40, minStock: 8, status: ProductStatus.ACTIVE, businessId: business.id,
    },
    {
      id: "spirit-1", name: "Johnnie Walker Black Label", brand: "Johnnie Walker", categoryId: resolveCategoryId("Whisky"), style: "Blended Scotch",
      year: null, description: "Whisky escocés de 12 años.", productType: ProductType.SPIRIT,
      costPrice: 25000, salePrice: 42000, currentStock: 12, minStock: 3, status: ProductStatus.ACTIVE, businessId: business.id,
    },
    {
      id: "spirit-2", name: "Jack Daniel's Old No. 7", brand: "Jack Daniel's", categoryId: resolveCategoryId("Whisky"), style: "Tennessee Whiskey",
      year: null, description: "Whisky americano icónico.", productType: ProductType.SPIRIT,
      costPrice: 22000, salePrice: 38000, currentStock: 10, minStock: 3, status: ProductStatus.ACTIVE, businessId: business.id,
    },
    {
      id: "water-1", name: "Villa del Sur sin gas", brand: "Villa del Sur", categoryId: resolveCategoryId("Agua"), style: "Sin gas",
      year: null, description: "Agua mineral natural.", productType: ProductType.WATER,
      costPrice: 400, salePrice: 700, currentStock: 100, minStock: 20, status: ProductStatus.ACTIVE, businessId: business.id,
    },
    {
      id: "other-1", name: "Fernet Branca", brand: "Branca", categoryId: resolveCategoryId("Aperitivo"), style: "Amargo",
      year: null, description: "Fernet italiano, clásico argentino.", productType: ProductType.OTHER,
      costPrice: 4500, salePrice: 7800, currentStock: 25, minStock: 5, status: ProductStatus.ACTIVE, businessId: business.id,
    },
  ];
  productsData.push(...otherProducts);

  for (const p of productsData) {
    await prisma.product.create({ data: p });
  }
  console.log(`✅ ${productsData.length} productos creados`);

  const activeProducts = productsData.filter((p) => p.status === ProductStatus.ACTIVE);

  // ─── PROMOCIONES DE EJEMPLO ───
  const promotionsData = [
    {
      id: "promo-1",
      name: "Combo Fernet + Coca",
      description: "Fernet Branca 750cc + agua sin gas",
      salePrice: 8000,
      status: ProductStatus.ACTIVE,
      businessId: business.id,
      items: [
        { productId: "other-1", quantity: 1 },
        { productId: "water-1", quantity: 1 },
      ],
    },
    {
      id: "promo-2",
      name: "Whisky Premium",
      description: "Johnnie Walker Black Label + agua sin gas",
      salePrice: 40000,
      status: ProductStatus.ACTIVE,
      businessId: business.id,
      items: [
        { productId: "spirit-1", quantity: 1 },
        { productId: "water-1", quantity: 1 },
      ],
    },
    {
      id: "promo-3",
      name: "Pack Cerveza x6",
      description: "6 Quilmes Clásica",
      salePrice: 7500,
      status: ProductStatus.ACTIVE,
      businessId: business.id,
      items: [
        { productId: "beer-1", quantity: 6 },
      ],
    },
  ];

  for (const promo of promotionsData) {
    const { items, ...promoRest } = promo;
    await prisma.promotion.create({
      data: {
        ...promoRest,
        items: { create: items },
      },
    });
  }
  console.log(`✅ ${promotionsData.length} promociones creadas`);

  // ─── MOVIMIENTOS DE INVENTARIO INICIALES ───
  for (const p of productsData) {
    // Stock inicial (compra)
    await prisma.inventoryMovement.create({
      data: {
        productId: p.id,
        userId: owner.id,
        businessId: business.id,
        quantity: p.currentStock + randInt(5, 20),
        type: MovementType.PURCHASE,
        notes: "Stock inicial",
        createdAt: randDate(90),
      },
    });

    // Algunos ajustes aleatorios
    if (Math.random() > 0.7) {
      await prisma.inventoryMovement.create({
        data: {
          productId: p.id,
          userId: rand(users).id,
          businessId: business.id,
          quantity: randInt(1, 5),
          type: MovementType.ADJUSTMENT,
          notes: "Ajuste de inventario",
          createdAt: randDate(60),
        },
      });
    }
  }
  console.log(`✅ Movimientos de inventario iniciales creados`);

  // ─── VENTAS (150 ventas en los últimos 60 días) ───
  let saleCount = 0;
  for (let i = 0; i < 150; i++) {
    const numItems = randInt(1, 4);
    const saleProducts: typeof activeProducts = [];
    const used = new Set<string>();

    for (let j = 0; j < numItems; j++) {
      const p = rand(activeProducts);
      if (!used.has(p.id)) {
        used.add(p.id);
        saleProducts.push(p);
      }
    }

    if (saleProducts.length === 0) continue;

    const saleNumber = `V-${1000 + i}`;
    const saleUser = rand(users);
    const saleDate = randDate(60);

    let totalAmount = 0;
    const items: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    for (const p of saleProducts) {
      const qty = randInt(1, 3);
      const total = p.salePrice * qty;
      totalAmount += total;
      items.push({
        productId: p.id,
        quantity: qty,
        unitPrice: p.salePrice,
        totalPrice: total,
      });
    }

    const isAccountSale = Math.random() < 0.2;
    const customer = isAccountSale ? rand(customers) : null;

    await prisma.sale.create({
      data: {
        saleNumber,
        userId: saleUser.id,
        businessId: business.id,
        customerId: customer?.id,
        totalAmount,
        isPaid: !isAccountSale,
        createdAt: saleDate,
        items: {
          create: items,
        },
      },
    });

    // Registrar movimientos de venta y descontar stock
    for (const item of items) {
      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          userId: saleUser.id,
          businessId: business.id,
          quantity: -item.quantity,
          type: MovementType.SALE,
          notes: `Venta ${saleNumber}`,
          createdAt: saleDate,
        },
      });

      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
    }

    saleCount++;
  }
  console.log(`✅ ${saleCount} ventas creadas`);

  // ─── PAGOS DE CLIENTES ───
  for (const customer of customers) {
    const unpaidSales = await prisma.sale.findMany({
      where: { customerId: customer.id, isPaid: false },
    });

    const totalDebt = unpaidSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    if (totalDebt > 0) {
      // Pagar aproximadamente la mitad de la deuda
      const paymentAmount = Math.round(totalDebt * 0.5 / 100) * 100;
      await prisma.payment.create({
        data: {
          amount: paymentAmount,
          notes: "Pago parcial",
          customerId: customer.id,
          businessId: business.id,
          createdAt: randDate(14),
        },
      });
    }
  }
  console.log(`✅ Pagos de clientes creados`);

  // ─── ALGUNAS COMPRAS RECIENTES PARA REPOBLAR STOCK ───
  const lowStockProducts = await prisma.product.findMany({
    where: { businessId: business.id, status: ProductStatus.ACTIVE, currentStock: { lte: 5 } },
  });

  for (const p of lowStockProducts.slice(0, 8)) {
    const qty = randInt(10, 24);
    await prisma.inventoryMovement.create({
      data: {
        productId: p.id,
        userId: owner.id,
        businessId: business.id,
        quantity: qty,
        type: MovementType.PURCHASE,
        notes: "Reabastecimiento",
        createdAt: randDate(14),
      },
    });
    await prisma.product.update({
      where: { id: p.id },
      data: { currentStock: { increment: qty } },
    });
  }
  console.log(`✅ Reabastecimientos creados`);

  console.log("\n🎉 Seed masivo completado!");
  console.log("Credenciales:");
  console.log("  admin@vinotecasimple.com / admin123  (super admin)");
  console.log("  owner@vinotecasimple.com / owner123");
  console.log("  empleado@vinotecasimple.com / empleado123");
  console.log("  juan@vinotecasimple.com / empleado123");
  console.log(`Código de invitación: ${business.inviteCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
