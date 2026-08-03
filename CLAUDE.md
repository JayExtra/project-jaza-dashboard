# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

# Project Overview

Project Jaza Dashboard is a fundraising/donation management platform . It's a React 19 + TypeScript + Vite app styled with Tailwind, using shadcn-style UI components.

It's an admin dashboard for organizations or individuals running fundraising campaigns, with sections for:

Core: Overview, Campaigns, Payments, Donors, Analytics
AI tools: Smart Reports, AI Agent, AI Settings (marked with "AI" badges)
Growth tools: Page Builder, Challenges
Outreach: Integrations, Email & SMS, Rewards
Ops: Reports, Settings
It also has a full auth system (sign in/up, email verification, forgot password) built on a secure hybrid token model — refresh token in an HttpOnly cookie, access token kept in memory only, with silent refresh on startup (documented in AUTH_IMPLEMENTATION.md). There's also a TOKEN_REFRESH_DEDUP.md doc, presumably about deduplicating concurrent refresh calls.

So in short: it's the admin/dashboard front-end for a donation/fundraising platform, letting organizations or individuals manage campaigns, donors, payments, and use AI-assisted tools (reports, agent, page builder) to grow fundraising.

# Tech Stack

- Framework: React + Vite
- Language: Typescript
- Styling: Tailwind CSS
- Design System: Shadcn
- Package Manager: npm

# Developer Commands

```bash
npm install     # Install dependencies
npm run dev     # Start development server 
npm run build   # Build for production
npm run lint    # Run ESLint
```
# Project Structure

```
src/
    assets/  # graphic and image resource with .svg .webp .png .jpg
    components/
        auth/     # auth page section components
        layout/   # panels , sidebars, topbars
        ui/       # reusable ui components 
    context/      # holds the context logic for for application wide state
    hooks/        # holds all the custom React Hooks for various functionality
    lib/          # holds common files reused accross the project  
    pages/        # holds all pages/destinations within the project
    types/        # holds all models that represent real world objects  

```

# Code Conventions

- Use TypeScript for all new files
- Prefer functional components with hooks
- Use Tailwind utility classes for styling - avoid inline styles
- Keep components focused and single-purpose
- When building different components/pages always refer to DESIGN.md for UI design guidance

# What to avoid

- Do not modify 'vite.config.ts' without understanding the existing setup
- Do not add dependencies without checking if existing utilities cover the necessary
- Do not add the following to the context:

    # Vite & Frontend Build Outputs
     - dist/
     - out/
     - .vite/
     - *.local

    # TypeScript & Test Coverage output
     - *.tsbuildinfo
     - coverage/
     - .nyc_output/

    # Dependencies
     - node_modules/

    # Visual Assets & Designs
    # (Kept open for explicit image uploads, but blocks generic heavy assets)
     - src/assets/videos/
     - src/assets/fonts/
     - *.ico

    # Lockfiles & Manifests (Massive files that drain tokens)
     - package-lock.json
     - yarn.lock
     - pnpm-lock.yaml
     - bun.lockb

    # IDEs, System, and Environment Secrets
     - .vscode/
     - .idea/
     - .DS_Store
     - Thumbs.db
     - .env
     - .env.*
     - !.env.example

    # Linting & Formatting Caches
     - .eslintcache
     - .prettiercache


