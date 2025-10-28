export function formatConsoleLog(...args: any[]): string {
  return args.map(arg => {
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2); // Pretty-print objects
      } catch (error) {
        return "[Circular Object]"; // Handle circular references
      }
    }
    return String(arg); // Convert everything else to a string
  }).join(" ");
}