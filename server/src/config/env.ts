import dotenv from "dotenv";

class Env {
  public authSecret: string;
  public apiPort: number;
  public appOrigin: string;
  public cookieName: string;
  public isProduction: boolean;
  public mongodbUri: string;
  public seedAdminEmail: string;
  public seedAdminPassword: string;

  constructor() {
    this.loadEnv();
    this.authSecret = process.env.AUTH_SECRET || "local-auth-secret";
    this.apiPort = Number(process.env.API_PORT || 4000);
    this.appOrigin = process.env.NEXT_APP_ORIGIN || "http://localhost:3002";
    this.cookieName = "vet_session";
    this.isProduction = process.env.NODE_ENV === "production";
    this.mongodbUri = process.env.MONGODB_URI || process.env.LOCAL_URL || "";
    this.seedAdminEmail = process.env.SEED_ADMIN_EMAIL || "admin@vet.local";
    this.seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

    this.validate();
  }

  private loadEnv() {
    dotenv.config({ path: ".env.local" });
    dotenv.config();
  }

  private validate() {
    if (!this.mongodbUri) {
      throw new Error("❌ MONGODB_URI atau LOCAL_URL wajib diisi.");
    }
  }
}

// singleton instance
export const serverEnv = new Env();
