import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cookieParser = require('cookie-parser');
import { ValidationPipe } from "@nestjs/common";
import * as dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );
  app.setGlobalPrefix("api");
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api`);
}
bootstrap();
