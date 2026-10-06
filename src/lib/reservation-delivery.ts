// The Pappare VPS cannot connect to api.telegram.org. Its existing Vercel
// deployment is the delivery service; Vercel must always send directly.
export const DEFAULT_RESERVATION_RELAY = "https://pappare.vercel.app/api/reservations";

export function reservationRelayUrl(env: NodeJS.ProcessEnv = process.env) {
  if (env.VERCEL === "1") return undefined;
  const configured = env.RESERVATION_RELAY_URL?.trim();
  if (configured === "direct") return undefined;
  return configured || (env.NODE_ENV === "production" ? DEFAULT_RESERVATION_RELAY : undefined);
}

export function deliveryErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return "DELIVERY_FAILED";
  const cause = error.cause as { code?: unknown } | undefined;
  // Do not log fetch URLs, request bodies or bot tokens.
  return typeof cause?.code === "string" ? cause.code : error.name;
}
