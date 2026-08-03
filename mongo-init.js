// Auto-runs once on the FIRST start of a fresh MongoDB data volume
// (docker-entrypoint-initdb.d). The official mongo image auto-creates the ROOT
// user from MONGO_INITDB_ROOT_* env vars; this script adds the application user
// (MONGO_APP_USERNAME / MONGO_APP_PASSWORD) so the backend can connect with auth
// enabled. Idempotent: skips if the user already exists.

const appDb = "vet-management";
const appUsername = process.env.MONGO_APP_USERNAME;
const appPassword = process.env.MONGO_APP_PASSWORD;

if (!appUsername || !appPassword) {
  print("⚠️  MONGO_APP_USERNAME/MONGO_APP_PASSWORD not set — skipping app user creation");
} else {
  const db = db.getSiblingDB(appDb);
  if (db.getUser(appUsername)) {
    print(`ℹ️  User '${appUsername}' already exists on '${appDb}', skipping`);
  } else {
    db.createUser({
      user: appUsername,
      pwd: appPassword,
      roles: [{ role: "dbOwner", db: appDb }],
    });
    print(`✅ Created user '${appUsername}' on '${appDb}'`);
  }
}
