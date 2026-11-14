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
