import { ConvexError } from "convex/values";

export const ADMIN_MESSAGES = {
  badKey: "Neispravan ključ",
} as const;

/**
 * Svaka admin funkcija prima `key` i prvo zove ovo. Ključ živi u Convex env-u:
 *   npx convex env set ADMIN_KEY <ključ>          (dev)
 *   npx convex env set ADMIN_KEY <ključ> --prod   (produkcija)
 */
export function assertAdminKey(key: string): void {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    throw new ConvexError(ADMIN_MESSAGES.badKey);
  }
}
