import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function createToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "devsecret",
    { expiresIn: "7d" }
  );
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function hashPin(pin) {
  return bcrypt.hash(pin, 10);
}

export async function comparePin(pin, hash) {
  return bcrypt.compare(pin, hash);
}

export function getAuthUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET || "devsecret");
  } catch (error) {
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const userPayload = getAuthUser(req);
  if (!userPayload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userPayload.sub }
  });

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = user;
  next();
}
