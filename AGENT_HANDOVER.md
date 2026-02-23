# AppForge Technical Handover Document

Welcome. This document outlines the engineering reality of the AppForge project, its core architecture, and the immediate structural priorities required before scaling or enabling live external mutations.

## 1. System Identity & Architecture
AppForge is an **evolutionary reasoning research system** featuring multi-strategy search, deterministic benchmarking, and CI-gated mutation selection.
- **Core Engine**: A centralized execution loop orchestrating modular agents (currently facing significant coupling issues in `singularity_engine.ts`).
- **External Integrations**: Hooks exist for Jupiter, Binance, Twitter, and YouTube, all currently restricted to **Simulation Mode**. Enabling live execution is strictly prohibited until core stability invariants are proven.
- **Frontend Layer**: React/TypeScript, Radix UI components, React Query state management, backed by a local mock client for offline resilience.

## 2. Current Engineering Reality (Audit Snapshot: 2026-02-23)
The system is currently pre-stability and carries significant technical and security debt.

- **Type Safety**: **1,251 TypeScript Errors**. The system lacks reliable type bounds, making automated refactoring and evolutionary mutations unsafe and unpredictable.
- **Security Posture**: **20 npm Vulnerabilities (3 High, 17 Moderate)**. Critical dependencies (`bigint-buffer`, `bn.js`, `quill`) are exposed.
- **Structural Integrity**: Heavy centralization. The core execution engine (`singularity_engine.ts`) is highly convoluted (28,000 equivalent LOC weight) with circular dependencies and mixed concerns.

## 3. IMMEDATE PRIORITIES (Do Not Deviate)

Your mandate is to stabilize the fundamentals. Do not pursue live automated trading, autonomous PR generation, or capability expansion until these invariants hold.

### Priority 1: TypeScript Zero Initiative
- **Goal**: Drive 1,251 TS errors to 0.
- **Why**: You cannot build deterministic research on a broken type system. Fix mock environments, legacy API definitions, and strict UI component typings.

### Priority 2: Security Hardening
- **Goal**: Resolve all high and moderate supply chain vulnerabilities.
- **Why**: Foundational security is a prerequisite for any system interacting with verifiable execution or capital. Apply `npm audit fix --force` selectively or update packages manually, then stabilize the lockfile.

### Priority 3: Modularize the Core (Kill the God File)
- **Goal**: Deconstruct `singularity_engine.ts`.
- **Why**: The monolithic nature of the core engine prevents safe mutation. Break it down into strictly bounded modules (e.g., `evolutionPolicy.ts`, `signalProcessor.ts`, `invariantEnforcer.ts`) with a maximum of 800-1200 LOC per module and clear interfaces.

### Priority 4: Formalize System Invariants
- **Goal**: Replace legacy abstracted terminology (formerly referred to as "Quantum" or "Resonance" logic) with formal, measurable computational constructs (e.g., weighted multi-signal consensus functions). 
- **Why**: Serious engineering systems require precise, boring naming and ruthless mathematical clarity.

---

*Proceed with discipline. Demonstrate measurable delta in stability.*
