import { dataStore } from "../src/db/dataStore";

async function testComboAndNewMenuItems() {
  console.log("\n=======================================================");
  console.log("   Testing Candles, Balloons, Muffins & Combo Offer   ");
  console.log("=======================================================\n");

  // 1. Verify Categories
  const categories = dataStore.getCategories();
  console.log(`Loaded ${categories.length} categories:`);
  categories.forEach((c) => console.log(`  - [${c.slug}] ${c.name}`));

  const comboCat = categories.find((c) => c.slug === "party-combos");
  const muffinCat = categories.find((c) => c.slug === "muffins");
  const candlesBalloonsCat = categories.find((c) => c.slug === "candles-balloons");

  if (!comboCat || !muffinCat || !candlesBalloonsCat) {
    throw new Error("Missing newly added categories!");
  }
  console.log("✓ Categories party-combos, muffins, and candles-balloons verified.\n");

  // 2. Verify Products
  const products = dataStore.getProducts();
  console.log(`Loaded ${products.length} products total in catalog:`);
  products.forEach((p) => {
    console.log(`  - [${p.slug}] ${p.name} ($${(p.basePrice / 100).toFixed(2)})`);
  });

  const comboProduct = dataStore.getProductBySlug("ultimate-celebration-party-combo");
  const muffinProduct = dataStore.getProductBySlug("artisan-bakery-muffin-box");
  const candleProduct = dataStore.getProductBySlug("gold-celebration-candles-sparklers");
  const balloonProduct = dataStore.getProductBySlug("pastel-helium-confetti-balloon-bouquet");

  if (!comboProduct || !muffinProduct || !candleProduct || !balloonProduct) {
    throw new Error("One or more required products (combo, muffins, candles, balloons) not found!");
  }
  console.log("✓ All 4 requested items found in catalog.\n");

  // 3. Test Booking a Combo + Muffins + Balloons + Candles
  console.log("Testing full reservation with Party Combo + Muffins + Balloons + Candles...");
  const validFutureDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 4 days out (>48h)
  const slot = dataStore.getPickupSlots()[0];

  const reservation = await dataStore.reserveOrder({
    pickupDate: validFutureDate,
    pickupSlotId: slot.id,
    customerName: "Celebration Planner Sarah",
    customerEmail: "sarah.party@example.com",
    customerPhone: "+1 (555) 345-6789",
    items: [
      {
        productId: comboProduct.id,
        quantity: 1,
        sizeOptionId: comboProduct.options[0].id,
        flavourOptionId: comboProduct.options[2].id,
        customMessage: "Happy 30th Birthday Lucas!",
      },
      {
        productId: muffinProduct.id,
        quantity: 1,
        sizeOptionId: muffinProduct.options[0].id,
        flavourOptionId: muffinProduct.options[2].id,
      },
      {
        productId: candleProduct.id,
        quantity: 1,
        sizeOptionId: candleProduct.options[0].id,
        flavourOptionId: candleProduct.options[2].id,
      },
      {
        productId: balloonProduct.id,
        quantity: 1,
        sizeOptionId: balloonProduct.options[0].id,
        flavourOptionId: balloonProduct.options[2].id,
      },
    ],
  });

  console.log(`✓ Reservation created successfully!`);
  console.log(`  Order ID: ${reservation.order.id}`);
  console.log(`  Order Number: ${reservation.order.orderNumber}`);
  console.log(`  Hold Expires: ${reservation.holdExpiresAt}`);
  console.log(`  Total (tamper-proof): $${(reservation.order.totalAmount / 100).toFixed(2)}`);
  console.log(`  Message Fee: $${(reservation.order.messageFee / 100).toFixed(2)}`);

  // 4. Test Payment & Confirmation
  console.log("\nConfirming payment for the combo order...");
  const confirmation = await dataStore.confirmOrder({
    orderId: reservation.order.id,
    idempotencyKey: `idem-test-combo-${Date.now()}`,
    provider: "stripe_mock_card",
  });

  console.log(`✓ Order Confirmed!`);
  console.log(`  Order Number: ${confirmation.order.orderNumber}`);
  console.log(`  Pickup Code: ${confirmation.order.pickupCode}`);
  console.log(`  Status: ${confirmation.order.status}`);
  console.log(`  Items Count: ${confirmation.order.items.length}`);

  console.log("\n=======================================================");
  console.log("   ALL CANDLES, BALLOONS, MUFFINS & COMBO TESTS PASSED! ");
  console.log("=======================================================\n");
}

testComboAndNewMenuItems().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
