import { Injectable, OnModuleInit, INestApplication } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // Changed: Removed 'async' keyword
  enableShutdownHooks(app: INestApplication) {
    (this as any).$on("beforeExit", () => {
      app.close();
    });
  }
}
