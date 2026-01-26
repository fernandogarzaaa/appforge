🚀 Base44 Superior Clone: AI-Driven Causal Inference & RBAC
A high-performance observability and incident response platform that goes beyond correlation to identify causality. This system leverages automated causal discovery to pinpoint root causes in complex distributed systems.

✨ Key Features
🧠 Causal Inference Engine
Directed Acyclic Graphs (DAG): Visualizes the flow of causality between system metrics.

Automated Root Cause Analysis: Filters relationships with a strength threshold (e.g., >70%) to eliminate noise.

Inference Methods: Supports multiple discovery algorithms including PC-Algorithm and LiNGAM.

🛡️ Enterprise-Grade RBAC
Granular Permissions: Full Role-Based Access Control (RBAC) implementation.

Dynamic Role Management: Interface for assigning Admin, Editor, and Viewer roles with real-time permission updates.

Security First: Integrated with @base44/sdk for secure entity management.

📊 Advanced Observability
Real-time Monitoring: Tracking anomalies and metric shifts.

Business Impact Analysis: Translates technical failures into business cost metrics.

🛠️ Tech Stack
Frontend: React 18, Vite, Tailwind CSS

State Management: TanStack Query (React Query) v5

UI Components: Shadcn/UI, Radix UI, Lucide React

Backend Integration: Base44 SDK

🚀 Getting Started
Prerequisites
Node.js (v18 or higher)

npm or pnpm

Installation
Clone the repository:

Bash
git clone https://github.com/your-username/base44-superior-clone.git
Install dependencies:

Bash
npm install
Start the development server:

Bash
npm run dev
📁 Project Structure
Plaintext
src/
├── api/             # Base44 client configuration
├── components/      
│   ├── anomalies/   # CausalInferenceViewer and monitoring tools
│   ├── rbac/        # Role selectors and permission dialogs
│   └── ui/          # Reusable Shadcn components
├── functions/       # Business logic & permission mapping
└── pages/           # Main views (Role Management, Dashboards)
📜 License
Distributed under the MIT License. See LICENSE for more information.
