import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();

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
      profile: {
        create: {
          bio: 'System Administrator',
          phone: '+1987654321',
        },
      },
    },
  });
  console.log(`✅ Created admin user with ID: ${admin.id}`);

  // Create regular user with address
  console.log('👤 Creating regular user with address...');
  const userPassword = await bcrypt.hash('user123', SALT_ROUNDS);

  // First create the user with profile
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      role: Role.USER,
      profile: {
        create: {
          bio: 'Regular User',
          phone: '+1987654321',
        },
      },
    },
    include: {
      addresses: true
    }
  });

  // Then create the address separately
  const address = await prisma.address.create({
    data: {
      userId: user.id,
      title: 'Home',
      receiver: 'Regular User',
      phone: '+1987654321',
      city: 'Istanbul',
      district: 'Kadikoy',
      address: 'Example Street No:123',
      isDefault: true,
    },
  });

  // Update the user object to include the address
  user.addresses = [address];
  console.log(`✅ Created regular user with ID: ${user.id}`);

  // Create categories
  console.log('📦 Creating categories...');
  const categories = await prisma.$transaction([
    prisma.category.create({
      data: {
        name: 'Sunglasses',
        description: 'Stylish sunglasses for all occasions',
        slug: 'sunglasses',
        imageUrl: 'https://example.com/images/sunglasses.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Eyeglasses',
        description: 'Prescription and reading glasses',
        slug: 'eyeglasses',
        imageUrl: 'https://example.com/images/eyeglasses.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Contact Lenses',
        description: 'Daily and monthly contact lenses',
        slug: 'contact-lenses',
        imageUrl: 'https://example.com/images/contacts.jpg',
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Create products
  console.log('🛍️ Creating products...');
  const products = await prisma.$transaction([
    prisma.product.create({
      data: {
        name: 'Classic Aviator Sunglasses',
        description: 'Timeless aviator sunglasses with UV protection',
        price: 149.99,
        stock: 50,
        sku: 'SUN001',
        images: [
          'https://example.com/images/aviator1.jpg',
          'https://example.com/images/aviator2.jpg',
        ],
        isFeatured: true,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Modern Round Eyeglasses',
        description: 'Stylish round eyeglasses with blue light filter',
        price: 199.99,
        stock: 30,
        sku: 'EYE001',
        images: [
          'https://example.com/images/round1.jpg',
          'https://example.com/images/round2.jpg',
        ],
        isFeatured: true,
        categoryId: categories[1].id,
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  // Create a customer first
  console.log('👥 Creating a customer...');
  const customer = await prisma.customer.create({
    data: {
      tcIdentityNumber: '12345678901',
      fullName: 'John Doe',
      phoneNumber: '5551234567',
      email: 'john.doe@example.com',
      address: '123 Main St, Anytown'
    },
  });
  console.log(`✅ Created customer with ID: ${customer.id}`);

  // Create an order
  console.log('🛒 Creating a sample order...');
  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      totalAmount: products[0].price * 2 + products[1].price, // 2 of first product, 1 of second
      status: 'PENDING',
      userId: user.id,
      addressId: address.id,
      customerId: customer.id,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 2,
            price: products[0].price,
          },
          {
            productId: products[1].id,
            quantity: 1,
            price: products[1].price,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });
  console.log(`✅ Created order #${order.orderNumber} with ${order.items.length} items`);
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
