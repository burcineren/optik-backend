import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async create(createOrderDto: CreateOrderDto, userId: string) {
    const {
      customerId,
      customer: customerData,
      frames,
      prescriptions,
      ...orderData
    } = createOrderDto;

    // Generate a unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      let finalCustomerId: string;

      // 1. Determine the customer
      if (customerId) {
        const existingCustomer = await tx.customer.findUnique({
          where: { id: customerId },
        });
        if (!existingCustomer) {
          throw new NotFoundException(`Customer with ID ${customerId} not found.`);
        }
        finalCustomerId = existingCustomer.id;
      } else if (customerData) {
        const newCustomer = await tx.customer.create({
          data: {
            fullName: customerData.fullName,
            tcIdentityNumber: customerData.tcIdentityNumber,
            phoneNumber: customerData.phoneNumber,
            email: customerData.email,
            address: customerData.address,
            relative: customerData.relative
              ? {
                create: {
                  fullName: customerData.relative.fullName,
                  tcIdentityNumber: customerData.relative.tcIdentityNumber,
                },
              }
              : undefined,
          },
        });
        finalCustomerId = newCustomer.id;
      } else {
        throw new BadRequestException('Either customerId or a new customer object must be provided.');
      }

      // 2. Create the Order
      const order = await tx.order.create({
        data: {
          ...orderData,
          orderNumber,
          userId,
          customerId: finalCustomerId,
        },
      });

      // 3. Create Frames
      if (frames && frames.length > 0) {
        await tx.frame.createMany({
          data: frames.map((frame) => ({
            ...frame,
            orderId: order.id,
          })),
        });
      }

      // 4. Create Prescriptions and Lenses
      if (prescriptions && prescriptions.length > 0) {
        for (const pres of prescriptions) {
          const { lenses, distance, near, ...restOfPrescription } = pres;

          // Manually map the nested DTO structure to the flat Prisma model structure
          const prismaPrescriptionData = {
            ...restOfPrescription,
            distanceSign: distance?.sign,
            distanceSph: distance?.sph,
            distanceCyl: distance?.cyl,
            distanceAx: distance?.ax,
            nearSign: near?.sign,
            nearSph: near?.sph,
            nearCyl: near?.cyl,
            nearAx: near?.ax,
            orderId: order.id,
          };

          const createdPrescription = await tx.prescription.create({
            data: prismaPrescriptionData,
          });

          if (lenses && lenses.length > 0) {
            await tx.lens.createMany({
              data: lenses.map((lens) => ({
                ...lens,
                prescriptionId: createdPrescription.id,
              })),
            });
          }
        }
      }

      // Return the complete order
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          customer: true,
          frames: true,
          prescriptions: {
            include: {
              lenses: true,
            },
          },
        },
      });
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    // Separate relational fields from the direct order fields
    const { customer, frames, prescriptions, customerId, ...orderData } =
      updateOrderDto;

    // For now, this method only updates the scalar fields of the order.
    // Updating relations would require more complex logic (e.g., deleting and recreating).
    return this.prisma.order.update({
      where: { id },
      data: orderData,
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      }
    });
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            relative: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        frames: true,
        prescriptions: {
          include: {
            lenses: true,
          },
        },
      },
    });
  }
}