# Contributing to Grupo Estuda

Thanks for your interest in contributing! This guide keeps changes consistent and safe for Expo/EAS builds.

## Prerequisites
- Node.js 20.19.4+ (see `.nvmrc`)
- pnpm or npm

## Setup
1. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```
2. Create your env file:
   ```bash
   cp .env.example .env
   ```
3. Start the app:
   ```bash
   pnpm start
   # or
   npm run start
   ```

## Development guidelines
- Keep commits small and descriptive.
- Avoid committing secrets; use `.env` locally and update `.env.example` when needed.
- Prefer `expo start` for local development.

## Checks
- Typecheck:
  ```bash
  ./node_modules/.bin/tsc --noEmit
  ```
- Lint (if needed):
  ```bash
  pnpm lint
  ```

## EAS builds
- Preview APK:
  ```bash
  eas build -p android --profile preview
  ```
- Production (AAB/iOS):
  ```bash
  eas build -p android --profile production
  eas build -p ios --profile production
  ```
