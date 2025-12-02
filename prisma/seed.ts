import { PrismaClient, Role, OrderStatus, PaymentMethod, EyeSide, PrescriptionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data in the correct order to avoid constraint violations
  console.log('🧹 Clearing existing data...');
  await prisma.payment.deleteMany();
  await prisma.lens.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.frame.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.relative.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared');

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create regular user
  console.log('👤 Creating regular user...');
  const userPassword = await bcrypt.hash('user123', SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      role: Role.USER,
    },
  });
  console.log(`✅ Created regular user: ${user.email}`);

  // Create customers
  console.log('👥 Creating customers...');
  const customer1 = await prisma.customer.create({
    data: {
      tcIdentityNumber: '11111111111',
      fullName: 'Ahmet Yılmaz',
      phoneNumber: '5551112233',
      email: 'ahmet.yilmaz@example.com',
      address: 'Göztepe Mah. İstanbul',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      tcIdentityNumber: '22222222222',
      fullName: 'Zeynep Kaya',
      phoneNumber: '5554445566',
      email: 'zeynep.kaya@example.com',
      address: 'Alsancak, İzmir',
    },
  });
  console.log(`✅ Created ${[customer1, customer2].length} customers`);

  // --- ORDER 1 for Ahmet Yılmaz ---
  console.log(`🛒 Creating a detailed order for ${customer1.fullName}...`);
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-1`,
      totalAmount: 1850.0,
      sgkAmount: 250.0,
      remainingAmount: 1600.0,
      status: OrderStatus.PROCESSING,
      prescriptionType: PrescriptionType.E_RECIPE,
      notes: 'Mavi ışık filtresi ve inceltme istendi.',
      userId: admin.id,
      customerId: customer1.id,
      frames: {
        create: [
          {
            brand: 'Ray-Ban',
            model: 'Wayfarer',
            color: 'Siyah',
            type: 'Asetat',
          },
        ],
      },
      prescriptions: {
        create: [
          {
            eyeSide: EyeSide.RIGHT,
            distanceSph: -1.75,
            distanceCyl: -0.5,
            distanceAx: 90,
            lenses: {
              create: {
                lensType: 'single',
                material: 'polycarbonate',
                coating: 'blue-light',
                lensIndex: '1.59',
              },
            },
          },
          {
            eyeSide: EyeSide.LEFT,
            distanceSph: -2.0,
            distanceCyl: -0.25,
            distanceAx: 85,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 800.0,
            paymentMethod: PaymentMethod.CREDIT_CARD,
            notes: 'Kredi kartı ön ödeme',
          },
        ],
      },
    },
  });
  console.log(`✅ Created order #${order1.orderNumber}`);

  // --- ORDER 2 for Zeynep Kaya ---
  console.log(`🛒 Creating a detailed order for ${customer2.fullName}...`);
  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-2`,
      totalAmount: 3200.0,
      sgkAmount: 0,
      remainingAmount: 3200.0,
      status: OrderStatus.PENDING,
      prescriptionType: PrescriptionType.MANUAL,
      notes: 'Sadece güneş gözlüğü, numarasız.',
      userId: user.id,
      customerId: customer2.id,
      frames: {
        create: [
          {
            brand: 'Prada',
            model: 'PR 17WS',
            color: 'Siyah/Altın',
            type: 'Kombine',
          },
          {
            brand: 'Gucci',
            model: 'GG0516S',
            color: 'Havana',
            type: 'Asetat',
          },
        ],
      },
      // No prescription for this order
      payments: {
        create: [
          {
            amount: 1000.0,
            paymentMethod: PaymentMethod.CASH,
            notes: 'Nakit kapora',
          },
          {
            amount: 500.0,
            paymentMethod: PaymentMethod.CASH,
            notes: 'Ek ödeme',
          },
        ],
      },
    },
  });
  console.log(`✅ Created order #${order2.orderNumber}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🌱 Seeding completed successfully!');
  });
