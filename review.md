# Style Refactor Review Resolution

Reviewed on 2026-09-05 against `23cecb5f2fb00df47da06a9687c6b027ed4ce3e4` on `style-refactor`.
Base: `origin/main` (merge-base comparison).
PR: [#36 — refactor!: refresh style system](https://github.com/subframe7536/moraine/pull/36).

The branch was fast-forwarded from `81430b17` to `23cecb5f` before review. The update added this document only.
All implementation findings have been resolved in the current working tree, except F04, which is closed by the documented product decision.

## PR comment reconciliation

All five inline comments and the submitted review summary were read. There were no top-level conversation comments at the time of review.

| PR comment                                                                                         | Resolution                                                                                                             |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Theme persistence](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707778)        | Closed by product decision: documentation uses the system preference on every load and never persists a manual choice. |
| [AvatarGroup root leakage](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707788) | Fixed: group root styling stays on the group; child-owned slots are forwarded explicitly.                              |
| [Leading loading slot](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707799)     | Fixed: loading styling now goes through the shared resolver.                                                           |
| [Trailing loading slot](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707805)    | Fixed with the same resolver path and matching decorative icon semantics.                                              |
| [Overlay root slot types](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707814)  | Fixed with a `trigger` slot across all overlay trigger APIs. No overlay `root` slot was added.                         |

## Finding index

| ID  | Status | Resolution                                                                                                        |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| F01 | Fixed  | AvatarGroup maps only `image`, `fallback`, `fallbackIcon`, and `badge` to AvatarFace; `root` remains group-owned. |
| F02 | Fixed  | Button resolves the `loading` slot as state styling for the active leading or trailing icon.                      |
| F03 | Fixed  | Tooltip, Popover, Dialog, Sheet, DropdownMenu, and ContextMenu expose and consume `trigger`.                      |
| F04 | Closed | Docs default to `prefers-color-scheme` and do not read or write localStorage.                                     |
| F05 | Fixed  | Resizable divider geometry belongs to `divider`; the nested grip consumes only `handle`.                          |
| F06 | Fixed  | Select and MultiSelect pass the provider size as a field fallback, below instance and form-field values.          |
| F07 | Fixed  | AvatarGroup and CheckboxGroup resolve and forward child-owned group slots.                                        |
| F08 | Fixed  | Conditional defaults enter the resolver state layer before instance classes.                                      |
| F09 | Fixed  | SidebarFrame renderer classes and styles enter the resolver composition layer before instance overrides.          |

## Verification

- `nub run typecheck` passes after the changes.
- Focused Vitest coverage exercises the affected components, provider precedence, and representative overlay trigger styling.
- The review excludes intentional removal of legacy CSS bundles, cva, and Tailwind v3 support.
