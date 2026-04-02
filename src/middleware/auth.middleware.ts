import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import type { Role, Status } from "@prisma/client";
import type { RequestHandler } from "express";
import { ApiError } from "../utils/apiError";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  status: Status;
};

type JwtPayload = {
  sub: string;
  // Keeping role in token allows faster authorization. Status checks are enforced against DB.
  role: Role;
  email: string;
  // iat/exp are included by jsonwebtoken automatically.
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return next(new ApiError({ statusCode: 401, code: "unauthorized", message: "Missing Bearer token" }));
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as JwtPayload;
  } catch {
    return next(new ApiError({ statusCode: 401, code: "unauthorized", message: "Invalid or expired token" }));
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, status: true },
  });

  if (!user) {
    return next(new ApiError({ statusCode: 401, code: "unauthorized", message: "User not found" }));
  }

  if (user.status !== "ACTIVE") {
    return next(new ApiError({ statusCode: 401, code: "unauthorized", message: "User is inactive" }));
  }

  req.user = user;
  return next();
};

