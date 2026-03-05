import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface VariantDef {
  name: string;
  value: string;
  stock: number;
  skuSuffix: string;
}

interface ProductDef {
  slug: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  imageUrl: string;
  variants: VariantDef[];
}

const products: ProductDef[] = [
  {
    slug: 'nike-air-classic-white-sneakers',
    sku: 'SHOE-M-001',
    name: 'Nike Air Classic White Sneakers',
    description:
      'Lightweight everyday sneakers with a clean white colorway and cushioned sole. Suitable for casual wear and light sport activity.',
    price: 89.99,
    category: "Men's Footwear / Sneakers",
    tags: ['sneakers', 'white', 'nike', 'casual', 'sport', 'lightweight'],
    imageUrl: 'https://placehold.co/600x600?text=Nike+Air+Classic',
    variants: [
      { name: 'Size', value: '40', stock: 3, skuSuffix: '40' },
      { name: 'Size', value: '41', stock: 8, skuSuffix: '41' },
      { name: 'Size', value: '42', stock: 12, skuSuffix: '42' },
      { name: 'Size', value: '43', stock: 10, skuSuffix: '43' },
      { name: 'Size', value: '44', stock: 5, skuSuffix: '44' },
      { name: 'Size', value: '45', stock: 2, skuSuffix: '45' },
    ],
  },
  {
    slug: 'adidas-ultraboost-black-sneakers',
    sku: 'SHOE-M-002',
    name: 'Adidas Ultraboost Black Sneakers',
    description:
      'High-performance running sneakers with responsive Boost midsole. Ideal for daily runs and streetwear. Available in all-black colorway.',
    price: 129.99,
    category: "Men's Footwear / Sneakers",
    tags: ['sneakers', 'black', 'adidas', 'running', 'sport', 'boost'],
    imageUrl: 'https://placehold.co/600x600?text=Adidas+Ultraboost',
    variants: [
      { name: 'Size', value: '40', stock: 0, skuSuffix: '40' },
      { name: 'Size', value: '41', stock: 4, skuSuffix: '41' },
      { name: 'Size', value: '42', stock: 7, skuSuffix: '42' },
      { name: 'Size', value: '43', stock: 9, skuSuffix: '43' },
      { name: 'Size', value: '44', stock: 6, skuSuffix: '44' },
      { name: 'Size', value: '45', stock: 1, skuSuffix: '45' },
    ],
  },
  {
    slug: 'new-balance-574-grey-sneakers',
    sku: 'SHOE-W-001',
    name: 'New Balance 574 Grey Sneakers',
    description:
      'Iconic retro silhouette with premium suede and mesh upper. A timeless style for women that pairs with any casual outfit.',
    price: 99.99,
    category: "Women's Footwear / Sneakers",
    tags: ['sneakers', 'grey', 'new balance', 'retro', 'casual', 'suede'],
    imageUrl: 'https://placehold.co/600x600?text=NB+574+Grey',
    variants: [
      { name: 'Size', value: '36', stock: 5, skuSuffix: '36' },
      { name: 'Size', value: '37', stock: 8, skuSuffix: '37' },
      { name: 'Size', value: '38', stock: 10, skuSuffix: '38' },
      { name: 'Size', value: '39', stock: 7, skuSuffix: '39' },
      { name: 'Size', value: '40', stock: 3, skuSuffix: '40' },
      { name: 'Size', value: '41', stock: 1, skuSuffix: '41' },
    ],
  },
  {
    slug: 'converse-chuck-taylor-black-ankle-boots',
    sku: 'SHOE-W-002',
    name: 'Converse Chuck Taylor Black Ankle Boots',
    description:
      'Classic Chuck Taylor high-top style reimagined as ankle boots. Canvas upper, rubber sole, iconic star logo. Unisex fit, listed in women\'s sizing.',
    price: 74.99,
    category: "Women's Footwear / Ankle Boots",
    tags: ['boots', 'black', 'converse', 'classic', 'canvas', 'ankle'],
    imageUrl: 'https://placehold.co/600x600?text=Converse+Chuck+Boots',
    variants: [
      { name: 'Size', value: '36', stock: 2, skuSuffix: '36' },
      { name: 'Size', value: '37', stock: 6, skuSuffix: '37' },
      { name: 'Size', value: '38', stock: 9, skuSuffix: '38' },
      { name: 'Size', value: '39', stock: 5, skuSuffix: '39' },
      { name: 'Size', value: '40', stock: 0, skuSuffix: '40' },
    ],
  },
  {
    slug: 'nike-dri-fit-white-basic-tshirt',
    sku: 'TEE-M-001',
    name: 'Nike Dri-FIT White Basic T-Shirt',
    description:
      'Everyday performance tee with Nike Dri-FIT moisture-wicking technology. Lightweight, breathable fabric. Great for gym or casual wear.',
    price: 34.99,
    category: "Men's Clothing / T-Shirts",
    tags: ['t-shirt', 'white', 'nike', 'sport', 'gym', 'basic', 'dri-fit'],
    imageUrl: 'https://placehold.co/600x600?text=Nike+Dri-FIT+Tee',
    variants: [
      { name: 'Size', value: 'S', stock: 15, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 20, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 18, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 10, skuSuffix: 'XL' },
      { name: 'Size', value: 'XXL', stock: 4, skuSuffix: 'XXL' },
    ],
  },
  {
    slug: 'hm-graphic-print-black-tshirt',
    sku: 'TEE-M-002',
    name: 'H&M Graphic Print Black T-Shirt',
    description:
      'Cotton crew-neck tee with bold graphic front print. Relaxed fit, pre-washed for a soft feel right out of the box.',
    price: 19.99,
    category: "Men's Clothing / T-Shirts",
    tags: ['t-shirt', 'black', 'graphic', 'hm', 'casual', 'cotton'],
    imageUrl: 'https://placehold.co/600x600?text=HM+Graphic+Tee',
    variants: [
      { name: 'Size', value: 'S', stock: 10, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 25, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 20, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 8, skuSuffix: 'XL' },
    ],
  },
  {
    slug: 'champion-reverse-weave-navy-hoodie',
    sku: 'HOOD-M-001',
    name: 'Champion Reverse Weave Navy Hoodie',
    description:
      'The original reverse weave construction reduces shrinkage. Heavyweight 12 oz cotton fleece, kangaroo pocket, ribbed cuffs. A wardrobe staple for any season.',
    price: 64.99,
    category: "Men's Clothing / Hoodies",
    tags: ['hoodie', 'navy', 'champion', 'fleece', 'casual', 'streetwear'],
    imageUrl: 'https://placehold.co/600x600?text=Champion+Hoodie',
    variants: [
      { name: 'Size', value: 'S', stock: 6, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 14, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 16, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 9, skuSuffix: 'XL' },
      { name: 'Size', value: 'XXL', stock: 3, skuSuffix: 'XXL' },
    ],
  },
  {
    slug: 'adidas-trefoil-grey-hoodie',
    sku: 'HOOD-M-002',
    name: 'Adidas Trefoil Grey Hoodie',
    description:
      'Classic Adidas Originals hoodie with embroidered trefoil logo. Regular fit, soft cotton-polyester blend, front pouch pocket.',
    price: 69.99,
    category: "Men's Clothing / Hoodies",
    tags: ['hoodie', 'grey', 'adidas', 'originals', 'logo', 'casual'],
    imageUrl: 'https://placehold.co/600x600?text=Adidas+Hoodie',
    variants: [
      { name: 'Size', value: 'S', stock: 0, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 5, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 11, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 7, skuSuffix: 'XL' },
    ],
  },
  {
    slug: 'levis-501-original-blue-jeans',
    sku: 'JEAN-M-001',
    name: "Levi's 501 Original Blue Jeans",
    description:
      "The original straight fit jean since 1873. 100% cotton denim, button fly, five-pocket styling. A timeless piece that gets better with wear.",
    price: 79.99,
    category: "Men's Clothing / Jeans",
    tags: ['jeans', 'blue', 'levis', 'denim', 'straight', 'classic'],
    imageUrl: 'https://placehold.co/600x600?text=Levis+501',
    variants: [
      { name: 'Size', value: '30x30', stock: 4, skuSuffix: '30X30' },
      { name: 'Size', value: '30x32', stock: 7, skuSuffix: '30X32' },
      { name: 'Size', value: '32x30', stock: 9, skuSuffix: '32X30' },
      { name: 'Size', value: '32x32', stock: 12, skuSuffix: '32X32' },
      { name: 'Size', value: '34x32', stock: 6, skuSuffix: '34X32' },
      { name: 'Size', value: '36x32', stock: 2, skuSuffix: '36X32' },
    ],
  },
  {
    slug: 'zara-floral-midi-dress',
    sku: 'DRESS-W-001',
    name: 'Zara Floral Midi Dress',
    description:
      'Lightweight midi dress with an all-over floral print on a white base. V-neckline, puff sleeves, elasticated waist. Perfect for spring and summer.',
    price: 59.99,
    category: "Women's Clothing / Dresses",
    tags: ['dress', 'floral', 'zara', 'midi', 'summer', 'white', 'feminine'],
    imageUrl: 'https://placehold.co/600x600?text=Zara+Floral+Dress',
    variants: [
      { name: 'Size', value: 'XS', stock: 3, skuSuffix: 'XS' },
      { name: 'Size', value: 'S', stock: 8, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 11, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 6, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 2, skuSuffix: 'XL' },
    ],
  },
  {
    slug: 'mango-ribbed-beige-knit-top',
    sku: 'TOP-W-001',
    name: 'Mango Ribbed Beige Knit Top',
    description:
      'Fitted ribbed knit top with a round neckline and short sleeves. Versatile wardrobe essential that pairs with jeans, skirts, or trousers.',
    price: 39.99,
    category: "Women's Clothing / Tops",
    tags: ['top', 'beige', 'mango', 'knit', 'ribbed', 'casual', 'minimal'],
    imageUrl: 'https://placehold.co/600x600?text=Mango+Knit+Top',
    variants: [
      { name: 'Size', value: 'XS', stock: 7, skuSuffix: 'XS' },
      { name: 'Size', value: 'S', stock: 12, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 10, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 4, skuSuffix: 'L' },
    ],
  },
  {
    slug: 'nike-pro-black-leggings',
    sku: 'LEG-W-001',
    name: 'Nike Pro Black Leggings',
    description:
      'Nike Pro tight-fit leggings with Dri-FIT technology. High-waisted design, 7/8 length, smooth fabric with slight compression. Ideal for yoga, training, or everyday wear.',
    price: 54.99,
    category: "Women's Clothing / Leggings",
    tags: ['leggings', 'black', 'nike', 'sport', 'gym', 'yoga', 'dri-fit', 'high-waist'],
    imageUrl: 'https://placehold.co/600x600?text=Nike+Pro+Leggings',
    variants: [
      { name: 'Size', value: 'XS', stock: 5, skuSuffix: 'XS' },
      { name: 'Size', value: 'S', stock: 14, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 16, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 9, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 3, skuSuffix: 'XL' },
    ],
  },
  {
    slug: 'puma-essential-navy-joggers',
    sku: 'JOG-U-001',
    name: 'Puma Essential Navy Joggers',
    description:
      'Comfortable everyday joggers with Puma cat logo on left thigh. Elastic waistband with drawstring, tapered leg, two side pockets. Unisex fit, runs true to size.',
    price: 44.99,
    category: 'Unisex Sport / Joggers',
    tags: ['joggers', 'navy', 'puma', 'sport', 'casual', 'unisex', 'comfortable'],
    imageUrl: 'https://placehold.co/600x600?text=Puma+Joggers',
    variants: [
      { name: 'Size', value: 'XS', stock: 4, skuSuffix: 'XS' },
      { name: 'Size', value: 'S', stock: 9, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 18, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 15, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 7, skuSuffix: 'XL' },
      { name: 'Size', value: 'XXL', stock: 2, skuSuffix: 'XXL' },
    ],
  },
  {
    slug: 'adidas-tiro-black-joggers',
    sku: 'JOG-U-002',
    name: 'Adidas Tiro Black Joggers',
    description:
      'Technical training joggers inspired by Adidas football kits. Slim tapered fit, moisture-wicking fabric, zip pockets, contrast stripes.',
    price: 54.99,
    category: 'Unisex Sport / Joggers',
    tags: ['joggers', 'black', 'adidas', 'training', 'tapered', 'football', 'slim'],
    imageUrl: 'https://placehold.co/600x600?text=Adidas+Tiro+Joggers',
    variants: [
      { name: 'Size', value: 'S', stock: 0, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 3, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 8, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 10, skuSuffix: 'XL' },
      { name: 'Size', value: 'XXL', stock: 5, skuSuffix: 'XXL' },
    ],
  },
  {
    slug: 'nike-windrunner-blue-windbreaker',
    sku: 'WIND-U-001',
    name: 'Nike Windrunner Blue Windbreaker',
    description:
      'Iconic Nike Windrunner jacket with chevron design on chest. Lightweight ripstop fabric, packable into front pocket, elastic cuffs. Protection from wind and light rain.',
    price: 99.99,
    category: 'Unisex Sport / Windbreakers',
    tags: ['windbreaker', 'blue', 'nike', 'jacket', 'outdoor', 'packable', 'light'],
    imageUrl: 'https://placehold.co/600x600?text=Nike+Windrunner',
    variants: [
      { name: 'Size', value: 'S', stock: 3, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 7, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 9, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 6, skuSuffix: 'XL' },
      { name: 'Size', value: 'XXL', stock: 1, skuSuffix: 'XXL' },
    ],
  },
  {
    slug: 'hm-basic-white-womens-tshirt',
    sku: 'TEE-W-001',
    name: "H&M Basic White Women's T-Shirt",
    description:
      "Simple relaxed-fit cotton tee for women. Crew neck, short sleeves. An everyday essential that works with everything.",
    price: 14.99,
    category: "Women's Clothing / Tops",
    tags: ['t-shirt', 'white', 'hm', 'basic', 'casual', 'cotton', 'women'],
    imageUrl: 'https://placehold.co/600x600?text=HM+Basic+Tee+Women',
    variants: [
      { name: 'Size', value: 'XS', stock: 12, skuSuffix: 'XS' },
      { name: 'Size', value: 'S', stock: 20, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 18, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 10, skuSuffix: 'L' },
      { name: 'Size', value: 'XL', stock: 5, skuSuffix: 'XL' },
    ],
  },
  {
    slug: 'zara-high-rise-black-skinny-jeans',
    sku: 'JEAN-W-001',
    name: 'Zara High-Rise Black Skinny Jeans',
    description:
      'High-rise skinny jeans in black stretch denim. Five-pocket design, ankle-length cut. Fits close to the body from hip to ankle.',
    price: 69.99,
    category: "Women's Clothing / Jeans",
    tags: ['jeans', 'black', 'zara', 'skinny', 'high-rise', 'stretch', 'denim'],
    imageUrl: 'https://placehold.co/600x600?text=Zara+Skinny+Jeans',
    variants: [
      { name: 'Size', value: '34', stock: 4, skuSuffix: '34' },
      { name: 'Size', value: '36', stock: 9, skuSuffix: '36' },
      { name: 'Size', value: '38', stock: 13, skuSuffix: '38' },
      { name: 'Size', value: '40', stock: 8, skuSuffix: '40' },
      { name: 'Size', value: '42', stock: 3, skuSuffix: '42' },
      { name: 'Size', value: '44', stock: 0, skuSuffix: '44' },
    ],
  },
  {
    slug: 'timberland-wheat-classic-6inch-boots',
    sku: 'SHOE-M-003',
    name: 'Timberland Wheat Classic 6-Inch Boots',
    description:
      'The iconic waterproof nubuck leather boot with padded collar and lug sole. Durable construction for outdoor use and urban style.',
    price: 189.99,
    category: "Men's Footwear / Boots",
    tags: ['boots', 'wheat', 'timberland', 'leather', 'waterproof', 'outdoor', 'classic'],
    imageUrl: 'https://placehold.co/600x600?text=Timberland+6+Inch',
    variants: [
      { name: 'Size', value: '40', stock: 2, skuSuffix: '40' },
      { name: 'Size', value: '41', stock: 3, skuSuffix: '41' },
      { name: 'Size', value: '42', stock: 5, skuSuffix: '42' },
      { name: 'Size', value: '43', stock: 6, skuSuffix: '43' },
      { name: 'Size', value: '44', stock: 4, skuSuffix: '44' },
      { name: 'Size', value: '45', stock: 2, skuSuffix: '45' },
      { name: 'Size', value: '46', stock: 1, skuSuffix: '46' },
    ],
  },
  {
    slug: 'champion-pink-crop-hoodie',
    sku: 'HOOD-W-001',
    name: 'Champion Pink Crop Hoodie',
    description:
      'Cropped version of the classic Champion reverse weave hoodie. Ribbed waistband, embroidered script logo, kangaroo pocket. Soft fleece interior. A streetwear favourite.',
    price: 59.99,
    category: "Women's Clothing / Hoodies",
    tags: ['hoodie', 'pink', 'champion', 'crop', 'streetwear', 'fleece', 'women'],
    imageUrl: 'https://placehold.co/600x600?text=Champion+Crop+Hoodie',
    variants: [
      { name: 'Size', value: 'XS', stock: 5, skuSuffix: 'XS' },
      { name: 'Size', value: 'S', stock: 10, skuSuffix: 'S' },
      { name: 'Size', value: 'M', stock: 8, skuSuffix: 'M' },
      { name: 'Size', value: 'L', stock: 3, skuSuffix: 'L' },
    ],
  },
  {
    slug: 'puma-suede-classic-black-sneakers',
    sku: 'SHOE-U-001',
    name: 'Puma Suede Classic Black Sneakers',
    description:
      'The Puma Suede has been a streetwear icon since 1968. Suede upper, rubber cupsole, formstrip branding on the side. Timeless silhouette that goes with everything. Listed in men\'s sizing.',
    price: 79.99,
    category: "Men's Footwear / Sneakers",
    tags: ['sneakers', 'black', 'puma', 'suede', 'classic', 'streetwear', 'retro'],
    imageUrl: 'https://placehold.co/600x600?text=Puma+Suede+Classic',
    variants: [
      { name: 'Size', value: '38', stock: 3, skuSuffix: '38' },
      { name: 'Size', value: '39', stock: 5, skuSuffix: '39' },
      { name: 'Size', value: '40', stock: 8, skuSuffix: '40' },
      { name: 'Size', value: '41', stock: 10, skuSuffix: '41' },
      { name: 'Size', value: '42', stock: 9, skuSuffix: '42' },
      { name: 'Size', value: '43', stock: 6, skuSuffix: '43' },
      { name: 'Size', value: '44', stock: 3, skuSuffix: '44' },
      { name: 'Size', value: '45', stock: 1, skuSuffix: '45' },
    ],
  },
];

async function main(): Promise<void> {
  console.log('Seeding database...');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const productDef of products) {
      const { variants, ...productData } = productDef;

      await tx.product.upsert({
        where: { slug: productData.slug },
        update: {},
        create: {
          slug: productData.slug,
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          tags: productData.tags,
          imageUrl: productData.imageUrl,
          isActive: true,
          variants: {
            createMany: {
              data: variants.map((v) => ({
                name: v.name,
                value: v.value,
                stock: v.stock,
                priceDelta: 0,
                sku: `${productData.sku}-${v.skuSuffix}`,
              })),
              skipDuplicates: true,
            },
          },
        },
      });
    }
  });

  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();

  console.log('Seed complete.');
  console.log(`  Products: ${productCount}`);
  console.log(`  Variants: ${variantCount}`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
