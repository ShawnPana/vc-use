# Contributing to VC Use

Thank you for your interest in contributing to VC Use! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vc-use.git
   cd vc-use
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ShawnPana/vc-use.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Convex account (free at [convex.dev](https://convex.dev))
- ngrok (for backend tunneling during development)

### Frontend Setup (frontend/)

```bash
cd frontend
npm install
npx convex dev  # First time setup
npm run dev     # Run development server
```

See [frontend/README.md](frontend/README.md) for detailed frontend documentation.

### Backend Setup (backend/)

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

For exposing the backend to Convex functions:
```bash
ngrok http 8000
# Update BACKEND_API_URL in Convex environment with the ngrok URL
```

See [backend/README.md](backend/README.md) for detailed backend documentation.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/OWNER/vc-use/issues)
2. If not, create a new issue using the **Bug Report** template
3. Provide detailed information:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version, Python version)

### Suggesting Features

1. Check [Issues](https://github.com/OWNER/vc-use/issues) and [Discussions](https://github.com/OWNER/vc-use/discussions) for existing suggestions
2. Create a new issue using the **Feature Request** template
3. Clearly describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative approaches you've considered

### Contributing Code

1. **Find or create an issue** describing what you want to work on
2. **Comment on the issue** to let others know you're working on it
3. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following our [coding standards](#coding-standards)
5. **Test your changes** thoroughly
6. **Commit your changes** with clear commit messages:
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request** using our PR template

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Ensure all tests pass** and linting is clean:
   ```bash
   # Frontend
   cd frontend
   npm run lint
   npm run build

   # Backend
   cd backend
   # Run your tests (add test commands as needed)
   ```
3. **Update the README** or relevant docs if needed
4. **Fill out the PR template** completely
5. **Link related issues** using "Closes #123" or "Fixes #456"
6. **Request review** from maintainers
7. **Address review feedback** promptly
8. **Squash commits** if requested before merge

### PR Guidelines

- ✅ One feature/fix per PR (keep PRs focused)
- ✅ Write clear, descriptive PR titles
- ✅ Include screenshots for UI changes
- ✅ Update tests if applicable
- ✅ Keep PRs reasonably sized (< 500 lines when possible)
- ❌ Don't include unrelated changes
- ❌ Don't push directly to `main`
- ❌ Don't commit API keys or sensitive data

## Coding Standards

### General

- Write clean, readable, self-documenting code
- Add comments for complex logic
- Follow existing code style and patterns
- Keep functions small and focused
- Use meaningful variable and function names

### Frontend (TypeScript/React)

- Follow TypeScript best practices
- Use functional components and hooks
- Run linter before committing: `npm run lint`
- Use CSS modules or styled-components for styling
- Keep components under 300 lines
- Export types from appropriate type files
- Use proper TypeScript types (avoid `any`)

### Backend (Python)

- Follow PEP 8 style guide
- Use type hints for function parameters and returns
- Document functions with docstrings
- Keep functions under 50 lines
- Use meaningful variable names
- Handle errors appropriately
- Use async/await for I/O operations

### Convex (Database)

- Document schema changes in PR description
- Add indexes for frequently queried fields
- Keep queries optimized
- Use proper validation with `v` validators
- Follow Convex best practices for actions and mutations

### Agent System

- Keep agent prompts clear and focused
- Test agent responses thoroughly
- Document any changes to agent behavior
- Ensure agent names and IDs are consistent

### Git Commit Messages

Follow this format:
```
Type: Brief summary (50 chars or less)

Detailed explanation if needed (wrap at 72 chars).
Include motivation for the change and contrast with
previous behavior.

Closes #123
```

**Types:**
- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Enhancement to existing feature
- `Refactor:` Code restructuring without behavior change
- `Docs:` Documentation changes
- `Style:` Formatting, missing semicolons, etc.
- `Test:` Adding or updating tests
- `Chore:` Maintenance tasks, dependencies

## Project Structure

```
vc-use/
├── frontend/           # React/TypeScript frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── App.tsx    # Main application component
│   │   └── ...
│   ├── convex/        # Convex backend functions
│   │   ├── actions.ts # Server actions
│   │   ├── queries.ts # Database queries
│   │   ├── mutations.ts # Database mutations
│   │   └── schema.ts  # Database schema
│   └── ...
├── backend/           # Python backend for web scraping
│   ├── api.py        # FastAPI application
│   ├── scrapers/     # Web scraping modules
│   └── requirements.txt
└── README.md
```

## Environment Variables

### Frontend (Convex)
- `BACKEND_API_URL`: URL to Python backend
- `BACKEND_API_KEY`: API key for backend authentication
- `CEREBRAS_API_KEY`: Cerebras API key for AI analysis

### Backend
- See `.env.example` in backend directory

## Questions?

- Open a [Discussion](https://github.com/OWNER/vc-use/discussions)
- Comment on relevant issues
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to VC Use! 🚀
