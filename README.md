# ⚡ AppForge - Autonomous Agentic Software Platform

AppForge is a production-ready, full-stack application platform designed for **Autonomous Software Operations**. It implements an agentic architecture where specialized AI swarms manage the lifecycle of the product—from feature development and security auditing to self-healing CI/CD pipelines.

---

## 🏗️ Core Architecture: The Sovereign Agentic Cycle

Unlike traditional boilerplates, AppForge is built on a **Sovereign Kernel** that maintains a persistent state across local development and cloud environments.

1. **Observability**: Continuous monitoring of system integrity and performance metrics.
2. **Reasoning**: Autonomous Decision Agents (Oracles) analyze logs, build states, and user requirements.
3. **Action**: Specialized Swarms (e.g., God-Mode, Sentinel) execute patches, refactors, and feature builds.
4. **Verification**: Self-healing test suites and autonomous QA loops validate all mutations before production delivery.

---

## 🛠️ Tech Stack

### Core Engine
- **Sovereign Kernel**: Rust-based logic layer for maximum execution security.
- **Agent Orchestration**: Node.js/TypeScript background daemons managed via `pm2`.
- **Inference Layer**: Integrated support for Gemini 2.0, Claude 3.5, and local LLMs via OpenAI-compatible endpoints.

### Frontend
- **React 18 + Vite 6**: High-performance, modern web foundation.
- **TailwindCSS + Radix UI**: Enterprise-grade design system with premium aesthetics.
- **TanStack Query**: Robust server-state management.

### Infrastructure
- **Base44 Functions**: Serverless logic execution.
- **Upstash Redis**: Global persistent state layer for Swarm synchronization.
- **GitHub Actions**: Integrated self-healing CI/CD workflows.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **Git**
- **Sovereign Auth**: Configure your `UPSTASH_REDIS_REST_URL` and `GH_TOKEN` in `.env`.

### Installation
```bash
git clone <repository-url>
cd appforge-main
npm install
```

### Development
```bash
# Start the web interface
npm run dev

# Start the local Swarm daemon
npm run swarm:daemon
```

---

## 🛡️ Reality Alignment & Professionalism

This repository adheres to the **Product-First Alignment Protocol**:
- **0% Jargon**: We prioritize technical clarity over abstract marketing terms.
- **80/20 Rule**: 80% of Swarm work must focus on user-facing features or critical engineering stability.
- **Performance Mandate**: All core routes are optimized for < 500kB initial load (utilizing React Lazy/Suspense).

---

## 📄 License
AppForge is licensed under the [Apache-2.0 License](LICENSE).
