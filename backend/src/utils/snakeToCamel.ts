/**
 * Utility to recursively convert all snake_case object keys to camelCase.
 * Used by the global response transform middleware.
 * 
 * Rules:
 * - `display_name` → `displayName`
 * - `view_count` → `viewCount`
 * - Keys already in camelCase are kept as-is (idempotent)
 * - Keys starting with `_` (like `_count`) are preserved but their values are recursed
 * - Arrays are recursed element by element
 * - null/undefined/primitives pass through unchanged
 * - Date objects are kept as-is (Express serializes to ISO strings)
 */

/**
 * Convert a single snake_case string to camelCase
 */
function toCamelCase(str: string): string {
  // Preserve keys starting with underscore (like _count)
  if (str.startsWith('_')) {
    // Still convert the rest: _some_key → _someKey
    const rest = str.slice(1);
    return '_' + rest.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively transform all keys in an object from snake_case to camelCase
 */
export function snakeToCamelObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Primitives (string, number, boolean)
  if (typeof obj !== 'object') {
    return obj;
  }

  // Date objects - keep as-is
  if (obj instanceof Date) {
    return obj;
  }

  // Arrays - recurse each element
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamelObject(item));
  }

  // Objects - transform keys and recurse values
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = snakeToCamelObject(obj[key]);
  }
  return result;
}

export default snakeToCamelObject;
