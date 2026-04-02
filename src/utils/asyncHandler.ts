import type { NextFunction, Request, Response, RequestHandler } from "express";

// Small helper to avoid repeating try/catch in async route handlers.
export function asyncHandler(fn: RequestHandler) {
  return function wrapped(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

