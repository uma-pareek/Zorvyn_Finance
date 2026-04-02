import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/apiError";
import { formatZodError } from "../utils/zod";

// Centralized error mapping to stable API format.
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details ?? undefined,
    });
  }

  if (err instanceof ZodError) {
    const payload = formatZodError(err);
    return res.status(400).json({
      code: "bad_request",
      ...payload,
    });
  }

  // eslint-disable-next-line no-console
  console.error("[error]", err);

  return res.status(500).json({
    code: "internal_server_error",
    message: "Internal server error",
  });
}

