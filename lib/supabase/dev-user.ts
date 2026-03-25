/** Returns user ID from auth user, or empty string if not authenticated */
export function getUserId(user: { id: string } | null): string {
  if (user) return user.id;
  return "";
}
