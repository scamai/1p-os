/**
 * Merges founder_profile + user data into template fill fields.
 * Used client-side to preview filled template data.
 */

interface FillContext {
  profile: Record<string, unknown>;
  userName: string;
  userEmail: string;
}

export function fillTemplate(
  fillFields: Record<string, string>,
  context: FillContext
): Record<string, string> {
  const filled: Record<string, string> = {};

  for (const [field, source] of Object.entries(fillFields)) {
    if (source === "NOW") {
      filled[field] = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (source.startsWith("founder_profiles.")) {
      const key = source.replace("founder_profiles.", "");
      filled[field] = String(context.profile[key] ?? "________");
    } else if (source.startsWith("users.")) {
      const key = source.replace("users.", "");
      if (key === "full_name") filled[field] = context.userName || "________";
      else if (key === "email") filled[field] = context.userEmail || "________";
      else filled[field] = "________";
    } else {
      filled[field] = source;
    }
  }

  return filled;
}
