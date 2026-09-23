import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  role: "customer" | "baker";
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  displayOrder: number;
  createdAt: string;
}

export interface ProductOption {
  id: string;
  productId: string;
  type: "size" | "flavour";
  name: string;
  priceModifier: number; // in cents
  isDefault: boolean;
  isAvailable: boolean;
}

export interface DietaryTag {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number; // in cents
  imageUrl: string;
  minLeadTimeHours: number; // e.g. 48
  isActive: boolean;
  categories: string[]; // category IDs
  dietaryTags: string[]; // dietary tag slugs
  options: ProductOption[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyCapacity {
  id: string;
  bakeryDate: string; // YYYY-MM-DD
  maxCakes: number;
  reservedCakes: number;
  isClosed: boolean;
  notes?: string;
}

export interface PickupSlot {
  id: string;
  startTime: string; // HH:MM:SS
  endTime: string;
  label: string;
  maxOrdersPerSlot: number;
  isActive: boolean;
}

export interface OrderCustomisation {
  id: string;
  orderItemId: string;
  sizeOptionId?: string;
  sizeName?: string;
  flavourOptionId?: string;
  flavourName?: string;
  customMessage?: string; // Max 40 chars
  messageFee: number; // in cents
  referenceImageUrl?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number; // in cents
  subtotal: number;
  customisation?: OrderCustomisation;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "BAKING"
  | "READY"
  | "COLLECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  pickupDate: string; // YYYY-MM-DD
  pickupSlotId: string;
  pickupSlotLabel?: string;
  status: OrderStatus;
  totalAmount: number; // in cents
  messageFee: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupCode: string;
  holdExpiresAt?: string; // UTC ISO timestamp
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  idempotencyKey: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy?: string;
  details?: any;
  timestamp: string;
}

// In-Memory Thread-Safe Data Store with Mutex Lock for Concurrency Tests & Offline Dev
class DataStore {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private dietaryTags: Map<string, DietaryTag> = new Map();
  private dailyCapacity: Map<string, DailyCapacity> = new Map(); // Keyed by YYYY-MM-DD
  private pickupSlots: Map<string, PickupSlot> = new Map();
  private orders: Map<string, Order> = new Map();
  private payments: Map<string, Payment> = new Map(); // Keyed by idempotencyKey or id
  private auditLogs: AuditLog[] = [];

  // Mutex lock for simulating database transaction row locking (FOR UPDATE)
  private lockPromise: Promise<void> = Promise.resolve();

  private persistPath = path.join(process.cwd(), ".cakecart_store.json");

  // Save state to disk for cross-worker / hot-reload persistence
  public saveToDisk() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        dailyCapacity: Array.from(this.dailyCapacity.entries()),
        orders: Array.from(this.orders.entries()),
        payments: Array.from(this.payments.entries()),
        auditLogs: this.auditLogs,
      };
      fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2), "utf8");
    } catch {
      // ignore
    }
  }

  // Load state from disk
  public loadFromDisk() {
    try {
      if (fs.existsSync(this.persistPath)) {
        const raw = fs.readFileSync(this.persistPath, "utf8");
        const data = JSON.parse(raw);
        if (data.users?.length) {
          for (const [k, v] of data.users) this.users.set(k, v);
        }
        if (data.dailyCapacity?.length) {
          for (const [k, v] of data.dailyCapacity) this.dailyCapacity.set(k, v);
        }
        if (data.orders?.length) {
          for (const [k, v] of data.orders) this.orders.set(k, v);
        }
        if (data.payments?.length) {
          for (const [k, v] of data.payments) this.payments.set(k, v);
        }
        if (data.auditLogs?.length) {
          this.auditLogs = data.auditLogs;
        }
      }
    } catch {
      // ignore
    }
  }

  constructor() {
    this.seedInitialData();
    this.loadFromDisk();
  }

  // Acquire transaction lock
  private async acquireLock(): Promise<() => void> {
    let release: () => void = () => {};
    const currentLock = this.lockPromise;
    this.lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    await currentLock;
    return release;
  }

  public seedInitialData() {
    // 1. Dietary Tags
    const tags: DietaryTag[] = [
      { id: "dt-1", name: "Eggless", slug: "eggless", icon: "EggOff" },
      { id: "dt-2", name: "Gluten-Free", slug: "gluten-free", icon: "WheatOff" },
      { id: "dt-3", name: "Nut-Free", slug: "nut-free", icon: "ShieldCheck" },
      { id: "dt-4", name: "Vegan", slug: "vegan", icon: "Leaf" },
    ];
    tags.forEach((t) => this.dietaryTags.set(t.id, t));

    // 2. Categories
    const cats: Category[] = [
      {
        id: "cat-5",
        name: "Party Combos & Sets",
        slug: "party-combos",
        description: "All-in-one celebration bundles with cake, muffins, candles & balloon bouquets at exclusive combo bundle savings.",
        imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80",
        displayOrder: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cat-1",
        name: "Signature Celebration",
        slug: "signature-celebration",
        description: "Multi-layered statement cakes handcrafted for birthdays, anniversaries, and milestones.",
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        displayOrder: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cat-2",
        name: "Bento Mini Cakes",
        slug: "bento-mini-cakes",
        description: "Charming Korean-style 6-inch mini celebration cakes for intimate gatherings.",
        imageUrl: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80",
        displayOrder: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cat-3",
        name: "Dietary Specials",
        slug: "dietary-specials",
        description: "Strictly eggless, gluten-free, and vegan artisan bakes made without compromise.",
        imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80",
        displayOrder: 4,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cat-4",
        name: "Cupcake Gift Boxes",
        slug: "cupcake-gift-boxes",
        description: "Sets of 6 artisan cupcakes topped with hand-piped floral buttercream.",
        imageUrl: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80",
        displayOrder: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cat-6",
        name: "Fresh Artisan Muffins",
        slug: "muffins",
        description: "Freshly baked morning and party muffins with crunchy streusel crowns and rich melted fillings.",
        imageUrl: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80",
        displayOrder: 6,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cat-7",
        name: "Candles & Balloons",
        slug: "candles-balloons",
        description: "Luxury champagne-gold celebration candles, sparklers, and floating helium balloon bouquets.",
        imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
        displayOrder: 7,
        createdAt: new Date().toISOString(),
      },
    ];
    cats.forEach((c) => this.categories.set(c.id, c));

    // 3. Products
    const prods: Product[] = [
      {
        id: "prod-1",
        name: "Velvet Raspberry Celebration Cake",
        slug: "velvet-raspberry-celebration-cake",
        description:
          "Layers of moist Madagascar vanilla sponge infused with organic raspberry coulis, finished with silky white chocolate buttercream and fresh gold-dusted raspberries.",
        basePrice: 4800, // $48.00
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-1"],
        dietaryTags: ["nut-free"],
        options: [
          { id: "opt-1-s1", productId: "prod-1", type: "size", name: "6\" Petite (Serves 4-6)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-1-s2", productId: "prod-1", type: "size", name: "8\" Classic (Serves 8-12)", priceModifier: 1600, isDefault: false, isAvailable: true },
          { id: "opt-1-s3", productId: "prod-1", type: "size", name: "10\" Grand (Serves 16-24)", priceModifier: 3600, isDefault: false, isAvailable: true },
          { id: "opt-1-f1", productId: "prod-1", type: "flavour", name: "Madagascar Vanilla Raspberry", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-1-f2", productId: "prod-1", type: "flavour", name: "White Chocolate Rose Infusion", priceModifier: 300, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-2",
        name: "Dark Chocolate Espresso Truffle Cake",
        slug: "dark-chocolate-espresso-truffle-cake",
        description:
          "Rich 70% Belgian dark chocolate fudge sponge soaked in single-origin espresso syrup, layered with dark ganache and cocoa nib tuile.",
        basePrice: 5200, // $52.00
        imageUrl: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-1"],
        dietaryTags: ["nut-free"],
        options: [
          { id: "opt-2-s1", productId: "prod-2", type: "size", name: "6\" Petite (Serves 4-6)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-2-s2", productId: "prod-2", type: "size", name: "8\" Classic (Serves 8-12)", priceModifier: 1800, isDefault: false, isAvailable: true },
          { id: "opt-2-s3", productId: "prod-2", type: "size", name: "10\" Grand (Serves 16-24)", priceModifier: 3800, isDefault: false, isAvailable: true },
          { id: "opt-2-f1", productId: "prod-2", type: "flavour", name: "70% Belgian Dark Truffle", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-2-f2", productId: "prod-2", type: "flavour", name: "Salted Caramel Espresso Crunch", priceModifier: 350, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-3",
        name: "Lemon Lavender Chiffon Cloud Cake",
        slug: "lemon-lavender-chiffon-cloud-cake",
        description:
          "Feather-light Meyer lemon chiffon cake scented with culinary French lavender, filled with handmade lemon curd and whipped mascarpone frosting.",
        basePrice: 4600, // $46.00
        imageUrl: "https://images.unsplash.com/photo-1519340333755-56e9c1d04579?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-1"],
        dietaryTags: ["nut-free"],
        options: [
          { id: "opt-3-s1", productId: "prod-3", type: "size", name: "6\" Petite (Serves 4-6)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-3-s2", productId: "prod-3", type: "size", name: "8\" Classic (Serves 8-12)", priceModifier: 1500, isDefault: false, isAvailable: true },
          { id: "opt-3-s3", productId: "prod-3", type: "size", name: "10\" Grand (Serves 16-24)", priceModifier: 3400, isDefault: false, isAvailable: true },
          { id: "opt-3-f1", productId: "prod-3", type: "flavour", name: "Zesty Lemon Lavender", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-3-f2", productId: "prod-3", type: "flavour", name: "Lemon Poppyseed Cream", priceModifier: 200, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-4",
        name: "Salted Caramel Biscoff Bento Cake",
        slug: "salted-caramel-biscoff-bento",
        description:
          "Adorable Korean-style 6-inch bento cake packed with caramelized Biscoff cookie crunch, brown butter sponge, and Maldon sea salt caramel drizzle.",
        basePrice: 3400, // $34.00
        imageUrl: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-2"],
        dietaryTags: ["eggless"],
        options: [
          { id: "opt-4-s1", productId: "prod-4", type: "size", name: "6\" Bento (Serves 2-4)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-4-f1", productId: "prod-4", type: "flavour", name: "Caramel Biscoff Buttercream", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-4-f2", productId: "prod-4", type: "flavour", name: "Vanilla Bean Salted Caramel", priceModifier: 250, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-5",
        name: "Eggless Pistachio Cardamom Rose Cake",
        slug: "eggless-pistachio-rose-cake",
        description:
          "Aromatic Turkish pistachio sponge with cardamom-infused saffron milk syrup, filled with rose water cream. 100% strictly eggless recipe.",
        basePrice: 5400, // $54.00
        imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-3"],
        dietaryTags: ["eggless"],
        options: [
          { id: "opt-5-s1", productId: "prod-5", type: "size", name: "6\" Petite (Serves 4-6)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-5-s2", productId: "prod-5", type: "size", name: "8\" Classic (Serves 8-12)", priceModifier: 1800, isDefault: false, isAvailable: true },
          { id: "opt-5-f1", productId: "prod-5", type: "flavour", name: "Pistachio Rose Cardamom", priceModifier: 0, isDefault: true, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-6",
        name: "Gluten-Free Flourless Chocolate Velvet Torte",
        slug: "gluten-free-flourless-chocolate-torte",
        description:
          "Ultra-decadent flourless dark chocolate torte baked to fudge perfection, topped with fresh blackberries and dusted with organic cocoa powder.",
        basePrice: 5000, // $50.00
        imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-3"],
        dietaryTags: ["gluten-free", "nut-free"],
        options: [
          { id: "opt-6-s1", productId: "prod-6", type: "size", name: "8\" Classic Torte (Serves 8-10)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-6-f1", productId: "prod-6", type: "flavour", name: "Decadent Pure Dark Chocolate", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-6-f2", productId: "prod-6", type: "flavour", name: "Dark Chocolate Orange Cointreau", priceModifier: 300, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-7",
        name: "Vegan Wild Berry Cheesecake Bento",
        slug: "vegan-wild-berry-cheesecake-bento",
        description:
          "Artisan dairy-free cashew-coconut cream cheesecake with gluten-free oat crust, topped with wild forest berry compote and edible violas.",
        basePrice: 3600, // $36.00
        imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-2", "cat-3"],
        dietaryTags: ["vegan", "eggless", "gluten-free"],
        options: [
          { id: "opt-7-s1", productId: "prod-7", type: "size", name: "6\" Bento (Serves 2-4)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-7-f1", productId: "prod-7", type: "flavour", name: "Wild Forest Berry Swirl", priceModifier: 0, isDefault: true, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-8",
        name: "Artisan Floral Cupcake Box (Set of 6)",
        slug: "artisan-floral-cupcake-box",
        description:
          "Six hand-piped buttercream flower cupcakes featuring signature Madagascar vanilla, dark chocolate ganache, and salted caramel centers.",
        basePrice: 2800, // $28.00
        imageUrl: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-4"],
        dietaryTags: ["nut-free"],
        options: [
          { id: "opt-8-s1", productId: "prod-8", type: "size", name: "Box of 6 Cupcakes", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-8-s2", productId: "prod-8", type: "size", name: "Box of 12 Cupcakes", priceModifier: 2400, isDefault: false, isAvailable: true },
          { id: "opt-8-f1", productId: "prod-8", type: "flavour", name: "Floral Vanilla & Chocolate Assortment", priceModifier: 0, isDefault: true, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-combo-1",
        name: "Ultimate Celebration Party Combo (Cake + Muffins + Balloons + Candles)",
        slug: "ultimate-celebration-party-combo",
        description:
          "🔥 SPECIAL COMBO OFFER (SAVE 25%): The complete party package! Includes 1x 8\" Signature Celebration Cake (choice of flavour), 1x Box of 6 Fresh Artisan Streusel Muffins, 1x Pastel Helium Confetti Balloon Bouquet (set of 5), and 1x 24k Gold Celebration Candles set with tabletop sparklers. Value $105+.",
        basePrice: 7900, // $79.00
        imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-5", "cat-1"],
        dietaryTags: ["nut-free"],
        options: [
          { id: "opt-c1-s1", productId: "prod-combo-1", type: "size", name: "Party Pack (8\" Cake + 6 Muffins + Balloons + Candles)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-c1-s2", productId: "prod-combo-1", type: "size", name: "Grand Party Pack (10\" Cake + 12 Muffins + 10 Balloons + Candles)", priceModifier: 3200, isDefault: false, isAvailable: true },
          { id: "opt-c1-f1", productId: "prod-combo-1", type: "flavour", name: "Velvet Vanilla Cake & Assorted Berry Muffins", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-c1-f2", productId: "prod-combo-1", type: "flavour", name: "Belgian Chocolate Truffle Cake & Choc Muffins", priceModifier: 400, isDefault: false, isAvailable: true },
          { id: "opt-c1-f3", productId: "prod-combo-1", type: "flavour", name: "Salted Caramel Cake & Spiced Streusel Muffins", priceModifier: 400, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-combo-2",
        name: "Sweet Morning Celebration Combo (Muffins + Candles)",
        slug: "sweet-morning-celebration-combo",
        description:
          "🔥 COMBO SPECIAL: Perfect surprise for morning celebrations or desk celebrations! 1x Box of 6 freshly baked artisan muffins paired with a set of 12 glowing 24k gold celebration candles. Save over $5 compared to buying separately.",
        basePrice: 2600, // $26.00 (val $31)
        imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-5", "cat-6", "cat-7"],
        dietaryTags: ["nut-free", "eggless"],
        options: [
          { id: "opt-c2-s1", productId: "prod-combo-2", type: "size", name: "6 Artisan Muffins + 12 Gold Candles", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-c2-s2", productId: "prod-combo-2", type: "size", name: "12 Artisan Muffins + 24 Gold Candles", priceModifier: 1800, isDefault: false, isAvailable: true },
          { id: "opt-c2-f1", productId: "prod-combo-2", type: "flavour", name: "Assorted Wild Blueberry & Double Chocolate", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-c2-f2", productId: "prod-combo-2", type: "flavour", name: "Pure Mountain Blueberry Streusel", priceModifier: 0, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-muffins-1",
        name: "Artisan Bakery Muffin Box (Fresh Batch of 6)",
        slug: "artisan-bakery-muffin-box",
        description:
          "Oven-fresh artisan bakery muffins with golden crunchy oat-streusel crowns, organic mountain blueberries, and melting Belgian chocolate chunks. Handcrafted every morning.",
        basePrice: 2200, // $22.00
        imageUrl: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-6"],
        dietaryTags: ["nut-free", "eggless"],
        options: [
          { id: "opt-m1-s1", productId: "prod-muffins-1", type: "size", name: "Box of 6 Fresh Muffins", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-m1-s2", productId: "prod-muffins-1", type: "size", name: "Party Box of 12 Fresh Muffins", priceModifier: 1800, isDefault: false, isAvailable: true },
          { id: "opt-m1-f1", productId: "prod-muffins-1", type: "flavour", name: "Mixed Assortment (3 Blueberry, 3 Double Chocolate)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-m1-f2", productId: "prod-muffins-1", type: "flavour", name: "100% Wild Mountain Blueberry Streusel", priceModifier: 0, isDefault: false, isAvailable: true },
          { id: "opt-m1-f3", productId: "prod-muffins-1", type: "flavour", name: "Double Belgian Chocolate Chunk", priceModifier: 200, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-candles-1",
        name: "24k Gold Celebration Candles & Sparklers Set",
        slug: "gold-celebration-candles-sparklers",
        description:
          "Set of 12 slim metallic champagne-gold tapered celebration candles with clear food-safe holders plus 2 gold tabletop sparklers for a stunning cake ceremony.",
        basePrice: 900, // $9.00
        imageUrl: "https://images.unsplash.com/photo-1514517521153-1be72277b32f?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-7"],
        dietaryTags: [],
        options: [
          { id: "opt-can-s1", productId: "prod-candles-1", type: "size", name: "Standard Pack (12 Candles + 2 Sparklers)", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-can-s2", productId: "prod-candles-1", type: "size", name: "Deluxe Party Pack (24 Candles + 4 Sparklers)", priceModifier: 600, isDefault: false, isAvailable: true },
          { id: "opt-can-f1", productId: "prod-candles-1", type: "flavour", name: "Champagne 24k Gold Metallic", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-can-f2", productId: "prod-candles-1", type: "flavour", name: "Rose Gold Shimmer", priceModifier: 0, isDefault: false, isAvailable: true },
          { id: "opt-can-f3", productId: "prod-candles-1", type: "flavour", name: "Pastel Rainbow Ombre", priceModifier: 0, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-balloons-1",
        name: "Pastel Helium Confetti Balloon Bouquet (Set of 5)",
        slug: "pastel-helium-confetti-balloon-bouquet",
        description:
          "Handcrafted party balloon bouquet of 5 helium-filled balloons: 2 crystal-clear confetti balloons, 2 pearl latex balloons, and 1 metallic foil heart balloon with satin ribbon and weights.",
        basePrice: 1600, // $16.00
        imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
        minLeadTimeHours: 48,
        isActive: true,
        categories: ["cat-7"],
        dietaryTags: [],
        options: [
          { id: "opt-bal-s1", productId: "prod-balloons-1", type: "size", name: "Bouquet of 5 Balloons", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-bal-s2", productId: "prod-balloons-1", type: "size", name: "Deluxe Cluster of 10 Balloons", priceModifier: 1400, isDefault: false, isAvailable: true },
          { id: "opt-bal-f1", productId: "prod-balloons-1", type: "flavour", name: "Pastel Macaron & Rose Gold", priceModifier: 0, isDefault: true, isAvailable: true },
          { id: "opt-bal-f2", productId: "prod-balloons-1", type: "flavour", name: "Midnight Navy & Metallic Silver", priceModifier: 0, isDefault: false, isAvailable: true },
          { id: "opt-bal-f3", productId: "prod-balloons-1", type: "flavour", name: "Sage Eucalyptus & Pearl White", priceModifier: 0, isDefault: false, isAvailable: true },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    prods.forEach((p) => this.products.set(p.id, p));

    // 4. Pickup Slots
    const slots: PickupSlot[] = [
      {
        id: "slot-1",
        startTime: "10:00:00",
        endTime: "12:00:00",
        label: "10:00 AM - 12:00 PM (Morning Window)",
        maxOrdersPerSlot: 4,
        isActive: true,
      },
      {
        id: "slot-2",
        startTime: "13:00:00",
        endTime: "15:00:00",
        label: "01:00 PM - 03:00 PM (Afternoon Window)",
        maxOrdersPerSlot: 4,
        isActive: true,
      },
      {
        id: "slot-3",
        startTime: "16:00:00",
        endTime: "18:00:00",
        label: "04:00 PM - 06:00 PM (Evening Collection)",
        maxOrdersPerSlot: 4,
        isActive: true,
      },
    ];
    slots.forEach((s) => this.pickupSlots.set(s.id, s));

    // 5. Daily Capacity for the next 14 days
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      this.dailyCapacity.set(dateStr, {
        id: `cap-${dateStr}`,
        bakeryDate: dateStr,
        maxCakes: 12,
        reservedCakes: 0,
        isClosed: false,
        notes: undefined,
      });
    }

    // 6. Pre-seeded Users (Baker and Customer)
    // bcrypt hash of "BakerSecret123!" -> $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (or generated with bcrypt)
    // bcrypt hash of "Customer123!"
    this.users.set("user-baker", {
      id: "user-baker",
      email: "baker@cakecart.com",
      passwordHash: "$2b$10$fV27vL7rI9qC6K9N4xX8bOnbUvL/2bOsuBhyqE82c8112hEshvDve", // BakerSecret123!
      fullName: "Chef Sophie Laurent",
      phone: "+1 (555) 234-5678",
      role: "baker",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.users.set("user-customer", {
      id: "user-customer",
      email: "customer@example.com",
      passwordHash: "$2b$10$eE0m1WkJ.P0F5V0Qo0142.q4J9O4j8rG1oO0m1WkJ.P0F5V0Qo014", // Customer123!
      fullName: "Emma Watson",
      phone: "+1 (555) 987-6543",
      role: "customer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // --- Products & Categories Query Methods ---
  public getProducts(filters?: {
    categorySlug?: string;
    dietaryTag?: string;
    flavour?: string;
    size?: string;
    search?: string;
    maxPrice?: number;
  }): Product[] {
    let list = Array.from(this.products.values()).filter((p) => p.isActive);

    if (filters?.categorySlug) {
      const cat = Array.from(this.categories.values()).find((c) => c.slug === filters.categorySlug);
      if (cat) {
        list = list.filter((p) => p.categories.includes(cat.id));
      }
    }

    if (filters?.dietaryTag) {
      list = list.filter((p) => p.dietaryTags.includes(filters.dietaryTag!));
    }

    if (filters?.flavour) {
      list = list.filter((p) =>
        p.options.some((o) => o.type === "flavour" && o.name.toLowerCase().includes(filters.flavour!.toLowerCase()))
      );
    }

    if (filters?.size) {
      list = list.filter((p) =>
        p.options.some((o) => o.type === "size" && o.name.toLowerCase().includes(filters.size!.toLowerCase()))
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (filters?.maxPrice) {
      list = list.filter((p) => p.basePrice <= filters.maxPrice!);
    }

    return list;
  }

  public getProductBySlug(slug: string): Product | undefined {
    return Array.from(this.products.values()).find((p) => p.slug === slug && p.isActive);
  }

  public getCategories(): Category[] {
    return Array.from(this.categories.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getDietaryTags(): DietaryTag[] {
    return Array.from(this.dietaryTags.values());
  }

  public getPickupSlots(): PickupSlot[] {
    return Array.from(this.pickupSlots.values()).filter((s) => s.isActive);
  }

  // --- Capacity Methods ---
  public getCapacityForDate(dateStr: string): DailyCapacity {
    const existing = this.dailyCapacity.get(dateStr);
    if (existing) return { ...existing };
    // Default capacity if not pre-seeded
    const defaultCap: DailyCapacity = {
      id: `cap-${dateStr}`,
      bakeryDate: dateStr,
      maxCakes: 12,
      reservedCakes: 0,
      isClosed: false,
    };
    this.dailyCapacity.set(dateStr, defaultCap);
    return { ...defaultCap };
  }

  // Calculate oven baking capacity slots required for items
  // Cakes, cupcakes, combos, and muffins consume baking slots; accessory items (candles/balloons) do not
  public calculateBakingSlots(items: { productId: string; quantity: number }[]): number {
    return items.reduce((sum, item) => {
      const p = this.products.get(item.productId);
      if (p && p.categories.includes("cat-7") && !p.categories.includes("cat-5") && !p.categories.includes("cat-1")) {
        return sum; // Candle or Balloon party accessory
      }
      return sum + item.quantity;
    }, 0);
  }

  public getCapacityRange(startDate: string, daysCount: number = 14): (DailyCapacity & { remainingCakes: number })[] {
    const res: (DailyCapacity & { remainingCakes: number })[] = [];
    const base = new Date(startDate);
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      const cap = this.getCapacityForDate(ds);
      res.push({
        ...cap,
        remainingCakes: Math.max(0, cap.maxCakes - cap.reservedCakes),
      });
    }
    return res;
  }

  public setCapacity(dateStr: string, maxCakes: number, isClosed: boolean, notes?: string): DailyCapacity {
    const cap = this.getCapacityForDate(dateStr);
    if (maxCakes < cap.reservedCakes) {
      throw new Error(`Max cakes cannot be set lower than already reserved cakes (${cap.reservedCakes})`);
    }
    cap.maxCakes = maxCakes;
    cap.isClosed = isClosed;
    if (notes !== undefined) cap.notes = notes;
    this.dailyCapacity.set(dateStr, cap);
    return { ...cap };
  }

  // --- Users & Auth ---
  public getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    if (this.getUserByEmail(user.email)) {
      throw new Error("Email already registered");
    }
    const id = `user-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      ...user,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  // --- Order Reservation Transaction Engine (ACID / Thread-Safe) ---
  public async reserveOrder(params: {
    pickupDate: string; // YYYY-MM-DD
    pickupSlotId: string;
    items: {
      productId: string;
      quantity: number;
      sizeOptionId?: string;
      flavourOptionId?: string;
      customMessage?: string;
      referenceImageUrl?: string;
    }[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes?: string;
    userId?: string;
  }): Promise<{ order: Order; holdExpiresAt: string }> {
    const releaseLock = await this.acquireLock();
    try {
      const now = new Date();

      // Rule: Minimum Lead Time Check (48 hours)
      // Pick up date at start of day vs now
      const pickupDateTime = new Date(`${params.pickupDate}T10:00:00Z`);
      const leadTimeHours = (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (leadTimeHours < 48) {
        throw new Error("Minimum lead time is 48 hours. Please choose a later pickup date.");
      }

      // Check slot exists
      const slot = this.pickupSlots.get(params.pickupSlotId);
      if (!slot || !slot.isActive) {
        throw new Error("Selected pickup slot is invalid or inactive.");
      }

      // Lock & Check Daily Capacity
      const cap = this.getCapacityForDate(params.pickupDate);
      if (cap.isClosed) {
        throw new Error("The bakery is closed on the selected pickup date.");
      }

      // Calculate total item units and baking slots requested
      const totalItemCount = params.items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalItemCount <= 0) {
        throw new Error("Order must contain at least 1 item.");
      }

      const bakingSlots = this.calculateBakingSlots(params.items);
      const remainingCapacity = cap.maxCakes - cap.reservedCakes;
      if (bakingSlots > 0 && remainingCapacity < bakingSlots) {
        throw new Error(
          `Insufficient capacity for ${params.pickupDate}. Remaining: ${remainingCapacity} cake slot(s), requested: ${bakingSlots}.`
        );
      }

      // Check slot capacity (count active and non-cancelled/non-expired orders for that date & slot)
      const slotOrdersCount = Array.from(this.orders.values()).filter(
        (o) =>
          o.pickupDate === params.pickupDate &&
          o.pickupSlotId === params.pickupSlotId &&
          !["CANCELLED", "EXPIRED", "REFUNDED"].includes(o.status)
      ).length;

      if (slotOrdersCount >= slot.maxOrdersPerSlot) {
        throw new Error(`The pickup slot "${slot.label}" is fully booked for ${params.pickupDate}. Please choose another slot.`);
      }

      // Calculate Server-Side Pricing (Tamper-Resistant)
      let calculatedTotal = 0;
      let totalMessageFee = 0;
      const orderItems: OrderItem[] = [];
      const orderId = `ord-${crypto.randomUUID()}`;

      for (const item of params.items) {
        const prod = this.products.get(item.productId);
        if (!prod || !prod.isActive) {
          throw new Error(`Product not found or inactive: ${item.productId}`);
        }

        let unitPrice = prod.basePrice;

        // Size option fee
        let sizeName: string | undefined;
        if (item.sizeOptionId) {
          const opt = prod.options.find((o) => o.id === item.sizeOptionId && o.type === "size");
          if (!opt) throw new Error("Invalid size option selected");
          unitPrice += opt.priceModifier;
          sizeName = opt.name;
        }

        // Flavour option fee
        let flavourName: string | undefined;
        if (item.flavourOptionId) {
          const opt = prod.options.find((o) => o.id === item.flavourOptionId && o.type === "flavour");
          if (!opt) throw new Error("Invalid flavour option selected");
          unitPrice += opt.priceModifier;
          flavourName = opt.name;
        }

        // Custom Message: 40 character limit & $3.00 (300 cents) fee
        let messageFee = 0;
        let sanitizedMessage = item.customMessage?.trim() || undefined;
        if (sanitizedMessage) {
          if (sanitizedMessage.length > 40) {
            throw new Error(`Custom cake message exceeds 40 characters limit (Current: ${sanitizedMessage.length} characters)`);
          }
          messageFee = 300; // $3.00
          totalMessageFee += messageFee * item.quantity;
        }

        const lineSubtotal = (unitPrice + messageFee) * item.quantity;
        calculatedTotal += lineSubtotal;

        const orderItemId = `item-${crypto.randomUUID()}`;
        const orderItem: OrderItem = {
          id: orderItemId,
          orderId,
          productId: prod.id,
          productName: prod.name,
          productImage: prod.imageUrl,
          quantity: item.quantity,
          unitPrice,
          subtotal: lineSubtotal,
          customisation: {
            id: `cust-${crypto.randomUUID()}`,
            orderItemId,
            sizeOptionId: item.sizeOptionId,
            sizeName,
            flavourOptionId: item.flavourOptionId,
            flavourName,
            customMessage: sanitizedMessage,
            messageFee,
            referenceImageUrl: item.referenceImageUrl,
          },
        };

        orderItems.push(orderItem);
      }

      // Step 4: Increment reserved_cakes and apply 10-minute expiration hold
      cap.reservedCakes += bakingSlots;
      this.dailyCapacity.set(params.pickupDate, cap);

      const holdExpiresAtDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future
      const holdExpiresAt = holdExpiresAtDate.toISOString();

      const orderNumber = `CC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const pickupCode = `PICKUP-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        userId: params.userId,
        pickupDate: params.pickupDate,
        pickupSlotId: params.pickupSlotId,
        pickupSlotLabel: slot.label,
        status: "PENDING",
        totalAmount: calculatedTotal,
        messageFee: totalMessageFee,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail,
        pickupCode,
        holdExpiresAt,
        notes: params.notes,
        items: orderItems,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      this.orders.set(orderId, newOrder);

      // Audit Log
      this.auditLogs.push({
        id: `aud-${crypto.randomUUID()}`,
        entityType: "order",
        entityId: orderId,
        action: "HOLD_CREATED",
        performedBy: params.userId,
        details: {
          reservedCakes: bakingSlots,
          pickupDate: params.pickupDate,
          holdExpiresAt,
        },
        timestamp: now.toISOString(),
      });

      this.saveToDisk();

      return { order: newOrder, holdExpiresAt };
    } finally {
      releaseLock();
    }
  }

  // --- Confirm Order After Verified Payment (with Idempotency) ---
  public async confirmOrder(params: {
    orderId: string;
    idempotencyKey: string;
    provider: string; // e.g. 'stripe_test' | 'test_gateway'
    transactionId?: string;
  }): Promise<{ order: Order; payment: Payment }> {
    const releaseLock = await this.acquireLock();
    try {
      this.loadFromDisk();

      // Step 9: Check payment idempotency key
      const existingPayment = Array.from(this.payments.values()).find((p) => p.idempotencyKey === params.idempotencyKey);
      if (existingPayment) {
        const existingOrder = this.orders.get(existingPayment.orderId);
        if (existingOrder) {
          return { order: existingOrder, payment: existingPayment };
        }
      }

      const order = this.orders.get(params.orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "CONFIRMED") {
        const payment = Array.from(this.payments.values()).find((p) => p.orderId === order.id);
        return { order, payment: payment! };
      }

      if (order.status === "EXPIRED" || order.status === "CANCELLED") {
        throw new Error(`Cannot confirm an order that is ${order.status}. Please place a new order.`);
      }

      // Check if hold has expired
      if (order.holdExpiresAt && new Date(order.holdExpiresAt).getTime() < Date.now()) {
        order.status = "EXPIRED";
        const cap = this.getCapacityForDate(order.pickupDate);
        const cakeCount = this.calculateBakingSlots(order.items);
        cap.reservedCakes = Math.max(0, cap.reservedCakes - cakeCount);
        this.dailyCapacity.set(order.pickupDate, cap);
        throw new Error("Reservation hold expired. Capacity has been released. Please re-order.");
      }

      // Create Payment Record
      const paymentId = `pay-${crypto.randomUUID()}`;
      const payment: Payment = {
        id: paymentId,
        orderId: order.id,
        provider: params.provider,
        idempotencyKey: params.idempotencyKey,
        transactionId: params.transactionId || `tx-${crypto.randomBytes(8).toString("hex")}`,
        amount: order.totalAmount,
        currency: "USD",
        status: "SUCCEEDED",
        metadata: { confirmedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.payments.set(paymentId, payment);

      // Confirm order
      order.status = "CONFIRMED";
      order.holdExpiresAt = undefined;
      order.updatedAt = new Date().toISOString();
      this.orders.set(order.id, order);

      // Audit Log
      this.auditLogs.push({
        id: `aud-${crypto.randomUUID()}`,
        entityType: "order",
        entityId: order.id,
        action: "CONFIRMED",
        details: { paymentId, amount: payment.amount, provider: params.provider },
        timestamp: new Date().toISOString(),
      });

      this.saveToDisk();

      return { order, payment };
    } finally {
      releaseLock();
    }
  }

  // --- Release Expired Holds (Cron Endpoint Engine) ---
  public async releaseExpiredHolds(): Promise<{ expiredCount: number; ordersReleased: string[] }> {
    const releaseLock = await this.acquireLock();
    try {
      const now = Date.now();
      const releasedOrders: string[] = [];
      let count = 0;

      for (const order of this.orders.values()) {
        if (order.status === "PENDING" && order.holdExpiresAt) {
          const expiryTime = new Date(order.holdExpiresAt).getTime();
          if (expiryTime <= now) {
            order.status = "EXPIRED";
            order.updatedAt = new Date().toISOString();

            // Decrement capacity
            const cap = this.getCapacityForDate(order.pickupDate);
            const cakeCount = this.calculateBakingSlots(order.items);
            cap.reservedCakes = Math.max(0, cap.reservedCakes - cakeCount);
            this.dailyCapacity.set(order.pickupDate, cap);

            releasedOrders.push(order.orderNumber);
            count++;

            this.auditLogs.push({
              id: `aud-${crypto.randomUUID()}`,
              entityType: "order",
              entityId: order.id,
              action: "HOLD_EXPIRED",
              details: { cakesReturned: cakeCount, pickupDate: order.pickupDate },
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      return { expiredCount: count, ordersReleased: releasedOrders };
    } finally {
      releaseLock();
    }
  }

  // --- Cancel Order (Customer Flow with 24-hour Cutoff Rule) ---
  public async cancelOrder(orderId: string, requestingUserId?: string): Promise<Order> {
    const releaseLock = await this.acquireLock();
    try {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Security isolation check: only the order owner or a baker can cancel
      if (requestingUserId && order.userId && order.userId !== requestingUserId) {
        const user = this.users.get(requestingUserId);
        if (user?.role !== "baker") {
          throw new Error("Unauthorized to cancel this order.");
        }
      }

      if (["CANCELLED", "COLLECTED", "REFUNDED"].includes(order.status)) {
        throw new Error(`Order is already ${order.status}.`);
      }

      // 24-Hour Cutoff Enforcement:
      // Minimum 24 hours before scheduled pickup date/time
      const pickupDateTime = new Date(`${order.pickupDate}T10:00:00Z`).getTime();
      const now = Date.now();
      const hoursUntilPickup = (pickupDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilPickup < 24) {
        throw new Error("Orders cannot be cancelled within 24 hours of scheduled pickup.");
      }

      order.status = "CANCELLED";
      order.updatedAt = new Date().toISOString();

      // Decrement reserved cakes
      const cap = this.getCapacityForDate(order.pickupDate);
      const cakeCount = this.calculateBakingSlots(order.items);
      cap.reservedCakes = Math.max(0, cap.reservedCakes - cakeCount);
      this.dailyCapacity.set(order.pickupDate, cap);

      this.auditLogs.push({
        id: `aud-${crypto.randomUUID()}`,
        entityType: "order",
        entityId: order.id,
        action: "CANCELLED",
        performedBy: requestingUserId,
        details: { cakesReturned: cakeCount },
        timestamp: new Date().toISOString(),
      });

      return order;
    } finally {
      releaseLock();
    }
  }

  // --- Baker Dashboard State Transitions ---
  public updateOrderStatus(orderId: string, newStatus: OrderStatus, bakerId?: string): Order {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("Order not found");

    const validTransitions: Record<string, OrderStatus[]> = {
      CONFIRMED: ["BAKING", "CANCELLED"],
      BAKING: ["READY", "CANCELLED"],
      READY: ["COLLECTED"],
      COLLECTED: [],
      CANCELLED: [],
      EXPIRED: [],
      REFUNDED: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
    }

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    this.orders.set(order.id, order);

    this.auditLogs.push({
      id: `aud-${crypto.randomUUID()}`,
      entityType: "order",
      entityId: order.id,
      action: "STATUS_CHANGE",
      performedBy: bakerId,
      details: { newStatus },
      timestamp: new Date().toISOString(),
    });

    return order;
  }

  public getOrdersByDate(dateStr: string): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.pickupDate === dateStr)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrdersByUser(userId: string): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderByNumber(orderNumber: string): Order | undefined {
    this.loadFromDisk();
    return Array.from(this.orders.values()).find((o) => o.orderNumber === orderNumber);
  }

  public getOrderByPickupCode(code: string): Order | undefined {
    this.loadFromDisk();
    return Array.from(this.orders.values()).find(
      (o) => o.pickupCode.toUpperCase() === code.trim().toUpperCase()
    );
  }

  public getAllOrders(): Order[] {
    this.loadFromDisk();
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }
}

// Global Singleton Instance attached to globalThis for Next.js hot-reload and cross-route persistence
const globalForDataStore = globalThis as unknown as {
  cakeCartDataStore: DataStore | undefined;
};

export const dataStore = globalForDataStore.cakeCartDataStore ?? new DataStore();
dataStore.seedInitialData();

globalForDataStore.cakeCartDataStore = dataStore;

