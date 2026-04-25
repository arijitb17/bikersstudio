import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting seed...\n');

  // ============================================
  // USERS
  // ============================================
  console.log('👥 Creating users...');
  
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bikestore.com' },
    update: {},
    create: {
      email: 'admin@bikestore.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@bikestore.com' },
    update: {},
    create: {
      email: 'user@bikestore.com',
      name: 'Test User',
      password: userPassword,
      role: 'USER',
      phone: '+91 9876543210',
    },
  });

  console.log('✅ Users created\n');

  // ============================================
  // BRANDS
  // ============================================
  console.log('🏍️  Creating brands...');

  const kawasaki = await prisma.brand.upsert({
    where: { slug: 'kawasaki' },
    update: {},
    create: {
      name: 'Kawasaki',
      slug: 'kawasaki',
      logo: '/brands/kawasaki.png',
      bgColor: 'bg-green-600',
      textColor: 'text-white',
      description: 'Kawasaki Heavy Industries - Let the good times roll',
      isActive: true,
    },
  });

  const ktm = await prisma.brand.upsert({
    where: { slug: 'ktm' },
    update: {},
    create: {
      name: 'KTM',
      slug: 'ktm',
      logo: '/brands/ktm.png',
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
      description: 'Ready to Race',
      isActive: true,
    },
  });

  const yamaha = await prisma.brand.upsert({
    where: { slug: 'yamaha' },
    update: {},
    create: {
      name: 'Yamaha',
      slug: 'yamaha',
      logo: '/brands/yamaha.png',
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      description: 'Revs Your Heart',
      isActive: true,
    },
  });

  const honda = await prisma.brand.upsert({
    where: { slug: 'honda' },
    update: {},
    create: {
      name: 'Honda',
      slug: 'honda',
      logo: '/brands/honda.png',
      bgColor: 'bg-red-600',
      textColor: 'text-white',
      description: 'The Power of Dreams',
      isActive: true,
    },
  });

  const royalEnfield = await prisma.brand.upsert({
    where: { slug: 'royal-enfield' },
    update: {},
    create: {
      name: 'Royal Enfield',
      slug: 'royal-enfield',
      logo: '/brands/royal-enfield.png',
      bgColor: 'bg-black',
      textColor: 'text-white',
      description: 'Made Like a Gun',
      isActive: true,
    },
  });

  console.log('✅ Brands created\n');

  // ============================================
  // BIKES
  // ============================================
  console.log('🏍️  Creating bikes...');

  const ninja400 = await prisma.bike.upsert({
    where: { slug: 'ninja-400' },
    update: {},
    create: {
      name: 'Ninja 400',
      slug: 'ninja-400',
      model: 'Ninja 400',
      year: 2024,
      description: 'Lightweight sportbike with parallel-twin engine delivering thrilling performance',
      image: '/bikes/ninja-400.jpg',
      brandId: kawasaki.id,
      isActive: true,
    },
  });

  const z650 = await prisma.bike.upsert({
    where: { slug: 'z650' },
    update: {},
    create: {
      name: 'Z650',
      slug: 'z650',
      model: 'Z650',
      year: 2024,
      description: 'Naked street bike with aggressive styling and smooth power delivery',
      image: '/bikes/z650.jpg',
      brandId: kawasaki.id,
      isActive: true,
    },
  });

  const duke390 = await prisma.bike.upsert({
    where: { slug: 'duke-390' },
    update: {},
    create: {
      name: 'Duke 390',
      slug: 'duke-390',
      model: '390 Duke',
      year: 2024,
      description: 'The Scalpel - Sharp, precise, and deadly fast',
      image: '/bikes/duke-390.jpg',
      brandId: ktm.id,
      isActive: true,
    },
  });

  const rc390 = await prisma.bike.upsert({
    where: { slug: 'rc-390' },
    update: {},
    create: {
      name: 'RC 390',
      slug: 'rc-390',
      model: 'RC 390',
      year: 2024,
      description: 'Track-focused sportbike with aggressive ergonomics',
      image: '/bikes/rc-390.jpg',
      brandId: ktm.id,
      isActive: true,
    },
  });

  const r15 = await prisma.bike.upsert({
    where: { slug: 'r15-v4' },
    update: {},
    create: {
      name: 'YZF R15 V4',
      slug: 'r15-v4',
      model: 'YZF-R15',
      year: 2024,
      description: 'The Beast - Premium sporty design with VVA technology',
      image: '/bikes/r15.jpg',
      brandId: yamaha.id,
      isActive: true,
    },
  });

  const mt15 = await prisma.bike.upsert({
    where: { slug: 'mt-15' },
    update: {},
    create: {
      name: 'MT-15',
      slug: 'mt-15',
      model: 'MT-15',
      year: 2024,
      description: 'Dark side of Japan - Aggressive naked streetfighter',
      image: '/bikes/mt-15.jpg',
      brandId: yamaha.id,
      isActive: true,
    },
  });

  const cbr250r = await prisma.bike.upsert({
    where: { slug: 'cbr-250r' },
    update: {},
    create: {
      name: 'CBR 250R',
      slug: 'cbr-250r',
      model: 'CBR250R',
      year: 2024,
      description: 'Sporty quarter-liter with legendary Honda reliability',
      image: '/bikes/cbr-250r.jpg',
      brandId: honda.id,
      isActive: true,
    },
  });

  const classic350 = await prisma.bike.upsert({
    where: { slug: 'classic-350' },
    update: {},
    create: {
      name: 'Classic 350',
      slug: 'classic-350',
      model: 'Classic 350',
      year: 2024,
      description: 'Timeless retro cruiser with modern engineering',
      image: '/bikes/classic-350.jpg',
      brandId: royalEnfield.id,
      isActive: true,
    },
  });

  const himalayan = await prisma.bike.upsert({
    where: { slug: 'himalayan-450' },
    update: {},
    create: {
      name: 'Himalayan 450',
      slug: 'himalayan-450',
      model: 'Himalayan 450',
      year: 2024,
      description: 'Adventure motorcycle built for the mountains',
      image: '/bikes/himalayan.jpg',
      brandId: royalEnfield.id,
      isActive: true,
    },
  });

  console.log('✅ Bikes created\n');

  // ============================================
  // CATEGORIES
  // ============================================
  console.log('📦 Creating categories...');

  // General Categories
  const helmets = await prisma.category.upsert({
    where: { slug: 'helmets' },
    update: {},
    create: {
      name: 'Helmets',
      slug: 'helmets',
      description: 'Premium motorcycle helmets for safety',
      isActive: true,
    },
  });

  const ridingGear = await prisma.category.upsert({
    where: { slug: 'riding-gear' },
    update: {},
    create: {
      name: 'Riding Gear',
      slug: 'riding-gear',
      description: 'Protective riding equipment and apparel',
      isActive: true,
    },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Motorcycle accessories and parts',
      isActive: true,
    },
  });

  const maintenance = await prisma.category.upsert({
    where: { slug: 'maintenance' },
    update: {},
    create: {
      name: 'Maintenance',
      slug: 'maintenance',
      description: 'Oils, lubricants, and maintenance products',
      isActive: true,
    },
  });

  // Sub-categories under Helmets
  const fullFaceHelmets = await prisma.category.upsert({
    where: { slug: 'full-face-helmets' },
    update: {},
    create: {
      name: 'Full Face Helmets',
      slug: 'full-face-helmets',
      description: 'Maximum protection full face helmets',
      parentId: helmets.id,
      isActive: true,
    },
  });

  const halfFaceHelmets = await prisma.category.upsert({
    where: { slug: 'half-face-helmets' },
    update: {},
    create: {
      name: 'Half Face Helmets',
      slug: 'half-face-helmets',
      description: 'Open face helmets for urban riding',
      parentId: helmets.id,
      isActive: true,
    },
  });

  // Sub-categories under Riding Gear
  const jackets = await prisma.category.upsert({
    where: { slug: 'riding-jackets' },
    update: {},
    create: {
      name: 'Riding Jackets',
      slug: 'riding-jackets',
      description: 'Protective riding jackets',
      parentId: ridingGear.id,
      isActive: true,
    },
  });

  const gloves = await prisma.category.upsert({
    where: { slug: 'riding-gloves' },
    update: {},
    create: {
      name: 'Riding Gloves',
      slug: 'riding-gloves',
      description: 'Protective riding gloves',
      parentId: ridingGear.id,
      isActive: true,
    },
  });

  const boots = await prisma.category.upsert({
    where: { slug: 'riding-boots' },
    update: {},
    create: {
      name: 'Riding Boots',
      slug: 'riding-boots',
      description: 'Protective riding boots',
      parentId: ridingGear.id,
      isActive: true,
    },
  });

  // Sub-categories under Accessories
  const crashGuards = await prisma.category.upsert({
    where: { slug: 'crash-guards' },
    update: {},
    create: {
      name: 'Crash Guards',
      slug: 'crash-guards',
      description: 'Engine protection crash guards',
      parentId: accessories.id,
      isActive: true,
    },
  });

  const exhausts = await prisma.category.upsert({
    where: { slug: 'exhaust' },
    update: {},
    create: {
      name: 'Exhaust Systems',
      slug: 'exhaust',
      description: 'Performance exhaust systems',
      parentId: accessories.id,
      isActive: true,
    },
  });

  const mirrors = await prisma.category.upsert({
    where: { slug: 'side-mirrors' },
    update: {},
    create: {
      name: 'Side Mirrors',
      slug: 'side-mirrors',
      description: 'Motorcycle mirrors',
      parentId: accessories.id,
      isActive: true,
    },
  });

  console.log('✅ Categories created\n');

  // ============================================
  // PRODUCTS
  // ============================================
  console.log('🛍️  Creating products...');

  // Helmets
  await prisma.product.upsert({
    where: { slug: 'agv-k3-sv-helmet' },
    update: {},
    create: {
      name: 'AGV K3 SV Full Face Helmet',
      slug: 'agv-k3-sv-helmet',
      description: 'Premium full face helmet with superior aerodynamics and ventilation. DOT and ECE certified for maximum safety.',
      price: 15999,
      salePrice: 13999,
      stock: 25,
      sku: 'HELMET-AGV-K3SV-001',
      images: ['/products/agv-k3-sv-1.jpg', '/products/agv-k3-sv-2.jpg'],
      thumbnail: '/products/agv-k3-sv-1.jpg',
      categoryId: fullFaceHelmets.id,
      weight: 1.5,
      isFeatured: true,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'ls2-ff352-rookie-helmet' },
    update: {},
    create: {
      name: 'LS2 FF352 Rookie Full Face Helmet',
      slug: 'ls2-ff352-rookie-helmet',
      description: 'Affordable full face helmet with good protection and comfort. Perfect for daily commuting.',
      price: 5999,
      salePrice: 4999,
      stock: 40,
      sku: 'HELMET-LS2-FF352-001',
      images: ['/products/ls2-rookie-1.jpg', '/products/ls2-rookie-2.jpg'],
      thumbnail: '/products/ls2-rookie-1.jpg',
      categoryId: fullFaceHelmets.id,
      weight: 1.4,
      isFeatured: true,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'studds-ninja-elite-helmet' },
    update: {},
    create: {
      name: 'Studds Ninja Elite Half Face Helmet',
      slug: 'studds-ninja-elite-helmet',
      description: 'Lightweight half face helmet for urban riders. ISI certified.',
      price: 1299,
      salePrice: 999,
      stock: 60,
      sku: 'HELMET-STUDDS-NINJA-001',
      images: ['/products/studds-ninja-1.jpg'],
      thumbnail: '/products/studds-ninja-1.jpg',
      categoryId: halfFaceHelmets.id,
      weight: 0.9,
      isActive: true,
    },
  });

  // Riding Jackets
  await prisma.product.upsert({
    where: { slug: 'rynox-air-gt-3-jacket' },
    update: {},
    create: {
      name: 'Rynox Air GT 3 Riding Jacket',
      slug: 'rynox-air-gt-3-jacket',
      description: 'Premium mesh riding jacket with CE level 1 armor. Excellent ventilation for summer riding.',
      price: 7999,
      salePrice: 6999,
      stock: 30,
      sku: 'JACKET-RYNOX-AIRGT3-001',
      images: ['/products/rynox-airgt3-1.jpg', '/products/rynox-airgt3-2.jpg'],
      thumbnail: '/products/rynox-airgt3-1.jpg',
      categoryId: jackets.id,
      size: 'L',
      isFeatured: true,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'axor-apex-jacket' },
    update: {},
    create: {
      name: 'Axor Apex Riding Jacket',
      slug: 'axor-apex-jacket',
      description: 'All-weather riding jacket with removable thermal liner and waterproof membrane.',
      price: 4999,
      stock: 25,
      sku: 'JACKET-AXOR-APEX-001',
      images: ['/products/axor-apex-1.jpg'],
      thumbnail: '/products/axor-apex-1.jpg',
      categoryId: jackets.id,
      size: 'M',
      isActive: true,
    },
  });

  // Riding Gloves
  await prisma.product.upsert({
    where: { slug: 'rynox-scout-gloves' },
    update: {},
    create: {
      name: 'Rynox Scout Riding Gloves',
      slug: 'rynox-scout-gloves',
      description: 'Touch screen compatible gloves with knuckle protection. Perfect for all-season riding.',
      price: 1499,
      salePrice: 1299,
      stock: 50,
      sku: 'GLOVES-RYNOX-SCOUT-001',
      images: ['/products/rynox-scout-1.jpg'],
      thumbnail: '/products/rynox-scout-1.jpg',
      categoryId: gloves.id,
      size: 'L',
      isActive: true,
    },
  });

  // Riding Boots
  await prisma.product.upsert({
    where: { slug: 'axor-gravity-boots' },
    update: {},
    create: {
      name: 'Axor Gravity Riding Boots',
      slug: 'axor-gravity-boots',
      description: 'Mid-ankle riding boots with reinforced toe and heel. Comfortable for long rides.',
      price: 3999,
      salePrice: 3499,
      stock: 20,
      sku: 'BOOTS-AXOR-GRAVITY-001',
      images: ['/products/axor-gravity-1.jpg', '/products/axor-gravity-2.jpg'],
      thumbnail: '/products/axor-gravity-1.jpg',
      categoryId: boots.id,
      size: '9',
      isActive: true,
    },
  });

  // Crash Guards - Bike Specific
  await prisma.product.upsert({
    where: { slug: 'ninja-400-crash-guard' },
    update: {},
    create: {
      name: 'Kawasaki Ninja 400 Crash Guard',
      slug: 'ninja-400-crash-guard',
      description: 'Heavy-duty engine crash guard specifically designed for Kawasaki Ninja 400. Protects engine in case of falls.',
      price: 4999,
      salePrice: 4499,
      stock: 15,
      sku: 'GUARD-NINJA400-001',
      images: ['/products/ninja400-guard-1.jpg'],
      thumbnail: '/products/ninja400-guard-1.jpg',
      categoryId: crashGuards.id,
      bikeId: ninja400.id,
      material: 'Stainless Steel',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'duke-390-crash-guard' },
    update: {},
    create: {
      name: 'KTM Duke 390 Crash Guard',
      slug: 'duke-390-crash-guard',
      description: 'Premium crash guard for KTM Duke 390. Black powder-coated finish.',
      price: 3999,
      stock: 20,
      sku: 'GUARD-DUKE390-001',
      images: ['/products/duke390-guard-1.jpg'],
      thumbnail: '/products/duke390-guard-1.jpg',
      categoryId: crashGuards.id,
      bikeId: duke390.id,
      material: 'Mild Steel',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'r15-crash-guard' },
    update: {},
    create: {
      name: 'Yamaha R15 V4 Crash Guard',
      slug: 'r15-crash-guard',
      description: 'Sporty design crash guard for Yamaha R15 V4. Lightweight yet strong.',
      price: 3499,
      stock: 18,
      sku: 'GUARD-R15V4-001',
      images: ['/products/r15-guard-1.jpg'],
      thumbnail: '/products/r15-guard-1.jpg',
      categoryId: crashGuards.id,
      bikeId: r15.id,
      material: 'Stainless Steel',
      isActive: true,
    },
  });

  // Exhausts - Bike Specific
  await prisma.product.upsert({
    where: { slug: 'ninja-400-akrapovic-exhaust' },
    update: {},
    create: {
      name: 'Akrapovic Slip-On Exhaust - Ninja 400',
      slug: 'ninja-400-akrapovic-exhaust',
      description: 'Premium titanium slip-on exhaust for Kawasaki Ninja 400. Increases power and reduces weight.',
      price: 45999,
      salePrice: 42999,
      stock: 8,
      sku: 'EXHAUST-NINJA400-AKR-001',
      images: ['/products/ninja400-akra-1.jpg', '/products/ninja400-akra-2.jpg'],
      thumbnail: '/products/ninja400-akra-1.jpg',
      categoryId: exhausts.id,
      bikeId: ninja400.id,
      material: 'Titanium',
      isFeatured: true,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'duke-390-sc-project-exhaust' },
    update: {},
    create: {
      name: 'SC Project Slip-On - Duke 390',
      slug: 'duke-390-sc-project-exhaust',
      description: 'Race-inspired slip-on exhaust for KTM Duke 390. Deep aggressive sound.',
      price: 38999,
      stock: 10,
      sku: 'EXHAUST-DUKE390-SCP-001',
      images: ['/products/duke390-sc-1.jpg'],
      thumbnail: '/products/duke390-sc-1.jpg',
      categoryId: exhausts.id,
      bikeId: duke390.id,
      material: 'Stainless Steel',
      isActive: true,
    },
  });

  // Mirrors - Universal
  await prisma.product.upsert({
    where: { slug: 'ktm-cnc-bar-end-mirrors' },
    update: {},
    create: {
      name: 'KTM CNC Bar End Mirrors',
      slug: 'ktm-cnc-bar-end-mirrors',
      description: 'Universal CNC machined aluminum bar end mirrors. Fits most bikes with hollow handlebars.',
      price: 1999,
      salePrice: 1699,
      stock: 35,
      sku: 'MIRROR-BAREND-CNC-001',
      images: ['/products/barend-mirror-1.jpg'],
      thumbnail: '/products/barend-mirror-1.jpg',
      categoryId: mirrors.id,
      material: 'Aluminum',
      isActive: true,
    },
  });

  // Maintenance Products
  await prisma.product.upsert({
    where: { slug: 'motul-7100-10w40' },
    update: {},
    create: {
      name: 'Motul 7100 10W40 Engine Oil (1L)',
      slug: 'motul-7100-10w40',
      description: '100% synthetic engine oil for high-performance motorcycles. Excellent protection and performance.',
      price: 899,
      salePrice: 799,
      stock: 100,
      sku: 'OIL-MOTUL-7100-1L',
      images: ['/products/motul-7100-1.jpg'],
      thumbnail: '/products/motul-7100-1.jpg',
      categoryId: maintenance.id,
      isFeatured: true,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'castrol-power1-4t-10w40' },
    update: {},
    create: {
      name: 'Castrol Power1 4T 10W40 (1L)',
      slug: 'castrol-power1-4t-10w40',
      description: 'Premium synthetic blend engine oil. Suitable for all 4-stroke motorcycles.',
      price: 599,
      stock: 120,
      sku: 'OIL-CASTROL-P1-1L',
      images: ['/products/castrol-p1-1.jpg'],
      thumbnail: '/products/castrol-p1-1.jpg',
      categoryId: maintenance.id,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'muc-off-chain-cleaner' },
    update: {},
    create: {
      name: 'Muc-Off Chain Cleaner (400ml)',
      slug: 'muc-off-chain-cleaner',
      description: 'Professional chain cleaning spray. Removes dirt and grime quickly.',
      price: 699,
      stock: 45,
      sku: 'CLEAN-MUCOFF-CHAIN-400',
      images: ['/products/mucoff-chain-1.jpg'],
      thumbnail: '/products/mucoff-chain-1.jpg',
      categoryId: maintenance.id,
      isActive: true,
    },
  });

  console.log('✅ Products created\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📝 LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin: admin@bikestore.com | Password: admin123');
  console.log('👤 User:  user@bikestore.com  | Password: user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📊 DATABASE STATS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`• Users: 2`);
  console.log(`• Brands: 5 (Kawasaki, KTM, Yamaha, Honda, Royal Enfield)`);
  console.log(`• Bikes: 9`);
  console.log(`• Categories: 13`);
  console.log(`• Products: 20+`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
