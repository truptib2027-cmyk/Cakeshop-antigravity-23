async function testLiveRegistration() {
  const baseUrl = "http://localhost:3000";
  console.log(`\n🔍 Testing Registration Flow live against ${baseUrl}...\n`);

  const uniqueEmail = `jane_${Date.now()}@cakecart.com`;
  const registerPayload = {
    fullName: "Jane Dough",
    email: uniqueEmail,
    phone: "+1 (555) 432-1098",
    password: "Password123!",
    role: "customer",
  };

  // Step 1: Submit Registration Request
  console.log(`1. Submitting POST /api/auth/register with email: ${uniqueEmail}`);
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registerPayload),
  });

  const regData = await regRes.json();
  const setCookieHeader = regRes.headers.get("set-cookie");

  console.log(`   Status: ${regRes.status} ${regRes.statusText}`);
  console.log(`   Response Body:`, JSON.stringify(regData));
  console.log(`   Set-Cookie Header:`, setCookieHeader ? "✓ Session cookie issued" : "✗ Missing cookie");

  if (!regRes.ok || !regData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }

  // Step 2: Verify authenticated session using the returned cookie
  console.log(`\n2. Verifying Session via GET /api/auth/me using issued session cookie...`);
  const sessionCookie = setCookieHeader?.split(";")[0] || "";
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Cookie: sessionCookie,
    },
  });

  const meData = await meRes.json();
  console.log(`   Status: ${meRes.status} ${meRes.statusText}`);
  console.log(`   Authenticated User:`, JSON.stringify(meData.user));

  if (meData.user?.email !== uniqueEmail) {
    throw new Error(`Session mismatch: expected ${uniqueEmail}, got ${meData.user?.email}`);
  }

  // Step 3: Test Duplicate Email Validation
  console.log(`\n3. Testing Duplicate Registration with identical email...`);
  const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registerPayload),
  });
  const dupData = await dupRes.json();
  console.log(`   Status: ${dupRes.status} ${dupRes.statusText}`);
  console.log(`   Response:`, JSON.stringify(dupData));
  if (dupRes.status !== 400 || !dupData.error?.includes("already exists")) {
    throw new Error("Duplicate email was not properly rejected");
  }

  // Step 4: Test Password Validation (< 6 chars)
  console.log(`\n4. Testing Short Password Validation...`);
  const shortPassRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Short Pass",
      email: `short_${Date.now()}@cakecart.com`,
      password: "123",
      role: "customer",
    }),
  });
  const shortPassData = await shortPassRes.json();
  console.log(`   Status: ${shortPassRes.status} ${shortPassRes.statusText}`);
  console.log(`   Response:`, JSON.stringify(shortPassData));
  if (shortPassRes.status !== 400 || !shortPassData.error?.includes("at least 6 characters")) {
    throw new Error("Short password was not properly rejected");
  }

  console.log(`\n🎉 ALL LIVE REGISTRATION & SESSION VERIFICATION TESTS PASSED SUCCESSFULLY!\n`);
}

testLiveRegistration().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
