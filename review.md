# Style Refactor Review Findings

Reviewed on 2026-09-05 against `23cecb5f2fb00df47da06a9687c6b027ed4ce3e4` on `style-refactor`.
Base: `origin/main` (merge-base comparison).
PR: [#36 — refactor!: refresh style system](https://github.com/subframe7536/moraine/pull/36).

The branch was fast-forwarded from `81430b17` to `23cecb5f` before this update.
That update added this document only; the reviewed implementation and test inputs did not change.
All findings below remain **OPEN**, are **introduced by this branch**, and have **HIGH confidence**.
Intentional removals of legacy CSS bundles, cva, and Tailwind v3 support are excluded.

## PR comment reconciliation

All five inline comments and the submitted review summary were read. There were no top-level conversation comments at the time of review.

| PR comment | Disposition |
| --- | --- |
| [Theme persistence](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707778) | Confirmed; added F04. |
| [AvatarGroup root leakage](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707788) | Confirmed for classes; corrected the broader styles claim in F01. |
| [Leading loading slot](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707799) | Confirmed; incorporated in F02. |
| [Trailing loading slot](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707805) | Merged into F02. Instance loading classes already reach this position; provider/group loading classes and all loading styles do not. The missing aria-hidden prop is real, but an actual announcement depends on the supplied icon, so it is not counted as a separate confirmed screen-reader regression. |
| [Overlay root slot types](https://github.com/subframe7536/moraine/pull/36#discussion_r3939707814) | Confirmed across six components; retained as F03. |

## Finding index

| ID | Priority | Finding | Fix effort | Fix risk |
| --- | --- | --- | --- | --- |
| F01 | P2 | AvatarGroup root classes leak into child avatars | S | Low |
| F02 | P2 | Button loading overrides bypass the shared resolver | S | Low |
| F03 | P2 | Overlay trigger styling is absent from provider slot types | S | Low |
| F04 | P2 | Documentation refresh discards the saved theme preference | S | Low |
| F05 | P2 | Resizable applies divider geometry to the visible grip | S | Low |
| F06 | P2 | Select and MultiSelect ignore provider size defaults | S | Medium |
| F07 | P2 | Group provider overrides do not reach child-owned slots | S | Medium |
| F08 | P2 | Default/state classes overwrite resolved instance classes | M | Low |
| F09 | P2 | SidebarFrame renderer classes override instance classes | S | Low |

Effort includes focused regression coverage: S is hours; M is roughly a day.
F01 was previously labeled P1; it is classified as P2 here because the confirmed impact is localized layout/style corruption when root overrides are supplied.

## F01 — AvatarGroup root classes leak into child avatars

**Evidence:** [avatar-group.tsx:154](src/elements/avatar/avatar-group.tsx#L154), [avatar.tsx:219](src/elements/avatar/avatar.tsx#L219), [avatar.tsx:233](src/elements/avatar/avatar.tsx#L233).

AvatarGroup passes the complete instance classes object into each AvatarFace. The nested resolver still reads `classes.root`, even though `rootSlot="item"` excludes the direct `class` value from that resolver. Its result is then applied to the child span. Supplying `classes={{ root: 'p-8', item: 'group-item' }}` therefore gives every avatar the group container's padding.

The current child style expression uses `local.style` directly when `rootSlot === 'item'`, so the PR comment's claim that `styles.root` also leaks is not supported by the current render path. Preserve that existing style isolation.

**Fix:** Exclude group-owned root classes when forwarding child slot overrides, while preserving image, fallback, fallbackIcon, and badge overrides. Keep item overrides on the child root. Do not use the obsolete slot name `indicator` from the previous version of this report.

**Regression coverage:** Render a non-empty group with distinct root/item classes and styles. Assert root classes occur only on the group container, item overrides reach every avatar, and child slots retain their overrides. Coordinate the forwarding change with F07.

## F02 — Button loading overrides bypass the shared resolver

**Evidence:** [button.tsx:269](src/elements/button/button.tsx#L269), [button.tsx:299](src/elements/button/button.tsx#L299), [button.tsx:321](src/elements/button/button.tsx#L321), [button.class.ts:7](src/elements/button/button.class.ts#L7).

The recipe declares a loading slot, but the component injects only the spinner constant and `local.classes?.loading` into leading/trailing state classes. It renders styles for leading/trailing without resolving the loading slot. Consequently, provider and ButtonGroup `classes.loading` and every layer's `styles.loading` are ignored.

Both positions already receive instance loading classes through `stateCls`; the trailing-position PR comment overstates that omission. The trailing spinner also lacks the leading spinner's conditional `aria-hidden`, which should be handled consistently when composing loading presentation.

**Fix:** Resolve loading classes/styles through the provider → group → instance chain and compose them with the active icon position. Preserve ordinary leading/trailing styling and ensure the resolver does not recursively refer to itself through `stateCls`.

The API returns values directly:

```ts
resolved.slotClass('loading')
resolved.slotStyle('loading')
```

Do not append another `()`; the previous report's example attempted to call the returned string/style object.

**Regression coverage:** Test leading and trailing loading placement, provider/group/instance conflicting loading classes, loading styles, reactive updates, and custom decorative loading icon accessibility.

## F03 — Overlay trigger styling is absent from provider slot types

**Evidence:** [tooltip.tsx:25](src/overlays/tooltip/tooltip.tsx#L25), [tooltip.tsx:228](src/overlays/tooltip/tooltip.tsx#L228), [popover.tsx:17](src/overlays/popover/popover.tsx#L17), [dialog.tsx:32](src/overlays/dialog/dialog.tsx#L32), [sheet.tsx:21](src/overlays/sheet/sheet.tsx#L21), [menu/types.ts:120](src/overlays/base/menu/types.ts#L120).

Tooltip, Popover, Dialog, Sheet, DropdownMenu, and ContextMenu use rootClass/rootStyle for trigger styling, but their public slot types omit root. A provider configuration such as `tooltip: { classes: { root: 'p-2' } }` is therefore rejected by the public type contract even though the runtime reads that key.

**Fix:** Add a consistent root slot to these component slot types, including the shared menu slot surface. Keep trigger/root naming consistent across all six components.

**Regression coverage:** Add public type assertions for provider root classes/styles on all affected components and a reactive runtime test for one representative trigger.

## F04 — Documentation refresh discards the saved theme preference

**Evidence:** [use-theme.ts:29](docs/routes/hooks/use-theme.ts#L29), [use-theme.ts:40](docs/routes/hooks/use-theme.ts#L40), [index.html:13](docs/index.html#L13).

The initial HTML script restores the saved theme, and updateTheme still writes it to localStorage. On mount, however, the hook now unconditionally applies the system theme. Selecting dark mode while the system uses light mode and refreshing first paints dark, then changes back to light. The saved preference is effectively ignored after hydration.

**Fix:** Read and validate the saved preference inside onMount with a try/catch, falling back to the system theme. Keep the initial signal deterministic for SSR.

**Regression coverage:** Test both saved/system disagreements, missing or invalid storage values, and unavailable storage. Assert the mounted theme agrees with the pre-module theme selection.

## F05 — Resizable applies divider geometry to the visible grip

**Evidence:** [resizable.class.ts:13](src/elements/resizable/resizable.class.ts#L13), [resizable.class.ts:24](src/elements/resizable/resizable.class.ts#L24), [resizable.tsx:912](src/elements/resizable/resizable.tsx#L912), [resizable.tsx:954](src/elements/resizable/resizable.tsx#L954).

Divider geometry was moved into the recipe's handle slot, which is now resolved for both the divider and its nested grip button. With `handle` enabled, the default horizontal grip's `w-1` becomes `w-px`; the vertical grip's `h-1 w-6` becomes `h-px w-full`. This was reproduced by evaluating the actual recipe and cn output. Consumer `classes.handle` also unexpectedly changes the whole divider.

**Fix:** Put divider base/orientation classes in the divider slot and keep the grip's geometry in the handle slot. Each element should consume its own slot.

**Regression coverage:** Assert horizontal and vertical grip dimensions and verify handle overrides do not modify the divider, with and without a custom handle renderer.

## F06 — Select and MultiSelect ignore provider size defaults

**Evidence:** [select.tsx:199](src/forms/select/select.tsx#L199), [select.tsx:341](src/forms/select/select.tsx#L341), [select.tsx:398](src/forms/select/select.tsx#L398), [multi-select.tsx:706](src/forms/select/multi-select.tsx#L706), [multi-select.tsx:788](src/forms/select/multi-select.tsx#L788).

Provider variants are merged in the outer component, but BaseSelect receives the original rest props rather than the provider-derived size. Control recipes and option styles then use `api.field.size()`, which defaults to md. Setting `config.select.variants.size = 'lg'` or the equivalent multiSelect setting has no effect without an instance/context size.

**Fix:** Feed the provider size into field size resolution as a default layer while retaining instance and FormField context precedence. Avoid making a provider default appear to be an explicit instance prop if that would override composition context.

**Regression coverage:** Test initial provider size, reactive provider replacement, explicit instance override, and FormField composition for both components, including option dimensions.

## F07 — Group provider overrides do not reach child-owned slots

**Evidence:** [avatar-group.tsx:154](src/elements/avatar/avatar-group.tsx#L154), [avatar.tsx:125](src/elements/avatar/avatar.tsx#L125), [checkbox-group.tsx:247](src/forms/checkbox-group/checkbox-group.tsx#L247), [checkbox-group.tsx:452](src/forms/checkbox-group/checkbox-group.tsx#L452).

AvatarGroup forwards raw instance classes/styles to AvatarFace, so its provider's image/fallback/fallbackIcon/badge overrides are never consumed. CheckboxGroup similarly forwards merged.classes/styles, but that merge contains provider variants only. Its provider's control/label/description overrides therefore never reach Checkbox. The children read the standalone avatar/checkbox provider keys, which cannot supply their groups' missing configuration.

**Fix:** Explicitly resolve and forward child-owned group slots, preserving standalone child defaults, group/provider configuration, and final instance precedence. Map item/root ownership deliberately rather than forwarding the entire group object. Coordinate AvatarGroup changes with F01.

**Regression coverage:** Verify AvatarGroup fallback and CheckboxGroup control classes/styles from group providers, their reactive replacement, instance conflicts, and isolation of group root versus item slots.

## F08 — Default/state classes overwrite resolved instance classes

Several migrated render paths append component defaults after resolveComponentStyle has already applied instance overrides. cn removes the conflicting user classes because the defaults now appear last; this reverses the previous merge order.

| Evidence | Trigger | Actual result |
| --- | --- | --- |
| [checkbox.tsx:483](src/forms/checkbox/checkbox.tsx#L483) | Card variant with `class="p-0"` | Default md padding `p-3.5` replaces p-0. |
| [card.tsx:188](src/elements/card/card.tsx#L188) | Non-compact card without footer, `classes.body="mb-0"` | Default mb-6 replaces mb-0. |
| [stepper.tsx:413](src/navigation/stepper/stepper.tsx#L413) | `classes.trigger="bg-red-500 text-white border-red-600"` | The current state's default background/text/border replaces all three. |
| [radio-group.tsx:451](src/forms/radio-group/radio-group.tsx#L451) | Non-table variant with `class="gap-0"` | Default gap-2 replaces gap-0. |
| [file-upload.tsx:885](src/forms/file-upload/file-upload.tsx#L885), [file-upload.tsx:904](src/forms/file-upload/file-upload.tsx#L904) | Disabled control with `classes.control="bg-red-500"` | Default bg-muted/32 replaces the custom background. |

**Fix:** Put conditional default/state classes into the appropriate recipe/resolver layer before instance classes. Preserve the documented stateCls → instance order and cover every listed call site; changing cn itself would affect unrelated valid merges.

**Regression coverage:** Assert each conflicting override survives, defaults remain when no override is supplied, and changing the component state updates its default classes without removing instance overrides.

## F09 — SidebarFrame renderer classes override instance classes

**Evidence:** [sidebar-frame.tsx:201](src/navigation/sidebar-frame/sidebar-frame.tsx#L201), [sidebar-frame.tsx:401](src/navigation/sidebar-frame/sidebar-frame.tsx#L401), [sidebar-frame.tsx:441](src/navigation/sidebar-frame/sidebar-frame.tsx#L441).

The renderer now appends its props.classes after resolved slot classes, which already include instance configuration. The default desktop renderer's overflow-hidden removes `classes.sidebar="overflow-visible"`, clipping intentional overflow. A custom renderer's `<ctx.main classes="p-4" />` likewise removes the component instance's `classes.main="p-8"`. Style objects at the same call sites still use renderer → instance order.

**Fix:** Treat renderer-provided classes as the composition layer before instance classes, preserving recipe defaults as the weakest layer.

**Regression coverage:** Cover the default desktop sidebar overflow conflict and a custom main renderer padding conflict.

## Verification and scope

- `nub run typecheck`: passed.
- `nubx vitest run src/shared/style src/shared/provider src/shared/utils.test.ts src/unocss/theme.test.ts src/tailwind/tailwind.test.ts`: 6 files, 115 tests passed.
- `nubx vitest run src docs`: 110 files, 1,658 tests passed.
- Direct read-only evaluation of the actual cn/resizable recipe confirmed F05 and representative F08/F09 conflicts.
- Tests ran against `81430b17` earlier in this review session. The pull to `23cecb5f` changed only review.md, so these results apply to the same implementation; they are not a claim of a fresh post-pull test run.
- Existing passing tests do not cover the failing configurations documented above. No source or test files were modified.
- The review covered branch changes and direct consumers, focusing on styling, composition, public types, and documentation behavior. Production browser hydration, packed npm installation, and the `test/acceptance`/`test/consumer-fixtures` suites were not run in this pass. No repository-wide dependency/security audit is claimed.

## Corrections and excluded claims

- Group `styles.root` leakage is not reported: the current AvatarFace item branch uses the explicitly passed item style.
- Both Button loading positions already read instance `classes.loading`; only the missing layers are reported.
- The resolver's slotClass/slotStyle methods return values, not accessors.
- Legacy API removal and manual tarball release validation follow the stated PR scope and are not defects.
- A suspected CodeBlock hydration mismatch from synchronous ref measurement was excluded: a reduced in-memory Solid SSR/DOM + jsdom reproduction with scrollHeight = 200 hydrated without errors and preserved the server DOM. This is not a full production-browser hydration test.
