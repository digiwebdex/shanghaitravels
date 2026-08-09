-- FINAL WORKFLOW — booking/service commercials.
--
-- Supplier, supplier cost and selling price belong to the BOOKING TRANSACTION,
-- not to the customer: the same customer can buy a visa from one supplier and a
-- ticket from another.
--
-- Purely additive and reversible:
--   * all three columns are NULLABLE with no DEFAULT, so PostgreSQL adds them as
--     a metadata-only change — no table rewrite, no backfill, no row touched;
--   * the previous backend build ignores unknown columns, so this migration is
--     backward compatible and a backend rollback needs no schema rollback;
--   * the FK uses ON DELETE SET NULL so removing a supplier clears the link
--     instead of failing.

ALTER TABLE "Application"
  ADD COLUMN "supplierId"         TEXT,
  ADD COLUMN "supplierCostPoisha" INTEGER,
  ADD COLUMN "sellingPricePoisha" INTEGER;

ALTER TABLE "Application"
  ADD CONSTRAINT "Application_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Application_supplierId_idx" ON "Application"("supplierId");
