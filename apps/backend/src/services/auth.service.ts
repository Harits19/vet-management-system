import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel, UserRole } from "../models/user.model";
import { CookieModel } from "src/models/cookie.model";
import { ICookie } from "../../../shared/types/auth.type";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

const seedSuperAdmin = async () => {
  const count = await UserModel.countDocuments();

  if (count === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await UserModel.create({
      name: "Super Admin",
      email: "admin@vet.com",
      password: hashedPassword,
      role: UserRole.SUPERADMIN,
    });

    console.log("✅ Superadmin created: admin@vet.com / admin123");
  }
};

const login = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  if (!user.is_active) {
    throw new Error("User is inactive");
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

type AuthPayload = {
  userId: string;
  role: UserRole;
};

const getCurrentUser = async (token?: string) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
  const user = await UserModel.findById(decoded.userId);

  if (!user || !user.is_active) {
    throw new Error("Unauthorized");
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const saveCookie = async (cookie: ICookie) => {
  await CookieModel.updateOne(
    { key: 'singleton' },
    {
      $set: cookie,
    },
    {
      upsert: true,
    },
  );
}

const getCookie = async () => {
  const cookie = await CookieModel.findOne({ key: 'singleton' }).lean();
  if (!cookie) throw new Error('Cookie not found');
  return cookie.cookie;
}


const migration = async () => {
  
}


export default {
  getCookie, saveCookie, getCurrentUser, login, seedSuperAdmin,

}


