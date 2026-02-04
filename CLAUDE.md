# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Type-check and build for production
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## Adding shadcn/ui Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`. The project uses the `radix-vega` style with `zinc` as the base color.

## Architecture

- **React 19** with Vite 7 and TypeScript
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no separate config file)
- **shadcn/ui** components using Radix UI primitives and `class-variance-authority` for variants
- **Path alias**: `@/` maps to `src/`

## Project Structure

```
src/
├── components/
│   └── ui/        # shadcn/ui components
├── lib/
│   └── utils.ts   # cn() utility for className merging
├── App.tsx        # Root component
├── main.tsx       # Entry point
└── index.css      # Tailwind imports and CSS variables (theme)
```

## Styling

- Theme colors defined as CSS variables in `src/index.css` using OKLCH color space
- Dark mode via `.dark` class on parent element
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- Inter Variable font is the default sans-serif
