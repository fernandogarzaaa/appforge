# Contributing to AppForge

Thank you for your interest in contributing to AppForge! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating a bug report:

1. Check if the issue already exists
2. Use the latest version to verify the bug
3. Collect relevant information (logs, screenshots)

When creating a bug report, include:

- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or error messages

### Suggesting Features

Feature requests are welcome! Please:

1. Check if the feature has already been suggested
2. Provide a clear use case
3. Explain why this feature would be useful

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

#### PR Requirements

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions

### Commit Message Convention

We follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(swarm): add quantum consensus algorithm

fix(ci): resolve workflow loop issue

docs: update API documentation
```

## Development Setup

### Prerequisites

- Node.js 22+
- npm 9+
- Git

### Installation

```bash
git clone https://github.com/fernandogarzaaa/appforge.git
cd appforge
npm install
```

### Running Locally

```bash
# Start development server
npm run dev

# Start swarm daemon
npm run swarm:daemon

# Run tests
npm test
```

## Project Structure

```
appforge/
├── src/              # Frontend source
├── backend/          # Backend API
├── swarm/            # Swarm orchestration
├── scripts/          # Utility scripts
├── docs/             # Documentation
└── tests/            # Test suites
```

## Questions?

Feel free to open a discussion or reach out to the maintainers.

Thank you for contributing! 🚀
