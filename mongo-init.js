// Menjamin user aplikasi (MONGO_APP_USERNAME) ada di MongoDB — idempotent.
// Dual-mode:
//  - mongosh (docker-entrypoint-initdb.d → otomatis jalan di volume mongo baru)
//  - Node   (npm run dev → predev: node mongo-init.js)
const log = typeof print !== "undefined" ? print : console.log;
// Nama DB aplikasi — bisa di-override per instance (mis. instance portofolio pakai
// vet-management-dev). Default tetap vet-management (backward-compatible).
const appDb = process.env.MONGO_APP_DATABASE || "vet-management";

// Mode Node (npm run dev): baca .env root project dulu.
// Mode mongosh (docker): env MONGO_APP_* sudah ada di container.
if (typeof db === "undefined") {
  const fs = require("node:fs");
  const path = require("node:path");
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } else {
    log("ℹ️  .env tidak ditemukan di root — pakai default dev (vetapp/dev-app-password). Copy template: cp .env.example .env");
  }
}

// Default sama dengan docker-compose.yml, jadi konsisten walau tanpa .env
const appUsername = process.env.MONGO_APP_USERNAME || "vetapp";
const appPassword = process.env.MONGO_APP_PASSWORD || "dev-app-password";
const rootUser = process.env.MONGO_INITDB_ROOT_USERNAME || "root";
const rootPass = process.env.MONGO_INITDB_ROOT_PASSWORD || "dev-root-password";
// Host mongo untuk koneksi — URI di-generate di sini (key MONGODB_URI tidak ada).
// Docker memakai host "mongodb" (service name) lewat env compose; .env untuk run native.
const mongoHost = process.env.MONGODB_HOST || "127.0.0.1";

if (typeof db !== "undefined") {
  // ── Mode mongosh (docker) ──
  const appDbRef = db.getSiblingDB(appDb);
  if (appDbRef.getUser(appUsername)) {
    log(`ℹ️  User '${appUsername}' already exists on '${appDb}', skipping`);
  } else {
    appDbRef.createUser({
      user: appUsername,
      pwd: appPassword,
      roles: [{ role: "dbOwner", db: appDb }],
    });
    log(`✅ Created user '${appUsername}' on '${appDb}'`);
  }
} else {
  // ── Mode Node (npm run dev) ──
  (async () => {
    const mongoose = require("mongoose");
    const uri = `mongodb://${encodeURIComponent(rootUser)}:${encodeURIComponent(rootPass)}@${mongoHost}:27017/${appDb}?authSource=admin`;
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      const dbRef = mongoose.connection.useDb(appDb);
      const info = await dbRef.db.command({ usersInfo: { user: appUsername, db: appDb } });
      if (info.users && info.users.length > 0) {
        log(`ℹ️  User '${appUsername}' already exists on '${appDb}', skipping`);
      } else {
        await dbRef.db.command({
          createUser: appUsername,
          pwd: appPassword,
          roles: [{ role: "dbOwner", db: appDb }],
        });
        log(`✅ Created user '${appUsername}' on '${appDb}'`);
      }
    } catch (e) {
      log(`❌ mongo-init.js gagal: ${e.message}`);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}
