## What do you want?
Create the initial Settings UI scaffold so we can wire real controls later. This is just the first render with a title and placeholder text.

## Which tab / intent?
- intent: settings

## What data should it use?
- For now: none (static placeholder copy)
- Later: organization profile (name, logo), feature flags, notification prefs

## Acceptance criteria
- [ ] A new Next.js page exists at app/settings/page.tsx
- [ ] The page renders a visible H1 “Scaffold: settings” and helper text referencing this issue number
- [ ] A plan file is created at ops/settings.md that contains the full original issue text
- [ ] A pull request is opened automatically against `main` with label `automated`
- [ ] The PR body lists the intent and route
- [ ] CI runs and the preview deploy is created by Vercel

## Screens / files you expect touched (informational)
- app/settings/page.tsx (new)
- ops/settings.md (new)

<!-- refresh:18581768606 -->
