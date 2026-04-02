import { ZodError, type ZodSchema } from "zod";
import { ApiError } from "./apiError";

export function formatZodError(err: ZodError) {
  // Keep output stable and readable for API clients.
  const details = err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return {
    message: "Invalid request payload",
    details,
  };
}

// Centralized validation helper so controllers don't need to format Zod errors.
export function parseOrApiError<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new ApiError({
    statusCode: 400,
    code: "bad_request",
    message: "Invalid request payload",
    details: formatZodError(result.error).details,
  });
}

