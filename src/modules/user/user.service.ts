import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";

const RoleEnum = z.enum(["VIEWER", "ANALYST", "ADMIN"]);
const StatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export type CreateUserInput = {
  email: string;
  password: string;
  role?: z.infer<typeof RoleEnum>;
  status?: z.infer<typeof StatusEnum>;
};

export type UpdateRoleInput = { role: z.infer<typeof RoleEnum> };
export type UpdateStatusInput = { status: z.infer<typeof StatusEnum> };

export type LoginInput = { email: string; password: string };

export async function createUser(input: CreateUserInput) {
  const { email, password } = input;
  const role = input.role ?? "VIEWER";
  const status = input.status ?? "ACTIVE";

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new ApiError({ statusCode: 400, code: "email_already_exists", message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: role as any,
      status: status as any,
    },
    select: { id: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
  });

  return user;
}

export async function updateUserRole(userId: string, input: UpdateRoleInput) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new ApiError({ statusCode: 404, code: "user_not_found", message: "User not found" });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: input.role as any },
    select: { id: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
  });

  return updated;
}

export async function updateUserStatus(userId: string, input: UpdateStatusInput) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new ApiError({ statusCode: 404, code: "user_not_found", message: "User not found" });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: input.status as any },
    select: { id: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
  });

  return updated;
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true, email: true, role: true, status: true, passwordHash: true } });
  if (!user) {
    throw new ApiError({ statusCode: 401, code: "invalid_credentials", message: "Invalid email or password" });
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new ApiError({ statusCode: 401, code: "invalid_credentials", message: "Invalid email or password" });
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError({ statusCode: 401, code: "user_inactive", message: "User is inactive" });
  }

  const token = jwt.sign(
    {
      // jwt library sets iat/exp; payload here is for requireAuth.
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: "7d",
    }
  );

  return { token };
}

