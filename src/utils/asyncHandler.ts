import type { RequestHandler } from "express";

// Small helper to avoid repeating try/catch in async route handlers.
export function asyncHandler(fn: RequestHandler) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

