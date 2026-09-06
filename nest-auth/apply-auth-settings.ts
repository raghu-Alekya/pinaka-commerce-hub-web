import { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";

export function applyAuthAppSettings(app: INestApplication) {
  app.use(cookieParser());
  app.enableCors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  });
}
