-- CreateTable
CREATE TABLE "public"."MockInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockId" TEXT NOT NULL,
    "mockResponse" JSONB NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockInterview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MockInterview_mockId_key" ON "public"."MockInterview"("mockId");

-- CreateIndex
CREATE INDEX "MockInterview_userId_idx" ON "public"."MockInterview"("userId");

-- AddForeignKey
ALTER TABLE "public"."MockInterview" ADD CONSTRAINT "MockInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
