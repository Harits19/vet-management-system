// Menjamin user aplikasi (MONGO_APP_USERNAME) ada di MongoDB — idempotent.
// Dual-mode:
//  - mongosh (docker-entrypoint-initdb.d → otomatis jalan di volume mongo baru)
//  - Node   (npm run dev → predev: node mongo-init.js)
const log = typeof print !== "undefined" ? print : console.log;

const appDb = "vet-management";
const appUsername = process.env.MONGO_APP_USERNAME;
const appPassword = process.env.MONGO_APP_PASSWORD;

if (!appUsername || !appPassword) {
  log("⚠️  MONGO_APP_USERNAME/MONGO_APP_PASSWORD not set — skipping app user creation");
} else if (typeof db !== "undefined") {
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
    const fs = require("node:fs");
    const path = require("node:path");
    // Baca kredensial root dari .env root project (kalau belum ada di env)
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && process.env[m[1]] === undefined) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      }
    }
    const mongoose = require("mongoose");
    const rootUser = process.env.MONGO_INITDB_ROOT_USERNAME || "root";
    const rootPass = process.env.MONGO_INITDB_ROOT_PASSWORD || "dev-root-password";
    const uri = `mongodb://${encodeURIComponent(rootUser)}:${encodeURIComponent(rootPass)}@127.0.0.1:27017/${appDb}?authSource=admin`;
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
