# Agent Instructions

## Core Tech Stack
- **Framework**: Next.js 15 (App Router).
- **Styling**: Tailwind CSS.
- **UI Components**: shadcn/ui (Radix UI primitives).
- **Icons**: Lucide React.
- **State Management**: React Context or URL-based state (TanStack Query for server state).

## Design Constraints (Minimal Dark Mode)
- **Theme**: Force Dark Mode by default.
- **Colors**: Use the "Zinc" or "Slate" palette from shadcn. 
- **Background**: `bg-background` (Pure black or very dark gray).
- **Borders**: Thin, subtle borders (`border-muted/50`).
- **Typography**: Inter or Geist Sans. Minimal font weights.

## Coding Standards
- Use **TypeScript** for all files.
- Favor **Server Components** by default.
- Use `lucide-react` for all icons.
- Ensure all components are responsive (mobile-first).

## Git Workflow & Branching
- **Feature Isolation**: Every new task or feature MUST be developed in a separate branch.
- **Naming Convention**: Use `feature/` or `fix/` prefixes (e.g., `feature/dashboard-sidebar`).
- **Standard**: Always create the branch *before* making any code changes.

## Commit Message Standard (Conventional Commits)
- **Format**: All commits must follow the pattern: `<type>: <description>`
- **Types**: 
  - `feat`: A new feature for the user.
  - `fix`: A bug fix.
  - `docs`: Documentation only changes.
  - `chore`: Updating build tasks, package manager configs, etc.
- **Example**: `feat: implement dark mode charts with shadcn`

## ⚠️ CRITICAL SAFETY RULES (HARD CONSTRAINTS)
- **NO PUSHING**: The agent is strictly FORBIDDEN from executing `git push`. 
- **ORIGIN PROTECTION**: Never interact with remote origins or GitHub. All pushes to the cloud are to be handled manually by the human user.
- **LOCAL ONLY**: Git operations should be limited to `git checkout`, `git add`, `git commit`, and `git branch`.