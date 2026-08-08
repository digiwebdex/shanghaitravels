-- Phase B2: additive meal plan on hotel booking detail (non-breaking).
ALTER TABLE "HotelDetail" ADD COLUMN IF NOT EXISTS "mealPlan" TEXT;
