# Repository Guidelines

## Project Structure & Module Organization
The Vite + React frontend lives in `src/`: screens and layout in `App.tsx`, shared state in `contexts/`, helpers in `lib/`, and reusable pieces in `components/` (UI primitives stay in `components/ui`). Convex server code is under `convex/` with schema, queries, mutations, and actions alongside generated TypeScript bindings in `_generated/`. Static assets remain in `public/`, while Vite bootstraps from `index.html`. Use the `@/` path alias defined in `tsconfig.app.json` when importing across feature areas.

## Build, Test, and Development Commands
- `npm run dev` – launches Vite on http://localhost:5173 and Convex in watch mode.
- `npm run build` – runs `tsc -b` for type-checking and emits the production bundle in `dist/`.
- `npm run preview` – serves the built bundle to mirror deployment behavior.
- `npm run lint` – executes TypeScript and ESLint with React Hooks and Refresh plugins; resolve findings before pushing.
- `npx convex deploy` – publishes Convex functions once changes are ready for staging or prod.

## Coding Style & Naming Conventions
Write idiomatic TypeScript with strict compiler settings and function components. Follow 2-space indentation, PascalCase for React components, camelCase for utilities, and ALL_CAPS for constants. Import shared code through `@/` instead of deep relative paths, and rely on editor-formatting (Prettier defaults) rather than disabling lint rules.

## Testing Guidelines
Automated tests are not yet configured, so treat `npm run lint`, manual UI verification, and checking Convex logs as mandatory for every change. When you introduce tests, prefer Vitest with React Testing Library, store specs in `src/__tests__/` or next to the component (`*.test.tsx`), and name suites after the unit under test. Document uncovered edge cases in the PR until coverage tooling is added.

## Commit & Pull Request Guidelines
Commits in history use short, lower-case summaries (e.g., `barebones frontend`); keep that style, write imperative headlines under 72 characters, and add bodies for context when touching backend data or multiple areas. Each PR should explain scope, list environment or schema updates, link related issues, and include screenshots or output for UI changes. Confirm the build and lint commands before requesting review.

## Security & Configuration Tips
Keep secrets in `.env.local` for Vite and manage Convex keys via `npx convex env set`; never commit real credentials. Document new environment variables in README updates and rotate keys immediately if exposure occurs. Treat schema updates in `convex/` as breaking changes and communicate them before deployment.
