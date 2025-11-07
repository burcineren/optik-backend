import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class StockService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.stockMovement.findMany({
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                movementType: true,
                status: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                referenceNo: true,
                notes: true,
                movementDate: true,
                variantId: true,
                variant: true,
                userId: true,
                // user: true,  // Remove this line
                orderId: true,
                // order: true,  // Also remove this if order relation is commented out
            },
        });
    }

}