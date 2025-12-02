import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const { orderId, amount } = createPaymentDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Find the order to ensure it exists
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          payments: true, // Include existing payments
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found.`);
      }

      // 2. Create the new payment
      const newPayment = await tx.payment.create({
        data: {
          ...createPaymentDto,
        },
      });

      // 3. Calculate new paid and remaining amounts
      const totalPaid =
        order.payments.reduce((sum, p) => sum + p.amount, 0) +
        newPayment.amount;
      const newRemainingAmount = order.totalAmount - totalPaid;

      // 4. Update the order with the new remaining amount
      await tx.order.update({
        where: { id: orderId },
        data: {
          remainingAmount: newRemainingAmount,
        },
      });

      return newPayment;
    });
  }

  async findAllForOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: {
        paymentDate: "desc",
      },
    });
  }
}
