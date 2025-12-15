import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

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
      let finalCustomerName: string; // <-- DEĞİŞİKLİK 1: İsim için değişken

      // 1. Determine the customer
      if (customerId) {
        const existingCustomer = await tx.customer.findUnique({
          where: { id: customerId },
        });
        if (!existingCustomer) {
          throw new NotFoundException(
            `Customer with ID ${customerId} not found.`,
          );
        }
        finalCustomerId = existingCustomer.id;
        finalCustomerName = existingCustomer.fullName; // <-- DEĞİŞİKLİK 2: Mevcut isimi al
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
        finalCustomerName = newCustomer.fullName; // <-- DEĞİŞİKLİK 3: Yeni isimi al
      } else {
        throw new BadRequestException(
          "Either customerId or a new customer object must be provided.",
        );
      }

      // 2. Create the Order
      const order = await tx.order.create({
        data: {
          ...orderData, // orderData içindeki diğer alanlar (totalAmount vb.)

          customerFullName: finalCustomerName, // <-- DEĞİŞİKLİK 4: Buraya eklendi
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
    // 1. DTO içindeki karmaşık yapıları (ilişkileri) ve şemada olmayan alanları ayıkla
    const {
      frames,
      prescriptions,
      customer,
      customerName,   // Use customerName instead of fullName
      customerId,
      ...orderData
    } = updateOrderDto;
    // 2. Prisma'ya gönderilecek temiz veriyi hazırla
    const dataToUpdate: any = {
      ...orderData,
    };

    // Eğer isim güncellendiyse şemadaki doğru alana eşle
    if (customerName) {
      dataToUpdate.customerFullName = customerName;
    }

    // Eğer müşteri ID'si değişiyorsa ilişkiyi güncelle (isteğe bağlı)
    if (customerId) {
      dataToUpdate.customerId = customerId;
    }

    // 3. Güncelleme işlemini yap
    return this.prisma.order.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: true,
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return orders.map((order) => {
      const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const { payments, ...orderData } = order;
      return {
        ...orderData,
        paidAmount,
      };
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            relative: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        frames: true,
        prescriptions: {
          include: {
            lenses: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found.`);
    }

    const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const { payments, ...orderData } = order;

    return {
      ...orderData,
      paidAmount,
    };
  }
}