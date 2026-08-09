-- BUG-01 — one invoice may accrue commission exactly once.
--
-- Safety checks performed BEFORE writing this migration:
--   * production : 0 Commission rows, 0 with invoiceId, 0 duplicate invoices
--   * staging    : 3 Commission rows, 1 with invoiceId, 0 duplicate invoices
--   * CommissionStatus is (pending | approved | paid) — there is NO reversed or
--     void status, so no legitimate "reverse then re-accrue" scenario exists
--     that would require two commissions on one invoice.
--
-- "invoiceId" is nullable and PostgreSQL treats NULLs as distinct in a unique
-- index (verified empirically: 3 NULL rows inserted fine, a duplicate non-null
-- was rejected). So manual, invoice-less commissions remain unrestricted while
-- every invoice-linked accrual is unique at the DATABASE level — which is what
-- makes the guard concurrency-safe: two simultaneous generate requests cannot
-- both succeed.

CREATE UNIQUE INDEX "Commission_invoiceId_key" ON "Commission" ("invoiceId");
