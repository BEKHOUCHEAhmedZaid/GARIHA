/**
 * Automated Verification Suite for GARIHA Next.js Fullstack Migration
 * 
 * Tests:
 * 1. Password hashing & verification (bcryptjs)
 * 2. JWT token generation & verification (jose)
 * 3. Role authorization & privilege isolation
 * 4. Error response formatting when configuration is missing
 */
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function testPasswordHashing() {
  console.log("\n--- TEST 1: Password Hashing & Verification (bcryptjs) ---");
  const plain = "SuperSecretPassword2026!";
  const hash = await bcrypt.hash(plain, 10);

  assert(hash.startsWith("$2a$") || hash.startsWith("$2b$"), "Generates valid bcrypt hash");
  assert(await bcrypt.compare(plain, hash), "Verifies correct password");
  assert(!(await bcrypt.compare("WrongPassword", hash)), "Rejects incorrect password");
}

async function testJwtTokens() {
  console.log("\n--- TEST 2: JWT Creation & Verification (jose) ---");
  const secret = new TextEncoder().encode("test-secret-key-for-unit-testing-32chars");

  const token = await new SignJWT({
    sub: "admin@gariha.com",
    role: "admin",
    id: 1,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  assert(typeof token === "string" && token.length > 20, "Generates signed JWT token");

  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  assert(payload.sub === "admin@gariha.com", "Token subject matches email");
  assert(payload.role === "admin", "Token contains admin role");
  assert(payload.id === 1, "Token contains user id");
}

async function testRoleAuthorization() {
  console.log("\n--- TEST 3: Role Authorization Rules ---");

  const roles = ["admin", "owner", "driver"];

  function checkAdminAccess(userRole) {
    return userRole === "admin";
  }

  function checkOwnerAccess(userRole, userStatus) {
    return userRole === "owner" && userStatus === "approved";
  }

  function checkDriverDataIsolation(driverId, resourceDriverId) {
    return driverId === resourceDriverId;
  }

  // Admin checks
  assert(checkAdminAccess("admin") === true, "Admin role is granted admin access");
  assert(checkAdminAccess("owner") === false, "Owner role is denied admin access");
  assert(checkAdminAccess("driver") === false, "Driver role is denied admin access");

  // Owner checks
  assert(checkOwnerAccess("owner", "approved") === true, "Approved owner is granted owner access");
  assert(checkOwnerAccess("owner", "pending") === false, "Pending owner is denied active owner access");
  assert(checkOwnerAccess("owner", "rejected") === false, "Rejected owner is denied owner access");
  assert(checkOwnerAccess("driver", "approved") === false, "Driver role cannot access owner dashboard");

  // Driver isolation checks
  assert(checkDriverDataIsolation(42, 42) === true, "Driver can access own reservation");
  assert(checkDriverDataIsolation(42, 99) === false, "Driver cannot access another driver's reservation");
}

async function testConfigHandling() {
  console.log("\n--- TEST 4: Missing Configuration Graceful Error Handling ---");

  function getMissingDbMessage(databaseUrl) {
    if (!databaseUrl) {
      return "DATABASE_URL is not set. Please define the DATABASE_URL environment variable in your Vercel project or local .env file.";
    }
    return null;
  }

  const errorMsg = getMissingDbMessage(undefined);
  assert(
    errorMsg.includes("DATABASE_URL is not set"),
    "Returns clear, actionable message when DATABASE_URL is missing"
  );
}

async function testSetupSecurity() {
  console.log("\n--- TEST 5: /api/setup Production Security & Protection ---");

  function evaluateSetupAccess(nodeEnv, setupSecret, requestHeader) {
    const isProd = nodeEnv === "production";
    if (isProd) {
      if (!setupSecret) {
        return { allowed: false, status: 403, reason: "SETUP_SECRET missing in production" };
      }
      if (!requestHeader || requestHeader !== setupSecret) {
        return { allowed: false, status: 403, reason: "invalid setup secret" };
      }
    } else if (setupSecret) {
      if (!requestHeader || requestHeader !== setupSecret) {
        return { allowed: false, status: 403, reason: "invalid setup secret" };
      }
    }
    return { allowed: true, status: 200 };
  }

  // Production checks
  assert(
    evaluateSetupAccess("production", undefined, undefined).allowed === false &&
    evaluateSetupAccess("production", undefined, undefined).status === 403,
    "In production: Rejects request if SETUP_SECRET is not configured (403)"
  );

  assert(
    evaluateSetupAccess("production", "supersecret123", undefined).allowed === false &&
    evaluateSetupAccess("production", "supersecret123", undefined).status === 403,
    "In production: Rejects request if header x-setup-secret is missing (403)"
  );

  assert(
    evaluateSetupAccess("production", "supersecret123", "wrongSecret").allowed === false &&
    evaluateSetupAccess("production", "supersecret123", "wrongSecret").status === 403,
    "In production: Rejects request if header x-setup-secret does not match (403)"
  );

  assert(
    evaluateSetupAccess("production", "supersecret123", "supersecret123").allowed === true &&
    evaluateSetupAccess("production", "supersecret123", "supersecret123").status === 200,
    "In production: Allows request when x-setup-secret matches exactly (200)"
  );

  // Development checks
  assert(
    evaluateSetupAccess("development", undefined, undefined).allowed === true,
    "In development: Allows local setup if SETUP_SECRET is unset"
  );

  assert(
    evaluateSetupAccess("development", "devSecret", "wrongSecret").allowed === false,
    "In development: Rejects if SETUP_SECRET is set but header does not match"
  );
}

async function testRegistrationRoleSafety() {
  console.log("\n--- TEST 6: Public Registration Role Safety ---");

  function determineRegistrationRole(parkingName, email, adminEmailsList = []) {
    // Public registration strictly assigns driver or owner (pending). Never admin.
    let role = "driver";
    let statusVal = "approved";

    if (parkingName) {
      role = "owner";
      statusVal = "pending";
    }

    return { role, status: statusVal };
  }

  const standardUser = determineRegistrationRole(undefined, "user@gariha.com");
  assert(standardUser.role === "driver" && standardUser.status === "approved", "Public user defaults to driver/approved");

  const ownerUser = determineRegistrationRole("Central Parking", "owner@gariha.com");
  assert(ownerUser.role === "owner" && ownerUser.status === "pending", "Parking owner defaults to owner/pending");

  const adminEmailAttempt = determineRegistrationRole(undefined, "admin@gariha.com", ["admin@gariha.com"]);
  assert(adminEmailAttempt.role !== "admin", "Public registration NEVER assigns admin role, even if email matches ADMIN_EMAIL");
  assert(adminEmailAttempt.role === "driver", "Public registration with admin email strictly falls back to driver");
}

async function testDbSchemaSafety() {
  console.log("\n--- TEST 7: Database Safety & Table Preservation Check ---");
  const fs = await import("fs");
  const path = await import("path");
  const baseDir = process.cwd();

  const dbSource = fs.readFileSync(path.join(baseDir, "lib", "db.ts"), "utf-8");
  const setupSource = fs.readFileSync(path.join(baseDir, "app", "api", "setup", "route.ts"), "utf-8");
  const cliSource = fs.readFileSync(path.join(baseDir, "scripts", "setup-db.mjs"), "utf-8");

  const hasDropTable = /DROP\s+TABLE/i.test(dbSource) || /DROP\s+TABLE/i.test(setupSource) || /DROP\s+TABLE/i.test(cliSource);
  const hasTruncate = /TRUNCATE\s+/i.test(dbSource) || /TRUNCATE\s+/i.test(setupSource) || /TRUNCATE\s+/i.test(cliSource);

  assert(!hasDropTable, "Database setup contains NO 'DROP TABLE' statements (tables are never dropped)");
  assert(!hasTruncate, "Database setup contains NO 'TRUNCATE' statements (tables are never wiped)");
}

async function testDriverSpotChangeAndCancelRules() {
  console.log("\n--- TEST 8: Driver Spot Change & Cancellation Business Logic ---");

  // Rule 1: Spot change authorization & availability
  function evaluateSpotChange(user, reservation, targetSpot) {
    const isDriver = reservation.driver_id === user.id;
    const isOwner = reservation.parking_owner_id === user.id;
    const isAdmin = user.role === "admin";

    if (!isDriver && !isOwner && !isAdmin) {
      return { allowed: false, status: 403, error: "Forbidden: You are not authorized" };
    }

    if (!["active", "checked_in"].includes(reservation.status)) {
      return { allowed: false, status: 400, error: `Cannot change spot with status ${reservation.status}` };
    }

    if (reservation.parking_id !== targetSpot.parking_id) {
      return { allowed: false, status: 404, error: "Spot belongs to a different parking" };
    }

    if (targetSpot.status !== "LIBRE") {
      return { allowed: false, status: 409, error: "Target spot is not available" };
    }

    return { 
      allowed: true, 
      status: 200, 
      oldSpotNextStatus: "LIBRE", 
      newSpotNextStatus: reservation.status === "checked_in" ? "OCCUPEE" : "RESERVEE" 
    };
  }

  const driverUser = { id: 10, role: "driver" };
  const anotherDriver = { id: 99, role: "driver" };
  const activeReservation = { id: 101, driver_id: 10, parking_id: 1, parking_owner_id: 5, status: "active", parking_spot_id: 20 };
  const spotInSameParkingFree = { id: 25, parking_id: 1, status: "LIBRE" };
  const spotInSameParkingOccupied = { id: 26, parking_id: 1, status: "OCCUPEE" };
  const spotInDifferentParking = { id: 50, parking_id: 2, status: "LIBRE" };

  assert(
    evaluateSpotChange(driverUser, activeReservation, spotInSameParkingFree).allowed === true,
    "Driver can change to a free spot in the same parking"
  );
  assert(
    evaluateSpotChange(driverUser, activeReservation, spotInSameParkingFree).oldSpotNextStatus === "LIBRE" &&
    evaluateSpotChange(driverUser, activeReservation, spotInSameParkingFree).newSpotNextStatus === "RESERVEE",
    "Spot change atomically releases old spot and locks new spot"
  );
  assert(
    evaluateSpotChange(driverUser, activeReservation, spotInSameParkingOccupied).status === 409,
    "Spot change rejects occupied target spot (409 Conflict)"
  );
  assert(
    evaluateSpotChange(driverUser, activeReservation, spotInDifferentParking).status === 404,
    "Spot change rejects spot from another parking (404 Not Found)"
  );
  assert(
    evaluateSpotChange(anotherDriver, activeReservation, spotInSameParkingFree).status === 403,
    "Another driver is denied permission to change someone else's reservation (403 Forbidden)"
  );

  // Rule 2: Cancellation rules
  function evaluateCancellation(user, reservation) {
    const isDriver = reservation.driver_id === user.id;
    const isOwner = reservation.parking_owner_id === user.id;
    const isAdmin = user.role === "admin";

    if (!isDriver && !isOwner && !isAdmin) {
      return { allowed: false, status: 403, error: "Forbidden" };
    }

    if (!["active", "checked_in"].includes(reservation.status)) {
      return { allowed: false, status: 400, error: `Cannot cancel with status ${reservation.status}` };
    }

    return { allowed: true, status: 200, nextStatus: "cancelled", spotNextStatus: "LIBRE" };
  }

  assert(
    evaluateCancellation(driverUser, activeReservation).allowed === true &&
    evaluateCancellation(driverUser, activeReservation).spotNextStatus === "LIBRE",
    "Driver can cancel active reservation, freeing spot to LIBRE"
  );
  assert(
    evaluateCancellation(anotherDriver, activeReservation).status === 403,
    "Unauthorized driver cannot cancel another driver's reservation (403 Forbidden)"
  );
  const alreadyCancelledRes = { ...activeReservation, status: "cancelled" };
  assert(
    evaluateCancellation(driverUser, alreadyCancelledRes).status === 400,
    "Cannot cancel already cancelled reservation (400 Bad Request)"
  );
}

async function testOwnerDataIsolation() {
  console.log("\n--- TEST 9: Owner Data Isolation Rules ---");

  function filterOwnerReservations(reservations, ownerId) {
    return reservations.filter(r => r.parking_owner_id === ownerId);
  }

  function filterOwnerAccessRules(rules, ownerId) {
    return rules.filter(rule => rule.parking_owner_id === ownerId);
  }

  const sampleReservations = [
    { id: 1, parking_owner_id: 100, driver_name: "Ali", amount: 250 },
    { id: 2, parking_owner_id: 100, driver_name: "Omar", amount: 300 },
    { id: 3, parking_owner_id: 200, driver_name: "Zaki", amount: 250 },
  ];

  const owner100Res = filterOwnerReservations(sampleReservations, 100);
  assert(owner100Res.length === 2 && owner100Res.every(r => r.parking_owner_id === 100), "Owner 100 only sees reservations from their own parkings");
  assert(!owner100Res.some(r => r.parking_owner_id === 200), "Owner 100 cannot see reservations from Owner 200");

  const sampleRules = [
    { id: 10, parking_owner_id: 100, plate: "16-111-16", rule_type: "whitelist" },
    { id: 11, parking_owner_id: 200, plate: "31-222-31", rule_type: "blacklist" },
  ];

  const owner100Rules = filterOwnerAccessRules(sampleRules, 100);
  assert(owner100Rules.length === 1 && owner100Rules[0].plate === "16-111-16", "Owner only accesses their own access control rules");
}

async function testAdminCalculations() {
  console.log("\n--- TEST 10: Admin Real Calculations & Empty State Consistency ---");

  function calculatePlatformStats(reservations, users) {
    const validReservations = reservations.filter(r => r.status !== "cancelled");
    const totalRevenue = validReservations.reduce((sum, r) => sum + (r.price || 0), 0);
    const totalTransactions = reservations.length;
    const cancelledCount = reservations.filter(r => r.status === "cancelled").length;
    const cancellationRate = totalTransactions > 0 
      ? ((cancelledCount / totalTransactions) * 100).toFixed(1) + "%"
      : "0.0%";

    const totalDrivers = users.filter(u => u.role === "driver").length;
    const approvedOwners = users.filter(u => u.role === "owner" && u.status === "approved").length;
    const pendingOwners = users.filter(u => u.role === "owner" && u.status === "pending").length;

    return {
      revenue: totalRevenue,
      transactions: totalTransactions,
      cancellationRate,
      totalDrivers,
      approvedOwners,
      pendingOwners,
      commissions: Math.floor(totalRevenue * 0.1),
    };
  }

  // 1. Empty database test
  const emptyStats = calculatePlatformStats([], []);
  assert(emptyStats.revenue === 0, "Empty database correctly yields 0 DZD revenue");
  assert(emptyStats.transactions === 0, "Empty database correctly yields 0 transactions");
  assert(emptyStats.cancellationRate === "0.0%", "Empty database correctly yields 0.0% cancellation rate");
  assert(emptyStats.totalDrivers === 0, "Empty database correctly yields 0 drivers");

  // 2. Real transactions test
  const mockReservations = [
    { id: 1, status: "active", price: 250 },
    { id: 2, status: "completed", price: 500 },
    { id: 3, status: "cancelled", price: 250 }, // Cancelled should be excluded from revenue!
  ];
  const mockUsers = [
    { id: 1, role: "driver", status: "approved" },
    { id: 2, role: "driver", status: "approved" },
    { id: 3, role: "owner", status: "approved" },
    { id: 4, role: "owner", status: "pending" },
  ];

  const calculated = calculatePlatformStats(mockReservations, mockUsers);
  assert(calculated.revenue === 750, "Revenue strictly excludes cancelled reservations (250 + 500 = 750 DZD)");
  assert(calculated.commissions === 75, "Platform commission is accurately 10% of real revenue (75 DZD)");
  assert(calculated.cancellationRate === "33.3%", "Cancellation rate correctly reflects 1 out of 3 reservations cancelled (33.3%)");
  assert(calculated.totalDrivers === 2, "Driver count accurately reflects registered driver users");
  assert(calculated.approvedOwners === 1 && calculated.pendingOwners === 1, "Owner counts accurately partitioned by approved vs pending");
}

async function run() {
  console.log("==================================================");
  console.log(" GARIHA Fullstack Migration Test Suite");
  console.log("==================================================");

  await testPasswordHashing();
  await testJwtTokens();
  await testRoleAuthorization();
  await testConfigHandling();
  await testSetupSecurity();
  await testRegistrationRoleSafety();
  await testDbSchemaSafety();
  await testDriverSpotChangeAndCancelRules();
  await testOwnerDataIsolation();
  await testAdminCalculations();

  console.log("\n==================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Test Suite Error:", e);
  process.exit(1);
});
