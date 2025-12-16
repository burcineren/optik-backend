import {
  PrismaClient,
  Role,
  OrderStatus,
  PaymentMethod,
  EyeSide,
  PrescriptionType,
  StockMovementType,   // <-- YENİ
  StockMovementStatus  // <-- YENİ
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. CLEAR DATA
  // Constraint hatası almamak için child tablodan parent tabloya doğru siliyoruz.
  console.log('🧹 Clearing existing data...');
  await prisma.stockMovement.deleteMany(); // <-- YENİ: En bağımlı tablo önce silinir
  await prisma.payment.deleteMany();
  await prisma.lens.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.frame.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany(); // <-- YENİ
  await prisma.product.deleteMany();        // <-- YENİ
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.relative.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared');

  // 2. CREATE USERS
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

  // 3. CREATE CUSTOMERS
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

  // 4. CREATE CATEGORY & PRODUCTS & VARIANTS (Stok Hareketleri İçin Gerekli)
  console.log('📂 Creating category...');
  const category = await prisma.category.create({
    data: {
      name: 'Güneş Gözlükleri',
      slug: 'gunes-gozlukleri',
      description: 'Güneş gözlüğü çerçeveleri',
    },
  });

  console.log('📦 Creating inventory products...');
  const productRayBan = await prisma.product.create({
    data: {
      name: 'Ray-Ban Wayfarer',
      description: 'Klasik Asetat Çerçeve',
      categoryId: category.id,
      variants: {
        create: [
          {
            name: 'Ray-Ban Wayfarer Black 50mm',
            sku: 'RB2140-BLK-50',
            price: 4500.0,
            stock: 0, // Başlangıç stoğu
          }
        ]
      },
    },
    include: { variants: true }
  });

  const variant = productRayBan.variants[0];
  console.log(`✅ Created product variant: ${variant.sku}`);

  // 5. CREATE STOCK MOVEMENTS
  console.log('🚚 Processing stock movements...');

  // Giriş Hareketi
  const movementIn = await prisma.stockMovement.create({
    data: {
      movementType: StockMovementType.PURCHASE,
      status: StockMovementStatus.COMPLETED,
      quantity: 50,
      unitPrice: 2000.0,
      totalPrice: 100000.0,
      referenceNo: 'IRSALIYE-001',
      notes: 'Depo açılış stoğu',
      movementDate: new Date(),
      variantId: variant.id,
      userId: admin.id,
    }
  });

  // Sayım/Düzeltme Hareketi
  const movementAdj = await prisma.stockMovement.create({
    data: {
      movementType: StockMovementType.ADJUSTMENT,
      status: StockMovementStatus.PENDING,
      quantity: -1,
      unitPrice: 2000.0,
      totalPrice: 2000.0,
      notes: 'Rafta hasarlı ürün tespit edildi.',
      variantId: variant.id,
      userId: user.id,
    }
  });
  console.log(`✅ Created stock movements: IN (+50) and ADJUSTMENT (-1)`);

  // 6. CREATE ORDERS (Mevcut sipariş yapısı)
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
      customerFullName: customer1.fullName,
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
      customerFullName: customer2.fullName,
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