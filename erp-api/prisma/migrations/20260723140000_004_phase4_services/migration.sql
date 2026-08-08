-- CreateTable
CREATE TABLE "AirTicketDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "pnr" TEXT,
    "airline" TEXT,
    "flightNo" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "tripType" TEXT,
    "departAt" TIMESTAMP(3),
    "returnAt" TIMESTAMP(3),
    "cabinClass" TEXT,
    "passengerName" TEXT,
    "ticketNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirTicketDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "hotelName" TEXT,
    "city" TEXT,
    "country" TEXT,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "nights" INTEGER,
    "roomType" TEXT,
    "rooms" INTEGER,
    "guests" INTEGER,
    "confirmationNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPackageDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "packageName" TEXT,
    "destination" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "pax" INTEGER,
    "itinerary" TEXT,
    "inclusions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPackageDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "vehicleType" TEXT,
    "pickupLocation" TEXT,
    "dropLocation" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "passengers" INTEGER,
    "driverName" TEXT,
    "vehicleNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AirTicketDetail_applicationId_key" ON "AirTicketDetail"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelDetail_applicationId_key" ON "HotelDetail"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "TourPackageDetail_applicationId_key" ON "TourPackageDetail"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportDetail_applicationId_key" ON "TransportDetail"("applicationId");

-- AddForeignKey
ALTER TABLE "AirTicketDetail" ADD CONSTRAINT "AirTicketDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelDetail" ADD CONSTRAINT "HotelDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPackageDetail" ADD CONSTRAINT "TourPackageDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportDetail" ADD CONSTRAINT "TransportDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

