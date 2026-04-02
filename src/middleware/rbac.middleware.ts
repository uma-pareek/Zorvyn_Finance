import type { Role } from "@prisma/client";
import type { Request, RequestHandler } from "express";
import { ApiError } from "../utils/apiError";

export type Permission =
  | "records:read"
  | "records:write"
  | "records:delete"
  | "dashboard:read"
  | "insights:read"
  | "users:manage"
  | "*";

const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  VIEWER: new Set<Permission>(["records:read", "dashboard:read"]),
  ANALYST: new Set<Permission>(["records:read", "dashboard:read", "insights:read"]),
  ADMIN: new Set<Permission>(["records:read", "records:write", "records:delete", "dashboard:read", "insights:read", "users:manage", "*"]),
};

export function roleHasPermission(role: Role, permission: Permission) {
  const perms = ROLE_PERMISSIONS[role];
  return perms.has("*") || perms.has(permission);
}

declare module "express-serve-static-core" {
  // no-op: keep TypeScript happy if needed by express types
}

export function authorize(permission: Exclude<Permission, "*">): RequestHandler {
  return (req: Request, _res, next) => {
    if (!req.user) {
      return next(new ApiError({ statusCode: 401, code: "unauthorized", message: "Not authenticated" }));
    }
    const allowed = roleHasPermission(req.user.role, permission);
    if (!allowed) {
      return next(new ApiError({ statusCode: 403, code: "forbidden", message: "Insufficient permissions" }));
    }
    return next();
  };
}

