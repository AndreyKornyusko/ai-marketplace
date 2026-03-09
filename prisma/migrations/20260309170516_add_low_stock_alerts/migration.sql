-- CreateTable
CREATE TABLE "low_stock_alerts" (
    "product_id" UUID NOT NULL,
    "alerted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "low_stock_alerts_pkey" PRIMARY KEY ("product_id")
);

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
