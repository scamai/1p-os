/** Returns user ID — real or fake dev bypass ID */
export function getUserId(user: { id: string } | null): string {
  if (user) return user.id;
  if (process.env.DEV_BYPASS === "true") return "00000000-0000-0000-0000-000000000000";
  return "";
}
