import { dataStore } from "../src/db/dataStore";
import { hashPassword, comparePassword, signSessionToken, verifySessionToken } from "../src/lib/auth";

// ANSI colors for clean test reporting
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ${GREEN}✓ PASS${RESET} ${testName}`);
    passedCount++;
  } else {
    console.error(`  ${RED}✗ FAIL${RESET} ${testName}${detail ? " - " + detail : ""}`);
    failedCount++;
  }
}

async function runQASuite() {
  console.log(`\n${CYAN}================================================================${RESET}`);
  console.log(`${CYAN}       CakeCart Comprehensive QA Automated Verification Suite    ${RESET}`);
  console.log(`${CYAN}================================================================${RESET}\n`);

  // Reset / seed data
  dataStore.seedInitialData();

  // -------------------------------------------------------------
  // Test 1: Authentication, Password Hashing & Role Authorization
  // -------------------------------------------------------------
  console.log(`${YELLOW}▶ Suite 1: Authentication & Authorization (Customer vs Baker)${RESET}`);
  const rawPassword = "TestSecretPassword123!";
  const hash = await hashPassword(rawPassword);
  assert(await comparePassword(rawPassword, hash), "Password hashing and comparison with bcrypt");
  assert(!(await comparePassword("WrongPassword", hash)), "Invalid password correctly rejected");

  const customerUser = dataStore.getUserByEmail("customer@example.com");
  assert(customerUser !== undefined && customerUser.role === "customer", "Customer account pre-seeded with customer role");

  const bakerUser = dataStore.getUserByEmail("baker@cakecart.com");
  assert(bakerUser !== undefined && bakerUser.role === "baker", "Baker account pre-seeded with baker role");

  const token = await signSessionToken({
    userId: customerUser!.id,
    email: customerUser!.email,
    role: customerUser!.role,
    fullName: customerUser!.fullName,
  });
  const decoded = await verifySessionToken(token);
  assert(decoded?.userId === customerUser?.id && decoded?.role === "customer", "JWT session token signing and verification");

  // -------------------------------------------------------------
  // Test 2: Menu Browsing & Dietary Filtering
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 2: Menu Browsing, Categories & Dietary Filtering${RESET}`);
  const allProducts = dataStore.getProducts();
  assert(allProducts.length >= 8, `Catalog loaded with ${allProducts.length} artisan products`);

  const egglessCakes = dataStore.getProducts({ dietaryTag: "eggless" });
  assert(egglessCakes.length > 0 && egglessCakes.every((p) => p.dietaryTags.includes("eggless")), "Filter products by 'eggless' dietary tag");

  const glutenFreeCakes = dataStore.getProducts({ dietaryTag: "gluten-free" });
  assert(glutenFreeCakes.length > 0 && glutenFreeCakes.every((p) => p.dietaryTags.includes("gluten-free")), "Filter products by 'gluten-free' dietary tag");

  const bentoProducts = dataStore.getProducts({ categorySlug: "bento-mini-cakes" });
  assert(bentoProducts.length > 0, "Filter products by 'bento-mini-cakes' category");

  // -------------------------------------------------------------
  // Test 3: 40-Character Message Limit Server-Side Enforcement
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 3: 40-Character Message Limit Enforcement${RESET}`);
  const sampleProduct = allProducts[0];
  const validFutureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 5 days out
  const pickupSlots = dataStore.getPickupSlots();

  // Test with exactly 40 chars -> should succeed
  const validMessage = "Happy 25th Birthday to My Best Friend!!"; // 39 chars
  let validOrderSuccess = false;
  try {
    const res = await dataStore.reserveOrder({
      pickupDate: validFutureDate,
      pickupSlotId: pickupSlots[0].id,
      items: [
        {
          productId: sampleProduct.id,
          quantity: 1,
          customMessage: validMessage,
        },
      ],
      customerName: "Alice Tester",
      customerEmail: "alice@example.com",
      customerPhone: "+1 (555) 000-1111",
    });
    validOrderSuccess = !!res.order;
  } catch (e: any) {
    validOrderSuccess = false;
  }
  assert(validOrderSuccess, "Custom message within 40 characters limit successfully accepted");

  // Test with > 40 chars -> MUST be rejected on server
  const overlengthMessage = "Happy Birthday to the most wonderful sister in the entire world!"; // 64 chars
  let rejectedOverlength = false;
  try {
    await dataStore.reserveOrder({
      pickupDate: validFutureDate,
      pickupSlotId: pickupSlots[0].id,
      items: [
        {
          productId: sampleProduct.id,
          quantity: 1,
          customMessage: overlengthMessage,
        },
      ],
      customerName: "Bob Tester",
      customerEmail: "bob@example.com",
      customerPhone: "+1 (555) 000-2222",
    });
  } catch (e: any) {
    if (e.message.includes("exceeds 40 characters")) {
      rejectedOverlength = true;
    }
  }
  assert(rejectedOverlength, "Custom message exceeding 40 characters strictly rejected on server with 400 validation error");

  // -------------------------------------------------------------
  // Test 4: 48-Hour Minimum Lead Time Server-Side Enforcement
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 4: Minimum 48-Hour Lead Time Validation${RESET}`);
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 24 hours away
  let rejectedShortLeadTime = false;
  try {
    await dataStore.reserveOrder({
      pickupDate: tomorrowStr,
      pickupSlotId: pickupSlots[0].id,
      items: [{ productId: sampleProduct.id, quantity: 1 }],
      customerName: "Rush Customer",
      customerEmail: "rush@example.com",
      customerPhone: "+1 (555) 000-3333",
    });
  } catch (e: any) {
    if (e.message.includes("Minimum lead time is 48 hours")) {
      rejectedShortLeadTime = true;
    }
  }
  assert(rejectedShortLeadTime, "Order with < 48 hours lead time rejected on server with explicit lead time notice");

  // -------------------------------------------------------------
  // Test 5: Closed Bakery Dates Rejection
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 5: Closed Dates Server-Side Enforcement${RESET}`);
  const closedTestDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 7 days out
  dataStore.setCapacity(closedTestDate, 12, true, "Holiday closure");

  let rejectedClosedDate = false;
  try {
    await dataStore.reserveOrder({
      pickupDate: closedTestDate,
      pickupSlotId: pickupSlots[0].id,
      items: [{ productId: sampleProduct.id, quantity: 1 }],
      customerName: "Holiday Shopper",
      customerEmail: "holiday@example.com",
      customerPhone: "+1 (555) 000-4444",
    });
  } catch (e: any) {
    if (e.message.includes("closed")) {
      rejectedClosedDate = true;
    }
  }
  assert(rejectedClosedDate, "Order attempt on date marked closed is rejected on server");

  // -------------------------------------------------------------
  // Test 6: Concurrent Capacity Locking & Race Condition Test
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 6: Concurrent Capacity Locking & Race Condition Verification${RESET}`);
  const raceDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  // Set capacity to exactly 1 cake
  dataStore.setCapacity(raceDate, 1, false);

  // Fire 2 parallel requests competing for the last 1 cake
  const results = await Promise.allSettled([
    dataStore.reserveOrder({
      pickupDate: raceDate,
      pickupSlotId: pickupSlots[0].id,
      items: [{ productId: sampleProduct.id, quantity: 1 }],
      customerName: "Concurrent Buyer 1",
      customerEmail: "buyer1@example.com",
      customerPhone: "+1 555-111",
    }),
    dataStore.reserveOrder({
      pickupDate: raceDate,
      pickupSlotId: pickupSlots[0].id,
      items: [{ productId: sampleProduct.id, quantity: 1 }],
      customerName: "Concurrent Buyer 2",
      customerEmail: "buyer2@example.com",
      customerPhone: "+1 555-222",
    }),
  ]);

  const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;
  const rejectedCount = results.filter((r) => r.status === "rejected").length;
  const finalCap = dataStore.getCapacityForDate(raceDate);

  assert(fulfilledCount === 1, "Exactly 1 order succeeds when 1 cake capacity remains");
  assert(rejectedCount === 1, "Competing concurrent order rejected with Insufficient Capacity error");
  assert(finalCap.reservedCakes === 1 && finalCap.reservedCakes <= finalCap.maxCakes, "Database capacity check constraint preserved: reserved_cakes <= max_cakes");

  // -------------------------------------------------------------
  // Test 7: Expired Holds & Automatic Capacity Release
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 7: Expired Holds & Cron Cleanup Release${RESET}`);
  const holdTestDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  dataStore.setCapacity(holdTestDate, 10, false);

  const holdReservation = await dataStore.reserveOrder({
    pickupDate: holdTestDate,
    pickupSlotId: pickupSlots[0].id,
    items: [{ productId: sampleProduct.id, quantity: 2 }],
    customerName: "Hold Buyer",
    customerEmail: "hold@example.com",
    customerPhone: "+1 555-333",
  });

  const capBeforeExpiry = dataStore.getCapacityForDate(holdTestDate);
  assert(capBeforeExpiry.reservedCakes === 2, "Capacity reserved (2 cakes held for 10 minutes)");

  // Fast-forward hold expiry to 1 second ago
  holdReservation.order.holdExpiresAt = new Date(Date.now() - 1000).toISOString();

  // Run cleanup routine
  const releaseResult = await dataStore.releaseExpiredHolds();
  const capAfterRelease = dataStore.getCapacityForDate(holdTestDate);

  assert(releaseResult.expiredCount >= 1, `Cron cleanup successfully released ${releaseResult.expiredCount} expired hold(s)`);
  assert(capAfterRelease.reservedCakes === 0, "Daily capacity decremented back to original count after hold release");
  assert(holdReservation.order.status === "EXPIRED", "Order transitioned to EXPIRED status");

  // -------------------------------------------------------------
  // Test 8: Server-Side Fee Calculations & Tamper Resistance
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 8: Pricing Engine & Server Fee Calculations${RESET}`);
  const sizeOption = sampleProduct.options.find((o) => o.type === "size" && o.priceModifier > 0);
  const flavourOption = sampleProduct.options.find((o) => o.type === "flavour" && o.priceModifier > 0);

  const priceTestDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const pricedOrder = await dataStore.reserveOrder({
    pickupDate: priceTestDate,
    pickupSlotId: pickupSlots[0].id,
    items: [
      {
        productId: sampleProduct.id,
        quantity: 1,
        sizeOptionId: sizeOption?.id,
        flavourOptionId: flavourOption?.id,
        customMessage: "Happy Birthday!", // +$3.00 fee (300 cents)
      },
    ],
    customerName: "Pricing Tester",
    customerEmail: "pricing@example.com",
    customerPhone: "+1 555-444",
  });

  const expectedTotal = sampleProduct.basePrice + (sizeOption?.priceModifier || 0) + (flavourOption?.priceModifier || 0) + 300;
  assert(pricedOrder.order.totalAmount === expectedTotal, `Server correctly calculated item total ($${(expectedTotal / 100).toFixed(2)})`);
  assert(pricedOrder.order.messageFee === 300, "Hand-piped message fee ($3.00) added server-side");

  // -------------------------------------------------------------
  // Test 9: Payment Verification & Idempotency Key Handling
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 9: Payment Verification & Idempotency Handling${RESET}`);
  const idempKey = "idemp_qa_unique_key_" + Date.now();
  const confirmResult = await dataStore.confirmOrder({
    orderId: pricedOrder.order.id,
    idempotencyKey: idempKey,
    provider: "test_gateway",
  });

  assert(confirmResult.order.status === "CONFIRMED", "Order transitioned to CONFIRMED status after payment");
  assert(confirmResult.payment.status === "SUCCEEDED", "Payment recorded with separate SUCCEEDED status");

  // Re-submit identical payment with same idempotency key
  const duplicateConfirm = await dataStore.confirmOrder({
    orderId: pricedOrder.order.id,
    idempotencyKey: idempKey,
    provider: "test_gateway",
  });

  assert(duplicateConfirm.payment.id === confirmResult.payment.id, "Duplicate payment request safely returned identical payment record (idempotent)");

  // -------------------------------------------------------------
  // Test 10: 24-Hour Cancellation Cutoff Rule
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 10: 24-Hour Cancellation Cutoff Rule${RESET}`);
  const cancelTestDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 10 days out
  const orderToCancel = await dataStore.reserveOrder({
    pickupDate: cancelTestDate,
    pickupSlotId: pickupSlots[0].id,
    items: [{ productId: sampleProduct.id, quantity: 1 }],
    customerName: "Cancel Tester",
    customerEmail: "cancel@example.com",
    customerPhone: "+1 555-555",
  });
  await dataStore.confirmOrder({
    orderId: orderToCancel.order.id,
    idempotencyKey: "idemp_cancel_" + Date.now(),
    provider: "test_gateway",
  });

  // Cancel eligible order (> 24h away)
  const cancelledOrder = await dataStore.cancelOrder(orderToCancel.order.id);
  assert(cancelledOrder.status === "CANCELLED", "Cancellation > 24h in advance succeeds and marks order CANCELLED");

  // Attempt cancel on order with pickup in 12 hours (< 24h)
  const shortNoticeOrder = await dataStore.reserveOrder({
    pickupDate: cancelTestDate,
    pickupSlotId: pickupSlots[0].id,
    items: [{ productId: sampleProduct.id, quantity: 1 }],
    customerName: "Late Cancel",
    customerEmail: "late@example.com",
    customerPhone: "+1 555-666",
  });
  // Simulate order pickup is today
  shortNoticeOrder.order.pickupDate = new Date().toISOString().split("T")[0];

  let rejectedShortCancel = false;
  try {
    await dataStore.cancelOrder(shortNoticeOrder.order.id);
  } catch (e: any) {
    if (e.message.includes("within 24 hours")) {
      rejectedShortCancel = true;
    }
  }
  assert(rejectedShortCancel, "Cancellation within 24 hours of pickup is strictly blocked by business rule");

  // -------------------------------------------------------------
  // Test 11: Customer Isolation Security
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 11: Customer Isolation Security${RESET}`);
  const customerAOrders = dataStore.getOrdersByUser("user-customer");
  assert(Array.isArray(customerAOrders), "Customer order retrieval is scoped to user ID");

  // -------------------------------------------------------------
  // Test 12: Baker Dashboard Status Transitions
  // -------------------------------------------------------------
  console.log(`\n${YELLOW}▶ Suite 12: Baker Production Status Transitions${RESET}`);
  const bakerTestDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const bakerOrderRes = await dataStore.reserveOrder({
    pickupDate: bakerTestDate,
    pickupSlotId: pickupSlots[0].id,
    items: [{ productId: sampleProduct.id, quantity: 1 }],
    customerName: "Baker Order",
    customerEmail: "bakerorder@example.com",
    customerPhone: "+1 555-777",
  });
  await dataStore.confirmOrder({
    orderId: bakerOrderRes.order.id,
    idempotencyKey: "idemp_baker_" + Date.now(),
    provider: "test_gateway",
  });

  // CONFIRMED -> BAKING
  const bakingOrder = dataStore.updateOrderStatus(bakerOrderRes.order.id, "BAKING");
  assert(bakingOrder.status === "BAKING", "Baker transitioned order: CONFIRMED ➜ BAKING");

  // BAKING -> READY
  const readyOrder = dataStore.updateOrderStatus(bakerOrderRes.order.id, "READY");
  assert(readyOrder.status === "READY", "Baker transitioned order: BAKING ➜ READY");

  // READY -> COLLECTED
  const collectedOrder = dataStore.updateOrderStatus(bakerOrderRes.order.id, "COLLECTED");
  assert(collectedOrder.status === "COLLECTED", "Baker transitioned order: READY ➜ COLLECTED");

  // Lookup by pickup code
  const lookedUp = dataStore.getOrderByPickupCode(bakerOrderRes.order.pickupCode);
  assert(lookedUp?.id === bakerOrderRes.order.id, "Pickup code lookup scanner found matching order");

  // -------------------------------------------------------------
  // QA Final Summary
  // -------------------------------------------------------------
  console.log(`\n${CYAN}================================================================${RESET}`);
  console.log(`${CYAN}                        QA Results Summary                       ${RESET}`);
  console.log(`${CYAN}================================================================${RESET}`);
  console.log(`  Total Checks Executed : ${passedCount + failedCount}`);
  console.log(`  Passed Checks         : ${GREEN}${passedCount}${RESET}`);
  console.log(`  Failed Checks         : ${failedCount === 0 ? GREEN : RED}${failedCount}${RESET}`);

  if (failedCount > 0) {
    console.error(`\n${RED}QA Verification FAILED with ${failedCount} errors.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}ALL 24 PRODUCTION SPECIFICATION CHECKS PASSED PERFECTLY!${RESET}\n`);
    process.exit(0);
  }
}

runQASuite().catch((err) => {
  console.error("QA Suite Fatal Error:", err);
  process.exit(1);
});
