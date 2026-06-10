-- =====================================================
-- Vinoteca Simple — Schema completo para PostgreSQL/Neon
-- =====================================================
-- Copiar y pegar esto completo en el SQL Editor de Neon
-- (o ejecutar con psql)

-- -----------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'EMPLOYEE');
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'CORRECTION');

-- -----------------------------------------------------
-- 2. TABLAS (sin foreign keys)
-- -----------------------------------------------------
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "image" TEXT,
    "business_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wine_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "winery" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "varietal" TEXT NOT NULL,
    "vintage" INTEGER,
    "description" TEXT,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "sale_price" DECIMAL(10,2) NOT NULL,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "business_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wine_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "sale_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "MovementType" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------
-- 3. ÍNDICES
-- -----------------------------------------------------
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_business_id_idx" ON "users"("business_id");

CREATE INDEX "wine_products_status_idx" ON "wine_products"("status");
CREATE INDEX "wine_products_name_idx" ON "wine_products"("name");
CREATE INDEX "wine_products_winery_idx" ON "wine_products"("winery");
CREATE INDEX "wine_products_category_idx" ON "wine_products"("category");
CREATE INDEX "wine_products_business_id_idx" ON "wine_products"("business_id");

CREATE UNIQUE INDEX "sales_sale_number_key" ON "sales"("sale_number");
CREATE INDEX "sales_user_id_idx" ON "sales"("user_id");
CREATE INDEX "sales_business_id_idx" ON "sales"("business_id");
CREATE INDEX "sales_created_at_idx" ON "sales"("created_at");

CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");
CREATE INDEX "sale_items_product_id_idx" ON "sale_items"("product_id");

CREATE INDEX "inventory_movements_product_id_idx" ON "inventory_movements"("product_id");
CREATE INDEX "inventory_movements_user_id_idx" ON "inventory_movements"("user_id");
CREATE INDEX "inventory_movements_business_id_idx" ON "inventory_movements"("business_id");
CREATE INDEX "inventory_movements_created_at_idx" ON "inventory_movements"("created_at");

CREATE UNIQUE INDEX "businesses_invite_code_key" ON "businesses"("invite_code");

-- -----------------------------------------------------
-- 4. FOREIGN KEYS
-- -----------------------------------------------------
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wine_products" ADD CONSTRAINT "wine_products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "wine_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "wine_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- 5. DATOS DE DEMO (opcional — borrar si no se necesitan)
-- =====================================================

INSERT INTO "businesses" ("id", "name", "invite_code", "created_at", "updated_at")
VALUES ('b1a2c3d4-e5f6-7890-abcd-ef1234567890', 'Vinoteca Demo', 'DEMO2024', NOW(), NOW());

INSERT INTO "users" ("id", "email", "name", "password", "role", "business_id", "created_at", "updated_at")
VALUES
  ('u1a2b3c4-d5e6-7890-abcd-ef1234567890', 'owner@Vinoteca Simple.com', 'Carlos Mendoza', '$2b$12$SlIWYloiUQagq.irwVXf1ea1VjsTMujFBsqD7RaLrhioo0yrRJLE2', 'OWNER', 'b1a2c3d4-e5f6-7890-abcd-ef1234567890', NOW(), NOW()),
  ('u2b3c4d5-e6f7-8901-bcde-fa2345678901', 'empleado@Vinoteca Simple.com', 'María López', '$2b$12$kZK/r9rtbbGXJwo8qB35vuvjWnva64QRPoN6cgQEdDquYM69bOrOu', 'EMPLOYEE', 'b1a2c3d4-e5f6-7890-abcd-ef1234567890', NOW(), NOW()),
  ('u3c4d5e6-f7g8-9012-cdef-gb3456789012', 'juan@Vinoteca Simple.com', 'Juan Pérez', '$2b$12$kZK/r9rtbbGXJwo8qB35vuvjWnva64QRPoN6cgQEdDquYM69bOrOu', 'EMPLOYEE', 'b1a2c3d4-e5f6-7890-abcd-ef1234567890', NOW(), NOW());
