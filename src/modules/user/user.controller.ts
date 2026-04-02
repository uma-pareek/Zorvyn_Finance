import { z } from "zod";
import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { login as loginService, createUser as createUserService, updateUserRole as updateUserRoleService, updateUserStatus as updateUserStatusService } from "./user.service";
import { parseOrApiError } from "../../utils/zod";

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const CreateUserBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const RoleChangeBodySchema = z.object({
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]),
});

const StatusChangeBodySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const userController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrApiError(LoginBodySchema, req.body);
    const result = await loginService(body);
    return res.status(200).json(result);
  }),

  createUser: asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrApiError(CreateUserBodySchema, req.body);
    const created = await createUserService(body);
    return res.status(201).json(created);
  }),

  changeRole: asyncHandler(async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = parseOrApiError(RoleChangeBodySchema, req.body);
    const updated = await updateUserRoleService(userId, body);
    return res.status(200).json(updated);
  }),

  changeStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = parseOrApiError(StatusChangeBodySchema, req.body);
    const updated = await updateUserStatusService(userId, body);
    return res.status(200).json(updated);
  }),

  activate: asyncHandler(async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await updateUserStatusService(userId, { status: "ACTIVE" });
    return res.status(200).json(updated);
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await updateUserStatusService(userId, { status: "INACTIVE" });
    return res.status(200).json(updated);
  }),
};

