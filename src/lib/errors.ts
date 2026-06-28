import { toast } from "sonner";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Friendly mapping for the most common Supabase / network errors.
 * Falls back to the raw message, then a generic copy.
 */
export function friendlyErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!err) return fallback;

  // Supabase / Postgrest shape
  const e = err as Partial<PostgrestError> & { message?: string; code?: string; status?: number; name?: string };

  // Network / fetch
  if (e?.name === "TypeError" && /fetch|network/i.test(e?.message ?? "")) {
    return "Network error — please check your connection and try again.";
  }
  if (e?.message === "Failed to fetch") {
    return "Can't reach the server. Check your connection and try again.";
  }

  // Auth errors
  const msg = (e?.message ?? "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (msg.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (msg.includes("user already registered")) return "An account with this email already exists.";
  if (msg.includes("rate limit") || msg.includes("too many requests")) return "Too many attempts — please wait a moment and try again.";

  // Postgres / RLS
  if (e?.code === "42501" || msg.includes("permission denied")) return "You don't have permission to perform this action.";
  if (e?.code === "23505" || msg.includes("duplicate key")) return "That value already exists. Please use a different one.";
  if (e?.code === "23503" || msg.includes("foreign key")) return "Can't complete the action — a related record is missing.";
  if (e?.code === "23502" || msg.includes("null value")) return "A required field is missing.";
  if (e?.code === "PGRST116") return "No matching record was found.";
  if (msg.includes("row-level security") || msg.includes("violates row-level")) {
    return "You don't have permission to save these changes.";
  }

  // HTTP status fallbacks
  if (e?.status === 401) return "You need to sign in to continue.";
  if (e?.status === 403) return "You don't have access to this resource.";
  if (e?.status === 404) return "The requested item could not be found.";
  if (e?.status && e.status >= 500) return "Server error — please try again shortly.";

  if (e?.message) return e.message;
  if (typeof err === "string") return err;
  return fallback;
}

/** Toast + console.error helper. */
export function reportError(err: unknown, opts?: { title?: string; fallback?: string }) {
  const message = friendlyErrorMessage(err, opts?.fallback);
  // eslint-disable-next-line no-console
  console.error(opts?.title ?? "Error:", err);
  toast.error(opts?.title ?? "Something went wrong", { description: message });
  return message;
}

/**
 * Wrap any async operation in a try/catch with a toast on failure.
 * Returns the result or `undefined` on error.
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  opts?: { title?: string; fallback?: string },
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    reportError(err, opts);
    return undefined;
  }
}
