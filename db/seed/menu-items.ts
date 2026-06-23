import "../../envConfig";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { categories, menuItems } from "@/db/schemas";

const seedCategories = [
  { name: "Burgers", slug: "burgers", image: "/categories/burger.webp", isActive: true },
  { name: "Pizza", slug: "pizza", image: "/categories/pizza.webp", isActive: true },
  { name: "Asian", slug: "asian", image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=200", isActive: true },
  { name: "Healthy", slug: "healthy", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200", isActive: true },
  { name: "Desserts", slug: "desserts", image: "/categories/desserts.jpg", isActive: true },
  { name: "Beverages", slug: "beverages", image: "/categories/drinks.webp", isActive: true },
  { name: "Momos", slug: "momos", image: "/categories/momo.avif", isActive: true },
  { name: "Biryani", slug: "biryani", image: "/categories/biryani.jpg", isActive: true },
];

const seedItems = [
  { title: "Wagyu Gold Burger", slug: "wagyu-gold-burger", categorySlug: "burgers", price: 218.50, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", description: "Double-pressed wagyu patty, truffle aioli, aged cheddar, and house-made pickles.", badge: "Popular", rating: 4.8, reviews: 245 },
  { title: "Classic Cheeseburger", slug: "classic-cheeseburger", categorySlug: "burgers", price: 160.00, image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800", description: "Angus beef patty with cheddar, lettuce, tomato, and secret sauce.", badge: "Best Seller", rating: 4.6, reviews: 312 },
  { title: "Crispy Truffle Fries", slug: "crispy-truffle-fries", categorySlug: "burgers", price: 114.00, image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800", description: "Hand-cut fries tossed in white truffle oil, Grana Padano, and fresh herbs.", badge: "Best Side", rating: 4.5, reviews: 178 },
  { title: "Artisan Pizza", slug: "artisan-pizza", categorySlug: "pizza", price: 614.00, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800", description: "Hand-tossed artisan crust with fresh mozzarella, San Marzano tomatoes, and basil.", badge: "Popular", rating: 4.9, reviews: 512 },
  { title: "Pepperoni Supreme", slug: "pepperoni-supreme", categorySlug: "pizza", price: 520.00, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800", description: "Loaded with pepperoni, Italian sausage, bell peppers, and extra mozzarella.", badge: "Chef's Special", rating: 4.7, reviews: 289 },
  { title: "Margherita Classic", slug: "margherita-classic", categorySlug: "pizza", price: 420.00, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800", description: "San Marzano tomatoes, buffalo mozzarella, basil, and extra virgin olive oil.", badge: "Vegetarian", rating: 4.5, reviews: 198 },
  { title: "Zen Poke Bowl", slug: "zen-poke-bowl", categorySlug: "asian", price: 314.00, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", description: "Fresh sashimi-grade salmon, avocado, edamame, and spicy mayo drizzle.", badge: "Chef's Special", rating: 4.6, reviews: 189 },
  { title: "Thai Red Prawn", slug: "thai-red-prawn", categorySlug: "asian", price: 216.25, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", description: "Jumbo prawns in aromatic coconut red curry served with jasmine rice.", badge: "Spicy", rating: 4.8, reviews: 156 },
  { title: "Chicken Pad Thai", slug: "chicken-pad-thai", categorySlug: "asian", price: 275.00, image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800", description: "Stir-fried rice noodles with chicken, tamarind sauce, peanuts, and lime.", badge: "Popular", rating: 4.4, reviews: 223 },
  { title: "Artisan Roast Salad", slug: "artisan-roast-salad", categorySlug: "healthy", price: 312.95, image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800", description: "Herb-roasted chicken breast, organic greens, feta, and toasted nuts.", badge: "Low Cal", rating: 4.3, reviews: 67 },
  { title: "Quinoa Power Bowl", slug: "quinoa-power-bowl", categorySlug: "healthy", price: 280.00, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", description: "Quinoa, roasted vegetables, chickpeas, avocado, and tahini dressing.", badge: "Healthy", rating: 4.5, reviews: 112 },
  { title: "Molten Lava Core", slug: "molten-lava-core", categorySlug: "desserts", price: 214.00, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800", description: "70% dark cocoa cake with a warm flowing center and vanilla bean gelato.", badge: "New", rating: 4.7, reviews: 93 },
  { title: "Matcha Mille Crepe", slug: "matcha-mille-crepe", categorySlug: "desserts", price: 212.00, image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800", description: "20 layers of handmade crepes with premium matcha cream and red bean.", badge: "Vegetarian", rating: 4.8, reviews: 145 },
  { title: "Mango Sticky Rice", slug: "mango-sticky-rice", categorySlug: "desserts", price: 185.00, image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800", description: "Sweet coconut sticky rice with ripe mango and sesame seeds.", badge: "Seasonal", rating: 4.6, reviews: 78 },
  { title: "Berry Blast Smoothie", slug: "berry-blast-smoothie", categorySlug: "beverages", price: 145.00, image: "https://images.unsplash.com/photo-1553530666-ba11a90da786?w=800", description: "Mixed berries, yogurt, honey, and a hint of mint blended to perfection.", badge: "Refreshing", rating: 4.4, reviews: 201 },
  { title: "Iced Matcha Latte", slug: "iced-matcha-latte", categorySlug: "beverages", price: 168.00, image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800", description: "Premium ceremonial matcha whisked with oat milk over ice.", badge: "Popular", rating: 4.7, reviews: 156 },
];

async function main() {
  const categoryMap: Record<string, number> = {};

  for (const cat of seedCategories) {
    const [existing] = await db.select().from(categories).where(eq(categories.slug, cat.slug));
    if (existing) {
      categoryMap[cat.slug] = existing.id;
      console.log(`Category exists: ${cat.name}`);
    } else {
      const result = await db.insert(categories).values(cat);
      categoryMap[cat.slug] = result[0].insertId;
      console.log(`Created category: ${cat.name}`);
    }
  }

  for (const item of seedItems) {
    const [existing] = await db.select().from(menuItems).where(eq(menuItems.slug, item.slug));
    if (existing) {
      console.log(`Menu item exists: ${item.title}`);
      continue;
    }

    const categoryId = categoryMap[item.categorySlug];
    if (!categoryId) {
      console.error(`Category not found for slug: ${item.categorySlug}`);
      continue;
    }

    await db.insert(menuItems).values({
      categoryId,
      title: item.title,
      slug: item.slug,
      price: String(item.price),
      image: item.image,
      description: item.description,
      badge: item.badge,
      rating: String(item.rating),
      reviews: item.reviews,
      isAvailable: true,
    });
    console.log(`Created menu item: ${item.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
