import "dotenv/config";
import { PrismaClient, UserRole, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create owner user
  const ownerPassword = await bcrypt.hash("owner123", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@vinotecaos.com" },
    update: {},
    create: {
      email: "owner@vinotecaos.com",
      name: "Carlos Mendoza",
      password: ownerPassword,
      role: UserRole.OWNER,
    },
  });

  // Create employee user
  const employeePassword = await bcrypt.hash("empleado123", 12);
  const employee = await prisma.user.upsert({
    where: { email: "empleado@vinotecaos.com" },
    update: {},
    create: {
      email: "empleado@vinotecaos.com",
      name: "María López",
      password: employeePassword,
      role: UserRole.EMPLOYEE,
    },
  });

  // Create sample wine products
  const wines = [
    {
      name: "Malbec Reserva",
      winery: "Trapiche",
      category: "Vino Tinto",
      varietal: "Malbec",
      vintage: 2021,
      description: "Vino tinto intenso con notas de ciruela, mora y vainilla. Cuerpo medio-alto con taninos suaves.",
      costPrice: 4500,
      salePrice: 7200,
      currentStock: 24,
      minStock: 6,
    },
    {
      name: "Cabernet Sauvignon",
      winery: "Rutini Wines",
      category: "Vino Tinto",
      varietal: "Cabernet Sauvignon",
      vintage: 2020,
      description: "Elegante y complejo, con aromas de pimienta negra, cassis y tabaco. Final largo y persistente.",
      costPrice: 6800,
      salePrice: 11200,
      currentStock: 18,
      minStock: 4,
    },
    {
      name: "Torrontés",
      winery: "Colomé",
      category: "Vino Blanco",
      varietal: "Torrontés",
      vintage: 2022,
      description: "Blanco aromático con notas florales de rosas y jazmín. Fresco y frutal en boca.",
      costPrice: 3200,
      salePrice: 5400,
      currentStock: 15,
      minStock: 5,
    },
    {
      name: "Bonarda",
      winery: "La Rural",
      category: "Vino Tinto",
      varietal: "Bonarda",
      vintage: 2021,
      description: "Frutado y jugoso, con aromas de frutos rojos y especias. Ideal para carnes.",
      costPrice: 2800,
      salePrice: 4600,
      currentStock: 30,
      minStock: 8,
    },
    {
      name: "Syrah",
      winery: "Salentein",
      category: "Vino Tinto",
      varietal: "Syrah",
      vintage: 2020,
      description: "Intenso y especiado, con notas de pimienta, moras y chocolate negro.",
      costPrice: 5200,
      salePrice: 8500,
      currentStock: 12,
      minStock: 4,
    },
    {
      name: "Chardonnay",
      winery: "Luigi Bosca",
      category: "Vino Blanco",
      varietal: "Chardonnay",
      vintage: 2022,
      description: "Elegante y cremoso, con notas de manzana verde, pera y vainilla tostada.",
      costPrice: 5800,
      salePrice: 9500,
      currentStock: 3,
      minStock: 5,
    },
    {
      name: "Blend de Tintas",
      winery: "Zuccardi",
      category: "Vino Tinto",
      varietal: "Blend",
      vintage: 2019,
      description: "Complejo blend con Malbec, Cabernet y Tannat. Estructurado y con gran potencial de guarda.",
      costPrice: 8500,
      salePrice: 14500,
      currentStock: 8,
      minStock: 3,
    },
    {
      name: "Rosé de Malbec",
      winery: "Susana Balbo",
      category: "Vino Rosado",
      varietal: "Malbec",
      vintage: 2022,
      description: "Fresco y delicado, con tonos salmon y aromas de frutillas y pomelo rosado.",
      costPrice: 3800,
      salePrice: 6200,
      currentStock: 20,
      minStock: 6,
    },
  ];

  for (const wine of wines) {
    await prisma.wineProduct.upsert({
      where: {
        id: wine.name.toLowerCase().replace(/\s+/g, "-"),
      },
      update: {},
      create: {
        id: wine.name.toLowerCase().replace(/\s+/g, "-"),
        ...wine,
        costPrice: wine.costPrice,
        salePrice: wine.salePrice,
        status: ProductStatus.ACTIVE,
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log("Owner: owner@vinotecaos.com / owner123");
  console.log("Employee: empleado@vinotecaos.com / empleado123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
