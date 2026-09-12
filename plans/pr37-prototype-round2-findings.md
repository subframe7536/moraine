# PR #37 prototype findings — round two, 2026-09-12

## Decision and provenance

The tested Select, manual Form, Tabs and workflow Stepper paths are feasible. Carry their regressions into the production plans; no numbered plan is complete from this evidence. FormField remains deferred, and Stepper requires the independent semantic decision in plan 038.

- Local experiment branch: prototype/pr37-composition.
- Starting commit: `eb8e48244e77edb70d7fc7760cfd4754568158bc`.
- Completed round-two commit: `f798e2665a9751cc129b3cda87a687568b0830c0`.
- The prototype implementation is not part of this planning PR. Its source and report live under src/prototype/pr37 and plans/prototype/pr37/round2 on that local branch; these are provenance paths, not files available on this branch.
- Toolchain: nub 0.8.3, Solid 1.9.15, TypeScript 7.0.2, Vitest 4.1.11; Chromium 152.0.7977.0 through Playwright.

## Actual results

| Check | Result |
| --- | --- |
| Final focused prototype plus existing Button tests | 138 passed across 8 files, including 42 prototype tests from both rounds |
| New round-two cases | 20 runtime and 4 server/hydration cases; one server case records missing Select popup content |
| Source/emitted-declaration contracts | Passed, with 27 negative cases, including 12 added this round |
| QA and diff hygiene | Passed |
| Round-two Chromium runner | 11 checks passed, zero page errors |
| Full suite at an intermediate revision | 1976 passed, 3 failed, 1979 total |

The three full-suite failures comprised two pre-existing production FormField Select/MultiSelect required/shared-labelling failures at src/forms/form/form-field.test.tsx:543 and one prototype native serialization regression. The latter was fixed and included in the final 138-pass focused rerun. The full suite was not rerun after that isolated fix. The earlier missing-nubx consumer failures did not recur with the repaired toolchain. Do not claim an all-green full repository.

## Findings and plan ownership

| Plan | Evidence to retain |
| --- | --- |
| [012 Select internals](012-select-internals.md) | Complete options must stay independent of mounted virtual rows. Feeding registration back into the logical data recreated row identities and exhausted the initial test worker's heap. Stable logical data fixed the loop. |
| [012](012-select-internals.md), [013 Select parts](013-select-parts.md) | A 1,000-option fixed-height window mounted fewer than 15 rows; complete-data search and End navigation reached unmounted entries while application For still rendered Item JSX. |
| [012](012-select-internals.md), [022 FormField](022-form-field.md) | Native select.value must synchronize after changed option DOM values exist. A cancelled-reset regression exposed a displayed selection with no submitted value; post-render synchronization fixed it. Controlled value, field store and serialization must agree before submit and after reset. |
| [013](013-select-parts.md) | Closed labels resolve from explicit metadata or raw/explicit Value fallback without mounting popup children. Trigger as Button types, keyboard search, disabled/readOnly, listbox IDREFs, focus restoration and repeated opening passed. |
| [022](022-form-field.md) | One useField call per field root, existing Form/store reuse, nested schema paths, schema/explicit/suppressed errors and reset passed. Stable control IDs support labels after controls; manual descriptions used explicit IDs whose targets mount/unmount with them. |
| [010 Tabs](010-tabs.md) | Controlled selected-trigger removal preserves value but needs a remaining tabbable trigger. Uncontrolled fallback must respect a locally disabled trigger over stale metadata. Reactive duplicate identities, explicit counterpart absence and bordered/scrolled indicator geometry on both axes were checked. |
| [002 Browser](002-browser-regressions.md), [005 Overlay lifecycle](005-overlay-lifecycle.md) | Default-open Select inherited the Popper/Portal omission: no server listbox. Closed labels/native targets and client popup checks do not satisfy open-popup SSR/hydration. |
| [038 Stepper](038-stepper.md) | Explicit completion identities, linear guards, backward navigation, controlled rejection, manual keyboard focus, reordering and aria-current="step"/region SSR passed. This changes existing defaults/tab semantics and remains a candidate. |

## Coverage limits

Select was string-only and fixed-height. Variable-height/grouped/asynchronous virtualization, numeric values, MultiSelect, native autofill, the full IME/platform matrix and nested overlays remain unverified. The experimental Select.useCollection name is not a required production API.

Form did not implement a default/manual compatibility facade, field arrays/path switching or multiple editing targets. Its explicit controlId/describedBy mechanism demonstrates a first-server-safe option, not automatic discovery of description/error JSX. Production must choose and document the association contract.

Tabs hasContent/hasTrigger flags proved tested IDREF handling; they do not certify arbitrary missing-panel anatomy or settle the public API. Stepper required complete root order, did not orchestrate async validation and did not test dynamic removal/renaming or optional metadata.

Shared-helper consolidation, production docs/slot migrations, bundle measurements, Firefox/WebKit, other-document/Shadow DOM/multiple-package-copy behavior and assistive technology remain outside the result. Round-one InputGroup schema assertions and shared overlay SSR prerequisites remain unresolved.

## Reproduction provenance

On the local experiment branch, run nub exec vitest --run src/prototype/pr37 src/elements/button, nub src/prototype/pr37/check-declarations.mjs and nub src/prototype/pr37/round2.browser.mjs. The browser runner uses Playwright/Chromium, accepts PROTOTYPE_CHROMIUM, owns its Vite process and generates CSS from the actual docs UnoCSS configuration and source recipes. The interactive fixture is /src/prototype/pr37/round2.html. Browser tooling was external to repository dependencies.

These commands and paths are available on the experiment branch, not this plan-only PR. Port the relevant fixtures into the selected plans' scoped tests before treating them as permanent gates.
