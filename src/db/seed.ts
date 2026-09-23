import { dataStore } from "./dataStore";

async function main() {
  console.log("🌱 Seeding CakeCart database with artisan home-bakery data...");
  dataStore.seedInitialData();

  console.log("🍰 Categories:", dataStore.getCategories().length);
  console.log("🎂 Products:", dataStore.getProducts().length);
  console.log("🕒 Pickup Slots:", dataStore.getPickupSlots().length);
  console.log("🏷️ Dietary Tags:", dataStore.getDietaryTags().length);
  console.log("📅 Daily Capacities seeded for next 14 days (12 cakes/day).");
  console.log("👩‍🍳 Baker User: baker@cakecart.com (Password: BakerSecret123!)");
  console.log("🧁 Customer User: customer@example.com (Password: Customer123!)");
  console.log("✅ Seed completed successfully!");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
