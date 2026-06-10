import "dotenv/config";
import { PrismaClient, UserRole, ProductStatus, MovementType } from "@prisma/client";
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
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.wineProduct.deleteMany();
  await prisma.user.deleteMany();

  // ─── USUARIOS ───
  const ownerPass = await bcrypt.hash("owner123", 12);
  const empPass = await bcrypt.hash("empleado123", 12);

  const owner = await prisma.user.create({
    data: {
      email: "owner@vinotecaos.com",
      name: "Carlos Mendoza",
      password: ownerPass,
      role: UserRole.OWNER,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: "empleado@vinotecaos.com",
      name: "María López",
      password: empPass,
      role: UserRole.EMPLOYEE,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: "juan@vinotecaos.com",
      name: "Juan Pérez",
      password: empPass,
      role: UserRole.EMPLOYEE,
    },
  });

  const users = [owner, employee1, employee2];
  console.log(`✅ ${users.length} usuarios creados`);

  // ─── PRODUCTOS (40 vinos) ───
  const productsData: any[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < 40; i++) {
    const winery = rand(WINERIES);
    const baseName = rand(WINE_NAMES);
    const adj = Math.random() > 0.4 ? rand(ADJECTIVES) : "";
    const name = adj ? `${baseName} ${adj}` : baseName;
    const fullName = `${winery} ${name}`;

    if (usedNames.has(fullName)) continue;
    usedNames.add(fullName);

    const varietal = rand(VARIETALS);
    const category =
      varietal === "Rosé" ? "Vino Rosado" :
      varietal === "Espumante" ? "Espumante" :
      ["Torrontés", "Chardonnay", "Sauvignon Blanc", "Chenin Blanc", "Viognier", "Riesling", "Semillón"].includes(varietal)
        ? "Vino Blanco" : "Vino Tinto";

    const costPrice = randPrice(2500, 12000);
    const margin = 1.4 + Math.random() * 0.8; // 40% - 120% margin
    const salePrice = Math.round(costPrice * margin / 100) * 100;
    const currentStock = randInt(2, 45);
    const minStock = randInt(3, 10);

    productsData.push({
      id: `wine-${i + 1}`,
      name: fullName,
      winery,
      category,
      varietal,
      vintage: randInt(2018, 2023),
      description: `${category} de ${winery}. Varietal ${varietal}${adj ? `, línea ${adj}` : ""}. Producción limitada de la región de Mendoza, Argentina.`,
      costPrice,
      salePrice,
      currentStock,
      minStock,
      status: Math.random() > 0.9 ? ProductStatus.ARCHIVED : ProductStatus.ACTIVE,
    });
  }

  for (const p of productsData) {
    await prisma.wineProduct.create({ data: p });
  }
  console.log(`✅ ${productsData.length} productos creados`);

  const activeProducts = productsData.filter((p) => p.status === ProductStatus.ACTIVE);

  // ─── MOVIMIENTOS DE INVENTARIO INICIALES ───
  for (const p of productsData) {
    // Stock inicial (compra)
    await prisma.inventoryMovement.create({
      data: {
        productId: p.id,
        userId: owner.id,
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

    await prisma.sale.create({
      data: {
        saleNumber,
        userId: saleUser.id,
        totalAmount,
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
          quantity: -item.quantity,
          type: MovementType.SALE,
          notes: `Venta ${saleNumber}`,
          createdAt: saleDate,
        },
      });

      await prisma.wineProduct.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
    }

    saleCount++;
  }
  console.log(`✅ ${saleCount} ventas creadas`);

  // ─── ALGUNAS COMPRAS RECIENTES PARA REPOBLAR STOCK ───
  const lowStockProducts = await prisma.wineProduct.findMany({
    where: { status: ProductStatus.ACTIVE, currentStock: { lte: 5 } },
  });

  for (const p of lowStockProducts.slice(0, 8)) {
    const qty = randInt(10, 24);
    await prisma.inventoryMovement.create({
      data: {
        productId: p.id,
        userId: owner.id,
        quantity: qty,
        type: MovementType.PURCHASE,
        notes: "Reabastecimiento",
        createdAt: randDate(14),
      },
    });
    await prisma.wineProduct.update({
      where: { id: p.id },
      data: { currentStock: { increment: qty } },
    });
  }
  console.log(`✅ Reabastecimientos creados`);

  console.log("\n🎉 Seed masivo completado!");
  console.log("Credenciales:");
  console.log("  owner@vinotecaos.com / owner123");
  console.log("  empleado@vinotecaos.com / empleado123");
  console.log("  juan@vinotecaos.com / empleado123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
