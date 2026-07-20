---
name: code-standards
description: Core engineering conventions for this project -- naming, file/folder structure, mobile responsiveness, toast notifications, features.md maintenance, explanation style, guardrails around sensitive files, and CSS/theme variables. Use this skill before writing, reviewing, or modifying ANY code in this project, every single time -- not just when one of these specific topics comes up. Also consult it before adding an npm package, splitting a file, adding a toast, touching anything Supabase/auth-related, or introducing a new color.
---

# Project Code Standards

Read this in full before writing or changing any code in this project.
These rules apply to every task, every session -- not just the current
request. If a rule here conflicts with something asked for in a specific
prompt, stop and ask rather than silently choosing one.

## 1. Naming

- Every variable, function, and type name should tell a reader what it *is*
  or what it *does* without needing to open another file.
- No single-letter variables except a trivial numeric loop counter (`i`,
  `j` in a plain `for` loop). Anything holding a `Song`, `Setlist`,
  `SetlistSectionWithSong`, etc. should be named after that type (`song`,
  `setlist`, `section`), not `s`, `x`, `item`, `data`.
- Function names start with a verb that matches what they do:
  `get`/`fetch` (read), `create`/`add`, `update`/`save`, `delete`/`remove`,
  `toggle`, `handle` (event handlers only). Don't mix -- e.g. don't name a
  function that saves data `handleClose` just because it's called from a
  close button.
- Booleans read as yes/no questions: `isLocked`, `hasChanges`,
  `showFilters` -- not `locked`, `changes`, `filters`.
- No abbreviations that aren't obvious (`btn`, `cfg`, `idx`) unless the
  existing codebase already uses them consistently.
- If a name is actively misleading (does more than its name implies, or
  the same name is reused for two different things elsewhere in the
  project), flag it instead of silently fixing it -- naming collisions can
  be riskier to fix than they look.

## 2. File and folder structure

- If a change introduces a new concept (a new kind of component, a new
  hook, a new data operation), create a new file for it rather than adding
  it into an existing file that doesn't already own that concern.
- Follow the existing folder conventions:
  - `app/` -- routes only (pages, layouts, API route handlers)
  - `components/<domain>/` -- UI grouped by feature (`songs/`, `setlists/`)
  - `components/ui/` -- generic, feature-agnostic UI (buttons, pickers, dialogs)
  - `lib/services/` -- all direct Supabase/database access
  - `lib/hooks/` -- reusable stateful logic
  - `lib/` (root) -- plain types, constants, and pure utility functions
- Keep new files roughly under 200 lines. If a file is growing past that
  because it's doing more than one job, split it -- but don't split purely
  for line count if the result would be an orchestrator component with
  scattered one-line children; only split along real seams.
- Don't introduce a new npm package without asking first, even for a small
  utility -- check if something already in `package.json` can do it.

## 3. Mobile responsiveness (non-negotiable for every UI change)

- Every UI change must work correctly at a narrow mobile width
  (~375-400px), not just desktop. Reuse the existing responsive patterns
  in this codebase (`sm:` breakpoints, `flex-col sm:flex-row`, the
  `min-h-[44px]` / `min-h-[36px]` tap-target sizing already used on
  buttons) rather than inventing new patterns.
- Anything tappable needs a real tap target -- don't ship a button or icon
  smaller than the existing minimum sizes in this project.
- After any UI change, explicitly state what was checked at mobile width
  and what was looked for (overflow, wrapping, tap target size) -- don't
  just say "should be responsive."

## 4. Notifications (toasts)

- Exactly one toast per user action. A single save, delete, or create
  action fires exactly one success toast and, on failure, exactly one
  error toast -- never both, never two of the same kind.
- Before adding a new toast call, check whether the action already
  triggers one somewhere else in the call chain (e.g. a shared handler
  calling a lower-level function that also toasts).
- Error toasts describe what failed in plain terms a non-developer would
  understand (e.g. "Failed to save lineup" not "500: Internal Server
  Error").

## 5. features.md must stay current

- Every change that adds, modifies, or removes a user-facing feature must
  update `features.md` in the same step as the code change -- not as an
  afterthought.
- Use this exact template for each entry:
  ```
  ## [Feature name]
  Where: [file/folder path]
  What it does: [one or two plain-language sentences]
  Status: working / in progress / known limitation
  ```
- If a change is purely internal (refactor, rename, file split) and
  doesn't change what the app *does*, it does not need a `features.md`
  entry -- but say so explicitly in the summary so it's clear that was
  intentional, not missed.

## 6. Explain like I'm learning

- The priority is understanding this codebase, not just getting working
  code. After any change, give a short plain-language explanation of what
  changed and *why* -- not a restated diff. If a judgment call was made
  (e.g. one of two reasonable approaches), state the alternative and why
  this one was picked.

## 7. Guardrails -- stop and ask before touching these

- Any Supabase column name, table name, or `.select()` relationship syntax
- `lib/supabase.ts`, environment variables, or anything auth/RLS-related
- Any existing API request/response JSON key shape
- Database migrations of any kind

If a task seems to require touching one of these, stop, describe what
needs to change and why, and wait for confirmation before proceeding.

## 8. Verify before moving on

- After any code change, run `npx tsc --noEmit` (or the build) and confirm
  zero errors before considering the task done.
- For multi-step tasks, complete and verify one step at a time -- don't
  batch several structural changes together and report them all at once.
- Recommend a git commit after each verified, working step. Don't let
  multiple unrelated changes pile up uncommitted.
- When uncertain about anything -- even something small -- ask before
  proceeding. Do not silently make the call and move on. Being asked is
  always preferred over having a decision made without input.

## 9. Colors and theming

- This project uses CSS variables defined in `app/globals.css` under
  `:root` (light) and `html.dark` (dark), not hardcoded hex values in
  components. Any new color must be added as a variable in *both* blocks,
  with a sensible dark-mode equivalent -- not just added to one.
- Don't introduce a raw hex value directly in a component's `style={}` --
  reference a CSS variable instead, matching how existing components do
  it.
