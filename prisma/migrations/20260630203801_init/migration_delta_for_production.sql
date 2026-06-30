-- ============================================================
-- SQL DELTA para aplicar los cambios de Promos + PaymentMethod
-- en una base de datos de producción que YA TIENE el schema previo
-- ============================================================
-- IMPORTANTE: Hacé un backup de la DB antes de correr este script.

-- 1. Enum PaymentMethod (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DIGITAL_WALLET', 'ACCOUNT');
  END IF;
END$$;

-- 2. Agregar payment_method a sales (si no existe)
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- 3. Tablas de promociones
CREATE TABLE IF NOT EXISTS "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sale_price" DECIMAL(10,2) NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "business_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "promotion_items" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "promotion_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sale_promotions" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sale_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sale_promotions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sale_promotion_items" (
    "id" TEXT NOT NULL,
    "sale_promotion_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "sale_promotion_items_pkey" PRIMARY KEY ("id")
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS "promotions_status_idx" ON "promotions"("status");
CREATE INDEX IF NOT EXISTS "promotions_business_id_idx" ON "promotions"("business_id");
CREATE INDEX IF NOT EXISTS "promotion_items_promotion_id_idx" ON "promotion_items"("promotion_id");
CREATE INDEX IF NOT EXISTS "promotion_items_product_id_idx" ON "promotion_items"("product_id");
CREATE INDEX IF NOT EXISTS "sale_promotions_sale_id_idx" ON "sale_promotions"("sale_id");
CREATE INDEX IF NOT EXISTS "sale_promotions_promotion_id_idx" ON "sale_promotions"("promotion_id");
CREATE INDEX IF NOT EXISTS "sale_promotion_items_sale_promotion_id_idx" ON "sale_promotion_items"("sale_promotion_id");
CREATE INDEX IF NOT EXISTS "sale_promotion_items_product_id_idx" ON "sale_promotion_items"("product_id");

-- 5. Foreign keys (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'promotions_business_id_fkey' AND table_name = 'promotions'
  ) THEN
    ALTER TABLE "promotions" ADD CONSTRAINT "promotions_business_id_fkey"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'promotion_items_promotion_id_fkey' AND table_name = 'promotion_items'
  ) THEN
    ALTER TABLE "promotion_items" ADD CONSTRAINT "promotion_items_promotion_id_fkey"
      FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'promotion_items_product_id_fkey' AND table_name = 'promotion_items'
  ) THEN
    ALTER TABLE "promotion_items" ADD CONSTRAINT "promotion_items_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sale_promotions_sale_id_fkey' AND table_name = 'sale_promotions'
  ) THEN
    ALTER TABLE "sale_promotions" ADD CONSTRAINT "sale_promotions_sale_id_fkey"
      FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sale_promotions_promotion_id_fkey' AND table_name = 'sale_promotions'
  ) THEN
    ALTER TABLE "sale_promotions" ADD CONSTRAINT "sale_promotions_promotion_id_fkey"
      FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sale_promotion_items_sale_promotion_id_fkey' AND table_name = 'sale_promotion_items'
  ) THEN
    ALTER TABLE "sale_promotion_items" ADD CONSTRAINT "sale_promotion_items_sale_promotion_id_fkey"
      FOREIGN KEY ("sale_promotion_id") REFERENCES "sale_promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sale_promotion_items_product_id_fkey' AND table_name = 'sale_promotion_items'
  ) THEN
    ALTER TABLE "sale_promotion_items" ADD CONSTRAINT "sale_promotion_items_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
