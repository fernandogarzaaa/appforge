/**
 * Quantum-Enhanced LLM Type Definitions
 * Core types for quantum-classical hybrid language model processing.
 */
// ─── Math Helpers ─────────────────────────────────────────────────────
/** Compute |z|² for a complex number */
export function complexMagnitudeSq(z) {
    return z.real * z.real + z.imaginary * z.imaginary;
}
/** Multiply two complex numbers */
export function complexMultiply(a, b) {
    return {
        real: a.real * b.real - a.imaginary * b.imaginary,
        imaginary: a.real * b.imaginary + a.imaginary * b.real,
    };
}
/** Add two complex numbers */
export function complexAdd(a, b) {
    return {
        real: a.real + b.real,
        imaginary: a.imaginary + b.imaginary,
    };
}
/** Conjugate of a complex number */
export function complexConjugate(z) {
    return { real: z.real, imaginary: -z.imaginary };
}
/** Create a complex number from polar form */
export function complexFromPolar(magnitude, phase) {
    return {
        real: magnitude * Math.cos(phase),
        imaginary: magnitude * Math.sin(phase),
    };
}
