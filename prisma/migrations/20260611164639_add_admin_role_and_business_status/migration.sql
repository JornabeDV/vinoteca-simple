-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE';
