/**
 * Evaluates whether a step or phase should be shown based on founder_profile.
 *
 * Supports:
 * - Simple equality: {"field": "value"}
 * - Not equal: {"field": {"$ne": "value"}}
 * - In array: {"field": {"$in": ["a", "b"]}}
 * - Multiple conditions (AND): {"field1": "a", "field2": "b"}
 */

export type ConditionValue =
  | string
  | number
  | boolean
  | { $ne: string | number | boolean }
  | { $in: (string | number | boolean)[] };

export type ConditionJson = Record<string, ConditionValue>;

export function evaluateCondition(
  condition: Record<string, unknown> | null | undefined,
  profile: Record<string, unknown>
): boolean {
  if (!condition || Object.keys(condition).length === 0) return true;

  for (const [field, expected] of Object.entries(condition)) {
    const actual = profile[field];

    if (expected !== null && typeof expected === "object") {
      const exp = expected as Record<string, unknown>;
      if ("$ne" in exp) {
        if (actual === exp.$ne) return false;
      } else if ("$in" in exp) {
        if (!(exp.$in as unknown[]).includes(actual)) return false;
      }
    } else {
      if (actual !== expected) return false;
    }
  }

  return true;
}
