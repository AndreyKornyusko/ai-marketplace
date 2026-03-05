# Spec 01 — Store Context

**Status:** READY — seed data for testing

---

## STORE_PROFILE

```
Store Name:    AI Fashion Shop
Store URL:     aishop.com
Tagline:       Smart Style, Instant Answers — Fashion Powered by AI
Description:   AI Fashion Shop is a clothing and footwear store where an intelligent
               assistant helps you find exactly what you need — by size, style, or
               occasion — in seconds. Browse curated collections of casual and sport
               wear for men and women, with real-time stock updates and instant answers
               to any product question. No waiting for a manager — just smart shopping.
Currency:      USD
Language:      English
```

---

## CATALOG_SPEC

### Categories

```
- Men's Clothing
  - T-Shirts
  - Hoodies
  - Jeans
- Women's Clothing
  - Dresses
  - Tops
  - Leggings
- Men's Footwear
  - Sneakers
  - Boots
- Women's Footwear
  - Sneakers
  - Ankle Boots
- Unisex Sport
  - Joggers
  - Windbreakers
```

### Brands

```
Nike, Adidas, Puma, Zara, H&M, New Balance, Converse, Levi's, Champion, Mango
```

### Sample Products (seed data — 20 products)

---

**Product 1:**
```
name:         Nike Air Classic White Sneakers
slug:         nike-air-classic-white-sneakers
sku:          SHOE-M-001
brand:        Nike
description:  Lightweight everyday sneakers with a clean white colorway and cushioned
              sole. Suitable for casual wear and light sport activity.
price:        89.99
sizes:        [40, 41, 42, 43, 44, 45]
stock:        { 40: 3, 41: 8, 42: 12, 43: 10, 44: 5, 45: 2 }
category:     Men's Footwear / Sneakers
tags:         sneakers, white, nike, casual, sport, lightweight
imageUrl:     https://placehold.co/600x600?text=Nike+Air+Classic
```

**Product 2:**
```
name:         Adidas Ultraboost Black Sneakers
slug:         adidas-ultraboost-black-sneakers
sku:          SHOE-M-002
brand:        Adidas
description:  High-performance running sneakers with responsive Boost midsole.
              Ideal for daily runs and streetwear. Available in all-black colorway.
price:        129.99
sizes:        [40, 41, 42, 43, 44, 45]
stock:        { 40: 0, 41: 4, 42: 7, 43: 9, 44: 6, 45: 1 }
category:     Men's Footwear / Sneakers
tags:         sneakers, black, adidas, running, sport, boost
imageUrl:     https://placehold.co/600x600?text=Adidas+Ultraboost
```

**Product 3:**
```
name:         New Balance 574 Grey Sneakers
slug:         new-balance-574-grey-sneakers
sku:          SHOE-W-001
brand:        New Balance
description:  Iconic retro silhouette with premium suede and mesh upper.
              A timeless style for women that pairs with any casual outfit.
price:        99.99
sizes:        [36, 37, 38, 39, 40, 41]
stock:        { 36: 5, 37: 8, 38: 10, 39: 7, 40: 3, 41: 1 }
category:     Women's Footwear / Sneakers
tags:         sneakers, grey, new balance, retro, casual, suede
imageUrl:     https://placehold.co/600x600?text=NB+574+Grey
```

**Product 4:**
```
name:         Converse Chuck Taylor Black Ankle Boots
slug:         converse-chuck-taylor-black-ankle-boots
sku:          SHOE-W-002
brand:        Converse
description:  Classic Chuck Taylor high-top style reimagined as ankle boots.
              Canvas upper, rubber sole, iconic star logo. Unisex fit, listed in women's sizing.
price:        74.99
sizes:        [36, 37, 38, 39, 40]
stock:        { 36: 2, 37: 6, 38: 9, 39: 5, 40: 0 }
category:     Women's Footwear / Ankle Boots
tags:         boots, black, converse, classic, canvas, ankle
imageUrl:     https://placehold.co/600x600?text=Converse+Chuck+Boots
```

**Product 5:**
```
name:         Nike Dri-FIT White Basic T-Shirt
slug:         nike-dri-fit-white-basic-tshirt
sku:          TEE-M-001
brand:        Nike
description:  Everyday performance tee with Nike Dri-FIT moisture-wicking technology.
              Lightweight, breathable fabric. Great for gym or casual wear.
price:        34.99
sizes:        [S, M, L, XL, XXL]
stock:        { S: 15, M: 20, L: 18, XL: 10, XXL: 4 }
category:     Men's Clothing / T-Shirts
tags:         t-shirt, white, nike, sport, gym, basic, dri-fit
imageUrl:     https://placehold.co/600x600?text=Nike+Dri-FIT+Tee
```

**Product 6:**
```
name:         H&M Graphic Print Black T-Shirt
slug:         hm-graphic-print-black-tshirt
sku:          TEE-M-002
brand:        H&M
description:  Cotton crew-neck tee with bold graphic front print.
              Relaxed fit, pre-washed for a soft feel right out of the box.
price:        19.99
sizes:        [S, M, L, XL]
stock:        { S: 10, M: 25, L: 20, XL: 8 }
category:     Men's Clothing / T-Shirts
tags:         t-shirt, black, graphic, hm, casual, cotton
imageUrl:     https://placehold.co/600x600?text=HM+Graphic+Tee
```

**Product 7:**
```
name:         Champion Reverse Weave Navy Hoodie
slug:         champion-reverse-weave-navy-hoodie
sku:          HOOD-M-001
brand:        Champion
description:  The original reverse weave construction reduces shrinkage.
              Heavyweight 12 oz cotton fleece, kangaroo pocket, ribbed cuffs.
              A wardrobe staple for any season.
price:        64.99
sizes:        [S, M, L, XL, XXL]
stock:        { S: 6, M: 14, L: 16, XL: 9, XXL: 3 }
category:     Men's Clothing / Hoodies
tags:         hoodie, navy, champion, fleece, casual, streetwear
imageUrl:     https://placehold.co/600x600?text=Champion+Hoodie
```

**Product 8:**
```
name:         Adidas Trefoil Grey Hoodie
slug:         adidas-trefoil-grey-hoodie
sku:          HOOD-M-002
brand:        Adidas
description:  Classic Adidas Originals hoodie with embroidered trefoil logo.
              Regular fit, soft cotton-polyester blend, front pouch pocket.
price:        69.99
sizes:        [S, M, L, XL]
stock:        { S: 0, M: 5, L: 11, XL: 7 }
category:     Men's Clothing / Hoodies
tags:         hoodie, grey, adidas, originals, logo, casual
imageUrl:     https://placehold.co/600x600?text=Adidas+Hoodie
```

**Product 9:**
```
name:         Levi's 501 Original Blue Jeans
slug:         levis-501-original-blue-jeans
sku:          JEAN-M-001
brand:        Levi's
description:  The original straight fit jean since 1873. 100% cotton denim,
              button fly, five-pocket styling. A timeless piece that gets better with wear.
price:        79.99
sizes:        [30x30, 30x32, 32x30, 32x32, 34x32, 36x32]
stock:        { "30x30": 4, "30x32": 7, "32x30": 9, "32x32": 12, "34x32": 6, "36x32": 2 }
category:     Men's Clothing / Jeans
tags:         jeans, blue, levis, denim, straight, classic
imageUrl:     https://placehold.co/600x600?text=Levis+501
```

**Product 10:**
```
name:         Zara Floral Midi Dress
slug:         zara-floral-midi-dress
sku:          DRESS-W-001
brand:        Zara
description:  Lightweight midi dress with an all-over floral print on a white base.
              V-neckline, puff sleeves, elasticated waist. Perfect for spring and summer.
price:        59.99
sizes:        [XS, S, M, L, XL]
stock:        { XS: 3, S: 8, M: 11, L: 6, XL: 2 }
category:     Women's Clothing / Dresses
tags:         dress, floral, zara, midi, summer, white, feminine
imageUrl:     https://placehold.co/600x600?text=Zara+Floral+Dress
```

**Product 11:**
```
name:         Mango Ribbed Beige Knit Top
slug:         mango-ribbed-beige-knit-top
sku:          TOP-W-001
brand:        Mango
description:  Fitted ribbed knit top with a round neckline and short sleeves.
              Versatile wardrobe essential that pairs with jeans, skirts, or trousers.
price:        39.99
sizes:        [XS, S, M, L]
stock:        { XS: 7, S: 12, M: 10, L: 4 }
category:     Women's Clothing / Tops
tags:         top, beige, mango, knit, ribbed, casual, minimal
imageUrl:     https://placehold.co/600x600?text=Mango+Knit+Top
```

**Product 12:**
```
name:         Nike Pro Black Leggings
slug:         nike-pro-black-leggings
sku:          LEG-W-001
brand:        Nike
description:  Nike Pro tight-fit leggings with Dri-FIT technology.
              High-waisted design, 7/8 length, smooth fabric with slight compression.
              Ideal for yoga, training, or everyday wear.
price:        54.99
sizes:        [XS, S, M, L, XL]
stock:        { XS: 5, S: 14, M: 16, L: 9, XL: 3 }
category:     Women's Clothing / Leggings
tags:         leggings, black, nike, sport, gym, yoga, dri-fit, high-waist
imageUrl:     https://placehold.co/600x600?text=Nike+Pro+Leggings
```

**Product 13:**
```
name:         Puma Essential Navy Joggers
slug:         puma-essential-navy-joggers
sku:          JOG-U-001
brand:        Puma
description:  Comfortable everyday joggers with Puma cat logo on left thigh.
              Elastic waistband with drawstring, tapered leg, two side pockets.
              Unisex fit, runs true to size.
price:        44.99
sizes:        [XS, S, M, L, XL, XXL]
stock:        { XS: 4, S: 9, M: 18, L: 15, XL: 7, XXL: 2 }
category:     Unisex Sport / Joggers
tags:         joggers, navy, puma, sport, casual, unisex, comfortable
imageUrl:     https://placehold.co/600x600?text=Puma+Joggers
```

**Product 14:**
```
name:         Adidas Tiro Black Joggers
slug:         adidas-tiro-black-joggers
sku:          JOG-U-002
brand:        Adidas
description:  Technical training joggers inspired by Adidas football kits.
              Slim tapered fit, moisture-wicking fabric, zip pockets, contrast stripes.
price:        54.99
sizes:        [S, M, L, XL, XXL]
stock:        { S: 0, M: 3, L: 8, XL: 10, XXL: 5 }
category:     Unisex Sport / Joggers
tags:         joggers, black, adidas, training, tapered, football, slim
imageUrl:     https://placehold.co/600x600?text=Adidas+Tiro+Joggers
```

**Product 15:**
```
name:         Nike Windrunner Blue Windbreaker
slug:         nike-windrunner-blue-windbreaker
sku:          WIND-U-001
brand:        Nike
description:  Iconic Nike Windrunner jacket with chevron design on chest.
              Lightweight ripstop fabric, packable into front pocket, elastic cuffs.
              Protection from wind and light rain.
price:        99.99
sizes:        [S, M, L, XL, XXL]
stock:        { S: 3, M: 7, L: 9, XL: 6, XXL: 1 }
category:     Unisex Sport / Windbreakers
tags:         windbreaker, blue, nike, jacket, outdoor, packable, light
imageUrl:     https://placehold.co/600x600?text=Nike+Windrunner
```

**Product 16:**
```
name:         H&M Basic White Women's T-Shirt
slug:         hm-basic-white-womens-tshirt
sku:          TEE-W-001
brand:        H&M
description:  Simple relaxed-fit cotton tee for women. Crew neck, short sleeves.
              An everyday essential that works with everything.
price:        14.99
sizes:        [XS, S, M, L, XL]
stock:        { XS: 12, S: 20, M: 18, L: 10, XL: 5 }
category:     Women's Clothing / Tops
tags:         t-shirt, white, hm, basic, casual, cotton, women
imageUrl:     https://placehold.co/600x600?text=HM+Basic+Tee+Women
```

**Product 17:**
```
name:         Zara High-Rise Black Skinny Jeans
slug:         zara-high-rise-black-skinny-jeans
sku:          JEAN-W-001
brand:        Zara
description:  High-rise skinny jeans in black stretch denim. Five-pocket design,
              ankle-length cut. Fits close to the body from hip to ankle.
price:        69.99
sizes:        [34, 36, 38, 40, 42, 44]
stock:        { 34: 4, 36: 9, 38: 13, 40: 8, 42: 3, 44: 0 }
category:     Women's Clothing / Jeans
tags:         jeans, black, zara, skinny, high-rise, stretch, denim
imageUrl:     https://placehold.co/600x600?text=Zara+Skinny+Jeans
```

**Product 18:**
```
name:         Timberland Wheat Classic 6-Inch Boots
slug:         timberland-wheat-classic-6inch-boots
sku:          SHOE-M-003
brand:        Timberland
description:  The iconic waterproof nubuck leather boot with padded collar
              and lug sole. Durable construction for outdoor use and urban style.
price:        189.99
sizes:        [40, 41, 42, 43, 44, 45, 46]
stock:        { 40: 2, 41: 3, 42: 5, 43: 6, 44: 4, 45: 2, 46: 1 }
category:     Men's Footwear / Boots
tags:         boots, wheat, timberland, leather, waterproof, outdoor, classic
imageUrl:     https://placehold.co/600x600?text=Timberland+6+Inch
```

**Product 19:**
```
name:         Champion Pink Crop Hoodie
slug:         champion-pink-crop-hoodie
sku:          HOOD-W-001
brand:        Champion
description:  Cropped version of the classic Champion reverse weave hoodie.
              Ribbed waistband, embroidered script logo, kangaroo pocket.
              Soft fleece interior. A streetwear favourite.
price:        59.99
sizes:        [XS, S, M, L]
stock:        { XS: 5, S: 10, M: 8, L: 3 }
category:     Women's Clothing / Hoodies
tags:         hoodie, pink, champion, crop, streetwear, fleece, women
imageUrl:     https://placehold.co/600x600?text=Champion+Crop+Hoodie
```

**Product 20:**
```
name:         Puma Suede Classic Black Sneakers
slug:         puma-suede-classic-black-sneakers
sku:          SHOE-U-001
brand:        Puma
description:  The Puma Suede has been a streetwear icon since 1968. Suede upper,
              rubber cupsole, formstrip branding on the side. Timeless silhouette
              that goes with everything. Listed in men's sizing.
price:        79.99
sizes:        [38, 39, 40, 41, 42, 43, 44, 45]
stock:        { 38: 3, 39: 5, 40: 8, 41: 10, 42: 9, 43: 6, 44: 3, 45: 1 }
category:     Men's Footwear / Sneakers
tags:         sneakers, black, puma, suede, classic, streetwear, retro
imageUrl:     https://placehold.co/600x600?text=Puma+Suede+Classic
```

---

## POLICIES_AND_FAQ

### Shipping Policy

```
- Standard shipping: 5-7 business days — $4.99
- Express shipping: 2-3 business days — $12.99
- Free standard shipping on orders over $75
- Ships to: USA, Canada, EU countries
- Tracking number provided via email once order is dispatched
- Orders processed within 1 business day
```

### Return Policy

```
- 30-day return window from delivery date
- Items must be unworn, unwashed, with original tags attached
- Footwear must be returned in original box
- Return shipping: customer pays ($5.99 flat) unless item is defective
- Refund processed within 3-5 business days after return received
- Exchange available for different size (free of charge)
- Sale items are final sale — no returns
```

### FAQ

```
Q: How do I know which size to order?
A: Each product page includes a size guide with measurements in inches and cm.
   If you are between sizes, we recommend sizing up.
   For footwear, our sizes follow standard EU sizing.

Q: Can I change or cancel my order after placing it?
A: Orders can be changed or cancelled within 1 hour of placement.
   After that, the order enters processing and cannot be modified.
   Contact support@aishop.com immediately if you need to cancel.

Q: How do I track my order?
A: Once your order ships, you will receive an email with a tracking number
   and a link to track your package in real time.

Q: What payment methods do you accept?
A: We accept Visa, Mastercard, American Express, and PayPal.
   Cash on delivery is available for US domestic orders only.

Q: Is it safe to pay on your website?
A: Yes. All transactions are encrypted with SSL/TLS.
   We do not store your card details on our servers.

Q: What if my item arrives damaged or incorrect?
A: Contact us at support@aishop.com within 48 hours of delivery with a photo.
   We will send a replacement or issue a full refund at no cost to you.

Q: Do you offer gift wrapping?
A: Yes, gift wrapping is available for $3.99 per order.
   Add it at checkout and include a personal message.

Q: How long does it take to process a refund?
A: Once we receive your return, refunds are processed within 3-5 business days.
   It may take an additional 2-3 days for the amount to appear on your statement.

Q: Can I return sale items?
A: Sale items are marked as final sale and cannot be returned or exchanged.
   Please check sizing carefully before purchasing discounted items.

Q: Do you restock sold-out sizes?
A: We restock popular items regularly.
   Use the "Notify me" button on the product page to get an email when your size is back.
```

---

## AI Agent Context

This section is injected into all AI agent system prompts.

```
You are a helpful shopping assistant for AI Fashion Shop (aishop.com).

We sell casual and sport clothing and footwear for men and women.
Brands: Nike, Adidas, Puma, Zara, H&M, New Balance, Converse, Levi's, Champion, Mango, Timberland.
Price range: $14.99 – $189.99.
All prices are in USD.

Store policies (always cite these exactly — do not improvise):
- Free standard shipping on orders over $75. Standard: $4.99 / Express: $12.99.
- Returns accepted within 30 days. Items must have original tags. Sale items are final sale.
- Cash on delivery available for US domestic orders only.
- Order cancellation possible within 1 hour of placement only.
- Refunds processed in 3-5 business days after return received.

Rules you must follow:
- NEVER mention a product that does not exist in the product database.
- NEVER state a price without querying the live product database first.
- NEVER confirm stock availability without calling the check_stock tool.
- If a product is out of stock in a requested size, always suggest the nearest
  available size or offer to notify the customer when it is back.
- If you are unsure about any policy detail, say:
  "Let me check that for you" and query the knowledge base.
```

---

## Embedding Content Template

For each product, embed the following text:

```
{name}. {description}. Brand: {brand}. Category: {category}. Tags: {tags}.
```

Metadata to store alongside each embedding:

```json
{
  "productId": "uuid",
  "sku": "string",
  "brand": "string",
  "price": 0.00,
  "category": "string",
  "subcategory": "string",
  "tags": ["string"],
  "sizes_in_stock": ["string"],
  "has_stock": true,
  "is_active": true
}
```

Metadata filters used at query time:
- `has_stock: true` — for shopping assistant queries (don't recommend out-of-stock items)
- `category` — to scope search to a specific category
- `brand` — to filter by brand when user specifies one
- `is_active: true` — always applied, excludes discontinued items