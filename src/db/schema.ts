import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  date,
  time,
  timestamp,
  jsonb,
  primaryKey,
  check,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// 1. Users table (Customers & Bakers)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 20 }).notNull().default("customer"), // 'customer' | 'baker'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Categories table
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Products table (Cakes)
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  description: text("description").notNull(),
  basePrice: integer("base_price").notNull(), // Minor units (cents)
  imageUrl: text("image_url").notNull(),
  minLeadTimeHours: integer("min_lead_time_hours").notNull().default(48), // e.g. 48 hours minimum
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Product Categories junction
export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
  ]
);

// 5. Product Options (Sizes, Flavours)
export const productOptions = pgTable("product_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'size' | 'flavour'
  name: varchar("name", { length: 100 }).notNull(),
  priceModifier: integer("price_modifier").notNull().default(0), // Minor units (cents)
  isDefault: boolean("is_default").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
});

// 6. Dietary Tags table (Eggless, Gluten-Free, Nut-Free, Vegan)
export const dietaryTags = pgTable("dietary_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
});

// 7. Product Dietary Tags junction
export const productDietaryTags = pgTable(
  "product_dietary_tags",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => dietaryTags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.tagId] }),
  ]
);

// 8. Daily Capacity table
export const dailyCapacity = pgTable(
  "daily_capacity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bakeryDate: date("bakery_date").notNull().unique(),
    maxCakes: integer("max_cakes").notNull().default(12),
    reservedCakes: integer("reserved_cakes").notNull().default(0),
    isClosed: boolean("is_closed").notNull().default(false),
    notes: text("notes"),
  },
  (table) => [
    check(
      "reserved_lte_max",
      sql`${table.reservedCakes} <= ${table.maxCakes}`
    ),
    check(
      "reserved_gte_zero",
      sql`${table.reservedCakes} >= 0`
    ),
    uniqueIndex("bakery_date_idx").on(table.bakeryDate),
  ]
);

// 9. Pickup Slots table
export const pickupSlots = pgTable("pickup_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  label: varchar("label", { length: 50 }).notNull(), // e.g. "10:00 AM - 12:00 PM"
  maxOrdersPerSlot: integer("max_orders_per_slot").notNull().default(4),
  isActive: boolean("is_active").notNull().default(true),
});

// 10. Orders table
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    pickupDate: date("pickup_date").notNull(),
    pickupSlotId: uuid("pickup_slot_id").references(() => pickupSlots.id),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("PENDING"), // 'PENDING' | 'CONFIRMED' | 'BAKING' | 'READY' | 'COLLECTED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED'
    totalAmount: integer("total_amount").notNull(), // Minor units (cents)
    messageFee: integer("message_fee").notNull().default(0), // Minor units
    customerName: varchar("customer_name", { length: 150 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    pickupCode: varchar("pickup_code", { length: 50 }).notNull().unique(), // e.g. "CC-PICKUP-8492"
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("order_pickup_date_idx").on(table.pickupDate),
    index("order_user_id_idx").on(table.userId),
    index("order_status_idx").on(table.status),
  ]
);

// 11. Order Items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // Minor units
  subtotal: integer("subtotal").notNull(), // Minor units
});

// 12. Order Customisations table
export const orderCustomisations = pgTable(
  "order_customisations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    sizeOptionId: uuid("size_option_id").references(() => productOptions.id),
    flavourOptionId: uuid("flavour_option_id").references(() => productOptions.id),
    customMessage: varchar("custom_message", { length: 40 }), // 40 chars max limit
    messageFee: integer("message_fee").notNull().default(0), // Minor units
    referenceImageUrl: text("reference_image_url"),
  },
  (table) => [
    check(
      "custom_message_len",
      sql`length(${table.customMessage}) <= 40`
    ),
  ]
);

// 13. Payments table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(), // 'stripe_test' | 'test_gateway'
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
    transactionId: varchar("transaction_id", { length: 255 }),
    amount: integer("amount").notNull(), // Minor units
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"), // 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("payment_idemp_idx").on(table.idempotencyKey),
    index("payment_order_idx").on(table.orderId),
  ]
);

// 14. Audit Logs table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'order' | 'capacity' | 'payment' | 'user'
    entityId: varchar("entity_id", { length: 100 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(), // 'HOLD_CREATED' | 'HOLD_EXPIRED' | 'CONFIRMED' | 'STATUS_CHANGE' | 'CANCELLED'
    performedBy: uuid("performed_by").references(() => users.id, { onDelete: "set null" }),
    details: jsonb("details"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_entity_idx").on(table.entityType, table.entityId),
    index("audit_timestamp_idx").on(table.timestamp),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  auditLogs: many(auditLogs),
}));

export const productsRelations = relations(products, ({ many }) => ({
  categories: many(productCategories),
  options: many(productOptions),
  dietaryTags: many(productDietaryTags),
  orderItems: many(orderItems),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(productCategories),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
}));

export const dietaryTagsRelations = relations(dietaryTags, ({ many }) => ({
  products: many(productDietaryTags),
}));

export const productDietaryTagsRelations = relations(productDietaryTags, ({ one }) => ({
  product: one(products, {
    fields: [productDietaryTags.productId],
    references: [products.id],
  }),
  tag: one(dietaryTags, {
    fields: [productDietaryTags.tagId],
    references: [dietaryTags.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  pickupSlot: one(pickupSlots, {
    fields: [orders.pickupSlotId],
    references: [pickupSlots.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  customisation: one(orderCustomisations),
}));

export const orderCustomisationsRelations = relations(orderCustomisations, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderCustomisations.orderItemId],
    references: [orderItems.id],
  }),
  sizeOption: one(productOptions, {
    fields: [orderCustomisations.sizeOptionId],
    references: [productOptions.id],
  }),
  flavourOption: one(productOptions, {
    fields: [orderCustomisations.flavourOptionId],
    references: [productOptions.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
