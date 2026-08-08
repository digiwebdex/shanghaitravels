import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");                 // → routes served at /api/... (nginx proxies /api/)
  // Production hardening — security headers (HSTS, nosniff, frameguard, etc.).
  // CSP is left to nginx for the SPA and disabled here so JSON/PDF/QR streaming
  // from the API is unaffected; crossOriginResourcePolicy=cross-origin because
  // the API is consumed same-origin via the nginx /api2 proxy and serves PDFs.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(Number(process.env.PORT) || 4201, "127.0.0.1");
  console.log(`ERP API listening on 127.0.0.1:${process.env.PORT || 4201}`);
}
bootstrap();
