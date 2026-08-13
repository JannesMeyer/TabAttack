# TabAttack

Browser extension for managing tabs. Targets both Chrome and Firefox.

## Tooling

- **Package manager**: `bun` (not npm/npx). Use `bun add`, `bun remove`, `bun tsc`, `bun run <script>`.
- **Bundler**: `bun build` (see `bundle` script in package.json)
- **Type checking**: `bun tsc`
- **Dev server**: `bun run start`

Do NOT run the formatter (`dprint` and/or `fmt`) because it will invalidate your file cache. Also don't run the `bundle` script, because I am running the dev server in the background.

Do NOT commit to git. I do the commits.

## Code style

- Tabs for indentation
- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- Use `type` imports (`import type { ... }`) due to `verbatimModuleSyntax`

## Drag and drop (`@dnd-kit/react`)

Uses the **latest** `@dnd-kit/react` + `@dnd-kit/dom` (not the legacy `@dnd-kit/core`/`@dnd-kit/sortable`).
Docs: https://dndkit.com/react/quickstart/

### Architecture

Two independent sortable scopes, separated by `type`/`accept`:

- **Windows** (`type: 'window'`)
- **Tabs** (`type: 'tab'`, `group: windowId`): vertically sortable within each window, and draggable across windows via the `group` prop. Each `Tab` uses `useSortable`. Each `Window` uses `useDroppable` with `CollisionPriority.Low` so tabs can be dropped into empty windows.
- Tab lists are rendered reversed (`.toReversed()`). We flip the indices internally to account for this.

### State management

State lives in `TabStore` with voltai (https://valtio.dev/docs/), not React state.

- **Why external store**: The browser API (`chrome.tabs` and `chrome.windows` events) is the single source of truth and fires async state changes outside React's lifecycle.
