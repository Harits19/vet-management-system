import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel, UserRole } from "../models/user.model";
import { CookieModel } from "src/models/cookie.model";
import { ICookie } from "../../../shared/types/auth.type";
import env from "src/config/env.config";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";


const getHashPassword = async (value: string) => {

  return await bcrypt.hash(value, 10);
}

const seedSuperAdmin = async () => {
  const count = await UserModel.countDocuments();

  if (count === 0) {

    const defaultConfig = await getDefaultUserConfig();

    await UserModel.create({
      name: "Super Admin",
      ...defaultConfig,
      role: UserRole.SUPERADMIN,
    });

    console.log("✅ Superadmin created: admin@vet.com / admin123");
  }
};

const getDefaultUserConfig = async () => {

  console.log('get default user config')

  console.log('default user email', env.DEFAULT_USER_EMAIL);
  console.log('default user password', env.DEFAULT_USER_PASSWORD);

  const result = {
    email: env.DEFAULT_USER_EMAIL,
    password: await getHashPassword(env.DEFAULT_USER_PASSWORD),
  }

  console.log('generate default config', JSON.stringify(result, null, 2));

  return result;
}

const login = async (username: string, password: string) => {
  const user = await UserModel.findOne({ username });

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
      username: user.username,
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
    username: user.username,
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

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, ".");
}

async function generateUniqueUsername(
  name: string,
): Promise<string> {
  const baseUsername = slugifyName(name);
  console.log('baseUsername', baseUsername);

  // cari username yang mirip
  const existingUsers = await UserModel.find({
    username: new RegExp(`^${baseUsername}[0-9]*$`, "i"),
  })
    .select("username")
    .lean();

  console.log('existingUsers', existingUsers.length);

  if (existingUsers.length === 0) {

    return baseUsername;
  }

  const existingUsernames = new Set(
    existingUsers.map((u) => u.username.toLowerCase())
  );

  // username pertama
  if (!existingUsernames.has(baseUsername)) {
    return baseUsername;
  }

  // cari increment berikutnya
  let counter = 1;

  while (existingUsernames.has(`${baseUsername}${counter}`)) {
    counter++;
  }

  return `${baseUsername}${counter}`;
}


export default {
  getCookie, saveCookie, getCurrentUser, login, seedSuperAdmin, getDefaultUserConfig, generateUniqueUsername

}


