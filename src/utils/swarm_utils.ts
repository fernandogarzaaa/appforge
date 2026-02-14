Here's an example of how you can create a `swarm_utils.ts` file with some basic calculation helpers in TypeScript:

// swarm_utils.ts
export default class SwarmUtils {
  public static add(a: number, b: number): number {
    return a + b;
  }

  public static subtract(a: number, b: number): number {
    return a - b;
  }

  public static multiply(a: number, b: number): number {
    return a * b;
  }

  public static divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Cannot divide by zero');
    }
    return a / b;
  }

  public static calculatePercentage(part: number, whole: number): number {
    if (whole === 0) {
      throw new Error('Whole cannot be zero');
    }
    return (part / whole) * 100;
  }

  public static formatBytes(bytes: number): string {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;

    while (bytes >= 1024) {
      bytes /= 1024;
      unitIndex++;
    }

    return `${bytes.toFixed(2)} ${units[unitIndex]}`;
  }
}

In this file, we've defined a `SwarmUtils` class with several static methods that provide basic calculation helpers. The methods include:

- `add(a: number, b: number): number`: Returns the sum of two numbers.
- `subtract(a: number, b: number): number`: Returns the difference between two numbers.
- `multiply(a: number, b: number): number`: Returns the product of two numbers.
- `divide(a: number, b: number): number`: Returns the quotient of two numbers. It also checks if division by zero is attempted and throws an error if it is.
- `calculatePercentage(part: number, whole: number): number`: Calculates a percentage based on a part and a whole. It also checks if the whole is zero and throws an error if it is.
- `formatBytes(bytes: number): string`: Formats a given number of bytes into a human-readable format (e.g., "1 KB", "2 MB", etc.).

This utility file can be imported in your TypeScript application to perform these calculations.