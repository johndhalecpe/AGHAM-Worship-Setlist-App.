# Project Rules — Read This Before Every Change

opencode: read this entire file before writing or changing any code in this
project. These rules apply to every task, every session, forever — not just
the current request. If a rule here conflicts with something I ask you to do
in a specific prompt, stop and ask me rather than silently choosing one.

This file has two parts:
- **Part A** — permanent rules. Never delete these.
- **Part B** — the current one-time task list. Work through it top to bottom.
  When a task is fully done and verified, delete that task's section from
  this file so the list stays current. Do not delete Part A.

---

## Part A — Permanent Rules

### 1. Naming
- Every variable, function, and type name should tell a reader what it *is*
  or what it *does* without needing to open another file.
- No single-letter variables except a trivial numeric loop counter (`i`, `j`
  in a plain `for` loop). Anything holding a `Song`, `Setlist`,
  `SetlistSectionWithSong`, etc. should be named after that type
  (`song`, `setlist`, `section`), not `s`, `x`, `item`, `data`.
- Function names start with a verb that matches what they do:
  `get`/`fetch` (read), `create`/`add`, `update`/`save`, `delete`/`remove`,
  `toggle`, `handle` (event handlers only). Don't mix — e.g. don't name a
  function that saves data `handleClose` just because it's called from a
  close button.
- Booleans read as yes/no questions: `isLocked`, `hasChanges`, `showFilters`
  — not `locked`, `changes`, `filters`.
- No abbreviations that aren't obvious (`btn`, `cfg`, `idx`) unless the
  existing codebase already uses them consistently.
- If you find a name that's actively misleading (does more than its name
  implies, or the same name is reused for two different things elsewhere in
  the project), flag it to me instead of silently fixing it — naming
  collisions can be riskier to fix than they look.

### 2. File and folder structure
- If a change introduces a new concept (a new kind of component, a new
  hook, a new data operation), create a new file for it rather than adding
  it into an existing file that doesn't already own that concern.
- Follow the existing folder conventions:
  - `app/` — routes only (pages, layouts, API route handlers)
  - `components/<domain>/` — UI grouped by feature (`songs/`, `setlists/`)
  - `components/ui/` — generic, feature-agnostic UI (buttons, pickers, dialogs)
  - `lib/services/` — all direct Supabase/database access
  - `lib/hooks/` — reusable stateful logic
  - `lib/` (root) — plain types, constants, and pure utility functions
- Keep new files roughly under 200 lines. If a file is growing past that
  because it's doing more than one job, split it — but don't split purely
  for line count if the result would be an orchestrator component with
  scattered one-line children; only split along real seams (see the
  earlier refactor conversation for what "real seams" looked like in this
  project).
- Don't introduce a new npm package without asking me first, even for a
  small utility — check if something already in `package.json` can do it.

### 3. Mobile responsiveness (non-negotiable for every UI change)
- Every UI change must work correctly at a narrow mobile width
  (~375–400px), not just desktop. Reuse the existing responsive patterns
  in this codebase (`sm:` breakpoints, `flex-col sm:flex-row`, the
  `min-h-[44px]` / `min-h-[36px]` tap-target sizing already used on
  buttons) rather than inventing new patterns.
- Anything tappable needs a real tap target — don't ship a button or icon
  smaller than the existing minimum sizes in this project.
- After any UI change, explicitly state in your summary that you checked
  it at mobile width and what you looked for (overflow, wrapping, tap
  target size) — don't just say "should be responsive."

### 4. Notifications (toasts)
- Exactly one toast per user action. A single save, delete, or create
  action fires exactly one success toast and, on failure, exactly one
  error toast — never both, never two of the same kind.
- Before adding a new toast call, check whether the action already
  triggers one somewhere else in the call chain (e.g. a shared handler
  calling a lower-level function that also toasts).
- Error toasts should describe what failed in plain terms a non-developer
  would understand (e.g. "Failed to save lineup" not "500: Internal Server
  Error").

### 5. features.md must stay current
- Every change that adds, modifies, or removes a user-facing feature must
  update `features.md` in the same step as the code change — not as an
  afterthought.
- Format for each entry:
  ```
  ## [Feature name]
  Where: [file/folder path]
  What it does: [one or two plain-language sentences]
  Status: working / in progress / known limitation
  ```
- If a change is purely internal (refactor, rename, file split) and doesn't
  change what the app *does*, it does not need a features.md entry — but
  say so explicitly in your summary so I know it was intentional.

### 6. Explain like I'm learning
- My priority is understanding this codebase, not just getting working
  code. After any change, give me a short plain-language explanation of
  what changed and *why* — not a restated diff. If you made a judgment
  call (e.g. picked one of two reasonable approaches), tell me what the
  alternative was and why you picked what you picked.

### 7. Guardrails — stop and ask before touching these
- Any Supabase column name, table name, or `.select()` relationship syntax
- `lib/supabase.ts`, environment variables, or anything auth/RLS-related
- Any existing API request/response JSON key shape
- Database migrations of any kind
If a task seems to require touching one of these, stop and describe what
you think needs to change and why, and wait for my confirmation.

### 8. Verify before moving on
- After any code change, run `npx tsc --noEmit` (or the build) and confirm
  zero errors before considering the task done.
- For multi-step tasks, complete and verify one step at a time — don't
  batch several structural changes together and report them all at once.
- Recommend a git commit after each verified, working step. Don't let
  multiple unrelated changes pile up uncommitted.

### 9. Colors and theming
- This project uses CSS variables defined in `app/globals.css` under
  `:root` (light) and `html.dark` (dark), not hardcoded hex values in
  components. Any new color must be added as a variable in *both* blocks,
  with a sensible dark-mode equivalent — not just added to one.
- Don't introduce a raw hex value directly in a component's `style={}` —
  reference a CSS variable instead, matching how existing components do it.

---

## Part B — Current Task List

Work through these in order. Delete each section once it's fully done,
verified working (including on mobile), and features.md is updated.

### Task 1: Fix duplicate toast notifications
Audit every `toast.success(...)` and `toast.error(...)` call in the
project. Find every user action (save, delete, create, update) that
currently fires two notifications for one action, and reduce it to one.
Common causes to check for: a handler calling another function that also
toasts, a toast fired both optimistically and again after a server
response, or an effect running twice. Report exactly which files had the
bug and what you changed.

---

## Things I'm flagging that weren't in the original request

I'm adding these as light-touch permanent rules above (not extra tasks),
but calling them out here so you know why they're there:

- **Explaining changes in plain language (rule 6)** — you said learning is
  your priority; without this rule opencode will just hand you diffs.
- **"Stop and ask" guardrails (rule 7)** — you're about to add Supabase
  Auth + RLS soon. Worth locking this down now so no future refactor
  accidentally weakens your security boundary.
- **Verify-before-moving-on + git commit discipline (rule 8)** — this is
  what makes every future big refactor (like the ones we already planned)
  safe to roll back if something breaks.
- **CSS variable discipline for colors (rule 9)** — directly relevant to
  Task 3; without this rule, a new color could get hardcoded in one
  component and forgotten when you add dark mode variants later.
