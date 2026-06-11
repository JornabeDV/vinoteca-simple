-- ============================================================================
-- MIGRACIÓN: WineProduct → Product (Producción - datos seguros)
-- ============================================================================
-- Ejecutar esto en el SQL Editor de Neon (https://console.neon.tech)
-- NO borra datos. Renombra columnas y tabla in-place.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Crear el enum ProductType (si no existe)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductType') THEN
        CREATE TYPE "ProductType" AS ENUM ('WINE', 'BEER', 'SPIRIT', 'WATER', 'OTHER');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Agregar columna product_type a wine_products (default WINE para todos los existentes)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wine_products' AND column_name = 'product_type'
    ) THEN
        ALTER TABLE "wine_products" ADD COLUMN "product_type" "ProductType" NOT NULL DEFAULT 'WINE';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Renombrar columnas: winery→brand, varietal→style, vintage→year
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wine_products' AND column_name = 'winery'
    ) THEN
        ALTER TABLE "wine_products" RENAME COLUMN "winery" TO "brand";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wine_products' AND column_name = 'varietal'
    ) THEN
        ALTER TABLE "wine_products" RENAME COLUMN "varietal" TO "style";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wine_products' AND column_name = 'vintage'
    ) THEN
        ALTER TABLE "wine_products" RENAME COLUMN "vintage" TO "year";
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Renombrar la tabla wine_products → products
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'wine_products'
    ) THEN
        ALTER TABLE "wine_products" RENAME TO "products";
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Renombrar constraints principales para consistencia
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wine_products_pkey' AND table_name = 'products'
    ) THEN
        ALTER TABLE "products" RENAME CONSTRAINT "wine_products_pkey" TO "products_pkey";
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wine_products_business_id_fkey' AND table_name = 'products'
    ) THEN
        ALTER TABLE "products" RENAME CONSTRAINT "wine_products_business_id_fkey" TO "products_business_id_fkey";
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Recrear índices (dropear viejos, crear nuevos)
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS "wine_products_status_idx";
DROP INDEX IF EXISTS "wine_products_name_idx";
DROP INDEX IF EXISTS "wine_products_winery_idx";
DROP INDEX IF EXISTS "wine_products_category_idx";
DROP INDEX IF EXISTS "wine_products_business_id_idx";

CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products"("status");
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products"("name");
CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products"("brand");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products"("category");
CREATE INDEX IF NOT EXISTS "products_product_type_idx" ON "products"("product_type");
CREATE INDEX IF NOT EXISTS "products_business_id_idx" ON "products"("business_id");

-- ----------------------------------------------------------------------------
-- 7. Verificar que las FKs de sale_items e inventory_movements apuntan bien
--    (PostgreSQL actualiza la referencia automáticamente al renombrar la tabla,
--     pero renombramos las constraints por consistencia)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sale_items_product_id_fkey'
    ) THEN
        -- La FK ya apunta a products porque PostgreSQL actualizó la referencia
        -- al renombrar la tabla. No hace falta tocarla.
        NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. (Opcional) Verificación rápida - descomentar para probar
-- ----------------------------------------------------------------------------
-- SELECT id, name, brand, style, year, product_type, status, business_id 
-- FROM "products" LIMIT 5;
