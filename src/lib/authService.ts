import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import * as userRepository from "./repositories/userRepository";
import type { UserDocument } from "../models/User";
import { UserRole } from "../types/user";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error("FATAL ERROR: JWT_SECRET is missing or too short. It must be at least 32 characters long.");
}

const SALT_ROUNDS = 12;
const JWT_SECRET = new TextEncoder().encode(rawSecret);

function getPasswordPepper(): string {
  const pepperEnv = process.env.PASSWORD_PEPPER?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!pepperEnv || pepperEnv.length < 16) {
      throw new Error(
        "FATAL: PASSWORD_PEPPER must be set in production (min 16 chars), independente de JWT_SECRET."
      );
    }
    return pepperEnv;
  }
  return String(pepperEnv ?? rawSecret);
}

const JWT_ISSUER = "anon-complaint";
const JWT_AUDIENCE = "anon-complaint";
const JWT_EXPIRY = "7d";

function pepper(password: string): string {
  return password + getPasswordPepper();
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const peppered = pepper(password);
  const hash = await bcrypt.hash(peppered, salt);
  return { hash, salt };
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const peppered = pepper(password);
  return bcrypt.compare(peppered, hash);
}

export async function register(data: {
  email: string;
  username?: string;
  password: string;
  role?: import("../types/user").UserRole;
}): Promise<{ success: true; user: UserDocument } | { success: false; error: string }> {
  const existing = await userRepository.findByEmailOrUsername(data.email);
  if (existing) return { success: false, error: "Email ou username já registado" };
  if (data.username) {
    const byUsername = await userRepository.findByUsername(data.username);
    if (byUsername) return { success: false, error: "Username já em uso" };
  }
  const { hash, salt } = await hashPassword(data.password);
  const emailNorm = data.email.toLowerCase().trim();
  const verifyToken = crypto.randomBytes(24).toString("hex");
  const verifyExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  try {
    const user = await userRepository.create({
      email: emailNorm,
      username: data.username,
      password_hash: hash,
      salt,
      role: data.role,
      email_verified: false,
      email_verify_token: verifyToken,
      email_verify_expires: verifyExpires,
    });
    return { success: true, user };
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code: number }).code : undefined;
    if (code === 11000) {
      return { success: false, error: "Email ou username já registado" };
    }
    throw err;
  }
}

export async function login(emailOrUsername: string, password: string): Promise<
  | { success: true; user: UserDocument }
  | { success: false; error: string }
> {
  const user = await userRepository.findByEmailOrUsername(emailOrUsername);
  if (!user) return { success: false, error: "Credenciais inválidas" };
  if (user.banned_at) return { success: false, error: "Conta suspensa" };
  if (user.deleted_at) return { success: false, error: "Conta não disponível" };
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return { success: false, error: "Credenciais inválidas" };
  return { success: true, user };
}

export async function generateJWT(userId: string, role: string = UserRole.USER): Promise<string> {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    const role = typeof payload.role === "string" ? payload.role : UserRole.USER;
    return { userId: sub, role };
  } catch {
    return null;
  }
}

export async function verifyCurrentPassword(userId: string, password: string): Promise<boolean> {
  const user = await userRepository.findUserById(userId);
  if (!user) return false;
  return verifyPassword(password, user.password_hash);
}

export async function updateUsername(
  userId: string,
  newUsername: string,
  profileImage?: string | null,
  extras?: {
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    public_profile_enabled?: boolean;
  }
): Promise<{ success: true; user: UserDocument } | { success: false; error: string }> {
  const trimmed = newUsername.trim();
  if (!trimmed) return { success: false, error: "Username obrigatório" };
  const existing = await userRepository.findByUsername(trimmed);
  if (existing && String(existing._id) !== userId) return { success: false, error: "Username já em uso" };
  const user = await userRepository.updateById(userId, {
    username: trimmed,
    ...(profileImage !== undefined ? { profile_image: profileImage } : {}),
    ...(extras?.bio !== undefined ? { bio: extras.bio } : {}),
    ...(extras?.location !== undefined ? { location: extras.location } : {}),
    ...(extras?.website !== undefined ? { website: extras.website } : {}),
    ...(extras?.public_profile_enabled !== undefined
      ? { public_profile_enabled: extras.public_profile_enabled }
      : {}),
  });
  if (!user) return { success: false, error: "Utilizador não encontrado" };
  return { success: true, user };
}

export async function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const ok = await verifyCurrentPassword(userId, currentPassword);
  if (!ok) return { success: false, error: "Password atual incorreta" };
  const { hash, salt } = await hashPassword(newPassword);
  const user = await userRepository.updateById(userId, { password_hash: hash, salt });
  if (!user) return { success: false, error: "Utilizador não encontrado" };
  return { success: true };
}

export async function updateRoleToCompany(
  userId: string
): Promise<{ success: true; user: UserDocument } | { success: false; error: string }> {
  const user = await userRepository.updateById(userId, { role: UserRole.COMPANY });
  if (!user) return { success: false, error: "Não foi possível atualizar o perfil" };
  return { success: true, user };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await userRepository.findByPasswordResetToken(token.trim());
  if (!user) return { success: false, error: "Token inválido ou expirado." };
  const { hash, salt } = await hashPassword(newPassword);
  await userRepository.updateById(String(user._id), {
    password_hash: hash,
    salt,
    password_reset_token: null,
    password_reset_expires: null,
  });
  return { success: true };
}

export async function confirmUserEmailWithToken(
  token: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await userRepository.findByEmailVerifyToken(token.trim());
  if (!user) return { success: false, error: "Token inválido ou expirado." };
  await userRepository.updateById(String(user._id), {
    email_verified: true,
    email_verify_token: null,
    email_verify_expires: null,
  });
  return { success: true };
}