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