import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockController } from './stock.controller';

@Module({
    controllers: [StockController],
    providers: [StockService, PrismaService],
    exports: [StockService]
})
export class StockModule { }
