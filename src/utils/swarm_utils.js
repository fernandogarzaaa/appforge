// swarm_utils.ts
export default class SwarmUtils {
    static add(a, b) {
        return a + b;
    }
    static subtract(a, b) {
        return a - b;
    }
    static multiply(a, b) {
        return a * b;
    }
    static divide(a, b) {
        if (b === 0) {
            throw new Error('Cannot divide by zero');
        }
        return a / b;
    }
    static calculatePercentage(part, whole) {
        if (whole === 0) {
            throw new Error('Whole cannot be zero');
        }
        return (part / whole) * 100;
    }
    static formatBytes(bytes) {
        const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
        let unitIndex = 0;
        while (bytes >= 1024) {
            bytes /= 1024;
            unitIndex++;
        }
        return `${bytes.toFixed(2)} ${units[unitIndex]}`;
    }
}
