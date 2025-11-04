/*
  Warnings:

  - You are about to drop the `IndustryInsight` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_industry_fkey";

-- DropTable
DROP TABLE "public"."IndustryInsight";
