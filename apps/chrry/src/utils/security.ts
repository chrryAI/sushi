/**
 * Safely stringifies a JSON object to be used in HTML contexts (e.g. <script> tags).
 * Escapes < characters to prevent XSS attacks via </script> injection.
 */
export function safeJSONStringify(value: any): string {
  return (JSON.stringify(value) ?? "null").replace(/</g, "\\u003c")
}
