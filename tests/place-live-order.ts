async function placeLiveBooking() {
  const baseUrl = "http://localhost:3000";

  // 1. Get products and slots
  const prodRes = await fetch(`${baseUrl}/api/products`);
  const prodData = await prodRes.json();
  const product = prodData.products[0]; // Velvet Raspberry Celebration Cake

  const capRes = await fetch(`${baseUrl}/api/capacity?days=7`);
  const capData = await capRes.json();

  // Find valid date (>= 48h lead time, e.g. 4 days from now)
  const pickupDate = capData.capacities[3].bakeryDate;
  const pickupSlot = capData.slots[0]; // Morning window

  const sizeOption = product.options.find((o: any) => o.type === "size" && o.name.includes("8\""));
  const flavourOption = product.options.find((o: any) => o.type === "flavour");

  console.log(`🍰 Booking cake: ${product.name}`);
  console.log(`📅 Pickup Date: ${pickupDate}`);
  console.log(`🕒 Pickup Window: ${pickupSlot.label}`);

  // 2. Reserve order (Transactional 10-minute hold)
  const reserveRes = await fetch(`${baseUrl}/api/orders/reserve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickupDate,
      pickupSlotId: pickupSlot.id,
      items: [
        {
          productId: product.id,
          quantity: 1,
          sizeOptionId: sizeOption?.id,
          flavourOptionId: flavourOption?.id,
          customMessage: "Happy Celebration CakeCart!",
        },
      ],
      customerName: "Trupti",
      customerEmail: "trupti@example.com",
      customerPhone: "+1 (555) 789-0123",
      notes: "Please add gold celebration candles and festive ribbon",
    }),
  });

  const reserveData = await reserveRes.json();
  if (!reserveRes.ok) {
    throw new Error(`Reservation failed: ${JSON.stringify(reserveData)}`);
  }

  const order = reserveData.order;
  console.log(`\n🔒 Temporary hold placed. Order ID: ${order.id}`);

  // 3. Confirm Payment (Test Gateway)
  const idempotencyKey = `idemp_live_booking_${order.id}_${Date.now()}`;
  const confirmRes = await fetch(`${baseUrl}/api/orders/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: order.id,
      idempotencyKey,
      provider: "test_gateway",
      transactionId: `tx_live_${Date.now()}`,
    }),
  });

  const confirmData = await confirmRes.json();
  if (!confirmRes.ok) {
    throw new Error(`Payment confirmation failed: ${JSON.stringify(confirmData)}`);
  }

  const confirmedOrder = confirmData.order;

  console.log("\n========================================================");
  console.log("            🎉 ORDER SUCCESSFULLY BOOKED!               ");
  console.log("========================================================");
  console.log(`Order Number      : ${confirmedOrder.orderNumber}`);
  console.log(`Status            : ${confirmedOrder.status}`);
  console.log(`Pickup Code (QR)  : ${confirmedOrder.pickupCode}`);
  console.log(`Customer Name     : ${confirmedOrder.customerName}`);
  console.log(`Pickup Date       : ${confirmedOrder.pickupDate}`);
  console.log(`Pickup Window     : ${confirmedOrder.pickupSlotLabel}`);
  console.log(`Total Paid        : $${(confirmedOrder.totalAmount / 100).toFixed(2)}`);
  console.log(`Custom Message    : "Happy Celebration CakeCart!"`);
  console.log(`Confirmation URL  : ${baseUrl}/order-confirmation/${confirmedOrder.orderNumber}`);
  console.log("========================================================\n");
}

placeLiveBooking().catch((err) => {
  console.error("Booking failed:", err);
  process.exit(1);
});
