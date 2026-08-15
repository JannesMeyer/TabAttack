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

## Drag and drop (Native HTML5 Drag and Drop)

Uses native HTML5 Drag and Drop APIs (`draggable`, `dataTransfer`, `onDragOver`, `onDrop`) for seamless single-window and cross-window drag and drop.

### Architecture

- **Tabs**: draggable with MIME type `application/x-tabattack-tabs` transferring `{ tabIds, sourceWindowId }`. Single-tab and multi-selected tabs are bundled together.
- **Active Window**: Each `Tab` renders drop indicators (top/bottom) and computes the target insertion index accounting for reversed list rendering. Empty window container handles drop at index 0.
- **Cross-Window**: Full support for dragging tabs across separate extension windows/pages via `dataTransfer`.

### State management

State lives in `TabStore` with voltai (https://valtio.dev/docs/), not React state.

- **Why external store**: The browser API (`chrome.tabs` and `chrome.windows` events) is the single source of truth and fires async state changes outside React's lifecycle.
