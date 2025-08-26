-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "provider" "public"."AuthProvider",
ALTER COLUMN "passwordHash" DROP NOT NULL;
