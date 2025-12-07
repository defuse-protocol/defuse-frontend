# Tools

- Use `bun` as node runtime

# Build, Test, and Development Commands

- `bun typecheck` check TypeScript types.
- `bun vitest` to run test
- `bun lint` to run linter and formatter (biomejs)

# Code Style

- Do not use `any` type
- Do not use `as never` cast
- Prefer error as values over exceptions. Use `neverthrow` library
- Do not use barrel files
- Avoid arbitrary strings, use const enums (`as const`) instead.
- Use `@phosphor-icons/react` as icon library
- In catch blocks error is `unknown`: `catch (err: unknown) { ... }`

## React Guidelines

- Double think before using `useEffect` hook, most likely you don't need it (https://react.dev/learn/you-might-not-need-an-effect)

# Testing Guidelines

Write tests with these rules:

- Test files (*.test.ts) should be colocated with source files.
- Prefer fewer, high-value tests over many similar ones. Do not test the same behaviour twice.
- Use as few mocks as possible. Only mock external dependencies (HTTP, DB, time, randomness, external services). Do not mock the class/module under test itself.
- Treat the code as a black box. Do not test implementation details (private helpers, internal state, specific algorithms).
- Do not test logs or logging behaviour unless they are part of the public contract or user-visible output.
- Do not write tests whose only purpose is to check TypeScript's static types. Types are checked at compile time. Instead, focus on runtime behaviour. Only exception if the type is complex and we need to test the type behaviour separately.
- Focus tests on:
    - Main "happy path" flows.
    - Important edge cases and error handling.
    - Regression scenarios that previously broke.
- Use clear, descriptive test names that explain the scenario and the expected result.
- Prefer Arrange–Act–Assert structure inside each test.
- Avoid heavy fixtures or setup when not needed.
- Use Vitest syntax with TypeScript.
- Do not write conditional tests (e.g. `if (condition) { ... }`). Tests should be deterministic. If you still need conditional tests, use `expect.assertions(N)` to ensure all expected assertions run.
- When asserting collaborator calls, use `expect.objectContaining` and focus on important fields instead of all properties.
- Avoid using "should" in test descriptions, use present tense instead.
- Prefer not to use dynamic imports
- If tests can't be nicely written, or the test becomes verbose, then it means the source code is bad. In such cases suggest a better alternative for the code, so it is testable. Simplicity and maintainability are the key for robust code.

# Commit Instructions

- Use conventional commit messages.
- Use imperative tense in commit messages.
- Prefer short still descriptive commit messages without long tail description.

## Remove AI code slop before commiting

Check the diff, and remove all AI generated slop introduced in this branch.

This includes:
- Extra comments that a human wouldn't add or is inconsistent with the rest of the file
- Extra defensive checks or try/catch blocks that are abnormal for that area of the codebase (especially if called by trusted / validated codepaths)
- Casts to any to get around type issues
- Any other style that is inconsistent with the file

# Frontend Aesthetics

You tend to converge toward generic, "on distribution" outputs. In frontend design,this creates what users call the "AI slop" aesthetic. Avoid this: make creative,distinctive frontends that surprise and delight.

Focus on:
- Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
- Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
- Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
- Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
